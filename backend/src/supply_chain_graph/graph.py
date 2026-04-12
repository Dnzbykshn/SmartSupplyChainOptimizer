"""
graph.py — LangGraph Workflow Definitions

Two compiled StateGraphs:
  1. scan_graph: Linear pipeline for proactive route risk monitoring
     START → fetch_routes → scan_news → analyze_risks → save_results → END

  2. chat_graph: ReAct agent loop for conversational AI assistant
     START → agent → (tool call? → tools → agent) → END

Both use Google Gemini via ChatGoogleGenerativeAI.
LangSmith tracing is automatic when LANGCHAIN_TRACING_V2=true.
"""

import os
import json
from datetime import datetime, timezone

from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from supply_chain_graph.state import ScanState, ChatState
from supply_chain_graph.models import RiskScanResult, RouteRisk
from supply_chain_graph.tools_langchain import (
    search_supply_chain_news,
    query_inventory,
    ALL_CHAT_TOOLS,
)


# ═══════════════════════════════════════════════════════════════════════
#  SHARED: LLM Initialization
# ═══════════════════════════════════════════════════════════════════════

def _get_llm(temperature: float = 0.3):
    """Get a ChatGoogleGenerativeAI instance."""
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=temperature,
    )


def _get_supabase():
    """Helper to get a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    from supabase import create_client
    return create_client(url, key)


# ═══════════════════════════════════════════════════════════════════════
#  SCAN GRAPH: Proactive Risk Monitoring Pipeline
# ═══════════════════════════════════════════════════════════════════════

# Default shipping routes to monitor
DEFAULT_ROUTES = [
    "Shanghai → Rotterdam (via Red Sea)",
    "Mumbai → Genoa (via Suez Canal)",
    "Shenzhen → Los Angeles (Trans-Pacific)",
    "Tokyo → Hamburg (via Panama Canal)",
    "Singapore → Felixstowe (via Suez Canal)",
]


def fetch_routes_node(state: ScanState) -> dict:
    """Node 1: Fetch the list of shipping routes to monitor."""
    routes = state.get("routes") or DEFAULT_ROUTES
    print(f"📍 Fetching {len(routes)} routes to monitor...")
    return {"routes": routes, "raw_news": {}, "risk_results": []}


def scan_news_node(state: ScanState) -> dict:
    """Node 2: Search the web for recent news about each route."""
    routes = state["routes"]
    raw_news = {}
    
    for route in routes:
        # Extract key location terms for search
        search_query = f"{route} shipping disruption delay news {datetime.now().year}"
        print(f"🔍 Scanning news for: {route}")
        
        try:
            result = search_supply_chain_news.invoke(search_query)
            raw_news[route] = result
        except Exception as e:
            raw_news[route] = f"Search failed for {route}: {str(e)}"
    
    return {"raw_news": raw_news}


def analyze_risks_node(state: ScanState) -> dict:
    """Node 3: Use Gemini to analyze the news and score each route's risk."""
    llm = _get_llm(temperature=0.2)
    routes = state["routes"]
    raw_news = state["raw_news"]
    risk_results = []
    
    for route in routes:
        news_data = raw_news.get(route, "No news data available.")
        
        prompt = f"""You are a supply chain risk analyst. Analyze the following news data 
for the shipping route "{route}" and provide a risk assessment.

NEWS DATA:
{news_data}

Based on this information, provide a JSON risk assessment with these exact fields:
- route: the shipping route name
- risk_score: integer 1-10 (1=safe, 10=critical)
- risk_category: one of "geopolitical", "weather", "labor", "infrastructure", "piracy", "regulatory", "congestion", "none"
- summary: 2-3 sentence explanation
- news_sources: list of relevant headline strings found
- confidence: "high", "medium", or "low"
- recommended_action: brief action recommendation

Respond ONLY with valid JSON, no markdown formatting."""
        
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            # Parse the JSON response
            content = response.content.strip()
            # Remove markdown code fences if present
            if content.startswith("```"):
                content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
            risk_data = json.loads(content)
            risk_results.append(risk_data)
            score = risk_data.get("risk_score", 0)
            emoji = "🔴" if score >= 7 else "🟡" if score >= 4 else "🟢"
            print(f"  {emoji} {route}: Risk {score}/10")
        except Exception as e:
            print(f"  ⚠️ Analysis failed for {route}: {e}")
            risk_results.append({
                "route": route,
                "risk_score": 0,
                "risk_category": "none",
                "summary": f"Analysis failed: {str(e)}",
                "news_sources": [],
                "confidence": "low",
                "recommended_action": "Manual review required",
            })
    
    return {"risk_results": risk_results}


def save_results_node(state: ScanState) -> dict:
    """Node 4: Save scan results to Supabase and generate summary."""
    supabase = _get_supabase()
    risk_results = state["risk_results"]
    
    high_risk = [r for r in risk_results if r.get("risk_score", 0) >= 7]
    medium_risk = [r for r in risk_results if 4 <= r.get("risk_score", 0) < 7]
    low_risk = [r for r in risk_results if r.get("risk_score", 0) < 4]
    
    # Determine overall status
    max_score = max((r.get("risk_score", 0) for r in risk_results), default=0)
    if max_score >= 8:
        overall = "critical"
    elif max_score >= 7:
        overall = "alert"
    elif max_score >= 4:
        overall = "caution"
    else:
        overall = "clear"
    
    summary = (
        f"Scanned {len(risk_results)} routes: "
        f"{len(high_risk)} high risk, {len(medium_risk)} medium, {len(low_risk)} low. "
        f"Overall status: {overall.upper()}."
    )
    
    # Save to Supabase
    if supabase:
        try:
            for r in risk_results:
                supabase.table("risk_scans").insert({
                    "route": r.get("route", "Unknown"),
                    "risk_score": r.get("risk_score", 0),
                    "risk_category": r.get("risk_category", "none"),
                    "summary": r.get("summary", ""),
                    "news_sources": r.get("news_sources", []),
                    "confidence": r.get("confidence", "low"),
                    "recommended_action": r.get("recommended_action", ""),
                }).execute()
            print(f"💾 {len(risk_results)} risk scan results saved to Supabase")
        except Exception as e:
            print(f"⚠️ Failed to save to Supabase: {e}")
    
    return {"scan_summary": summary}


# Build the Scan Graph
def _build_scan_graph():
    builder = StateGraph(ScanState)
    
    builder.add_node("fetch_routes", fetch_routes_node)
    builder.add_node("scan_news", scan_news_node)
    builder.add_node("analyze_risks", analyze_risks_node)
    builder.add_node("save_results", save_results_node)
    
    builder.add_edge(START, "fetch_routes")
    builder.add_edge("fetch_routes", "scan_news")
    builder.add_edge("scan_news", "analyze_risks")
    builder.add_edge("analyze_risks", "save_results")
    builder.add_edge("save_results", END)
    
    return builder.compile()


scan_graph = _build_scan_graph()


# ═══════════════════════════════════════════════════════════════════════
#  CHAT GRAPH: ReAct Conversational Agent
# ═══════════════════════════════════════════════════════════════════════

CHAT_SYSTEM_PROMPT = """You are the Supply Chain Intelligence Assistant for Smart Supply Chain Optimizer.
You help logistics managers understand their supply chain status by querying real data.

Your capabilities (via tools):
- Search the web for recent supply chain news and shipping disruptions
- Query the live inventory database for stock levels and burn rates
- Look up past crisis analysis runs and their mitigation plans  
- Retrieve the latest risk monitoring scan results

Guidelines:
- Always use tools to answer data-driven questions (don't make up numbers)
- Provide concise, actionable insights
- If a route has high risk (score >= 7), recommend running a CrewAI crisis analysis
- Format numbers and dates clearly
- When discussing inventory, always mention days of supply remaining
- You may use multiple tools in sequence to build a comprehensive answer
- Respond in the same language the user writes in (Turkish or English)
"""


def agent_node(state: ChatState) -> dict:
    """The thinking node: calls Gemini with tools bound."""
    llm = _get_llm(temperature=0.4)
    llm_with_tools = llm.bind_tools(ALL_CHAT_TOOLS)
    
    messages = state["messages"]
    
    # Prepend system message if not already present
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=CHAT_SYSTEM_PROMPT)] + list(messages)
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: ChatState) -> str:
    """Conditional edge: if the agent made tool calls, go to tools. Otherwise stop."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


# Build the Chat Graph (ReAct pattern)
def _build_chat_graph():
    builder = StateGraph(ChatState)
    
    builder.add_node("agent", agent_node)
    builder.add_node("tools", ToolNode(ALL_CHAT_TOOLS))
    
    builder.add_edge(START, "agent")
    builder.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    builder.add_edge("tools", "agent")  # After tool execution, go back to agent
    
    return builder.compile()


chat_graph = _build_chat_graph()


# ═══════════════════════════════════════════════════════════════════════
#  PUBLIC API: Entry Points
# ═══════════════════════════════════════════════════════════════════════

def run_risk_scan(routes: list[str] | None = None) -> dict:
    """Run a proactive risk monitoring scan across shipping routes.
    
    Args:
        routes: Optional list of routes to scan. Uses defaults if None.
    
    Returns:
        dict with scan_summary and risk_results
    """
    print("🛡️ Starting LangGraph Risk Monitoring Scan...")
    initial_state = {
        "routes": routes or DEFAULT_ROUTES,
        "raw_news": {},
        "risk_results": [],
        "scan_summary": "",
    }
    
    result = scan_graph.invoke(initial_state)
    
    return {
        "scan_summary": result["scan_summary"],
        "risk_results": result["risk_results"],
        "routes_scanned": len(result["risk_results"]),
    }


def run_chat(user_message: str, chat_history: list[dict] | None = None) -> dict:
    """Send a message to the AI Chat Assistant.
    
    Args:
        user_message: The user's question/message
        chat_history: Optional list of previous messages [{"role": "user"|"assistant", "content": "..."}]
    
    Returns:
        dict with response text and metadata
    """
    from langchain_core.messages import HumanMessage, AIMessage
    
    messages = []
    
    # Rebuild chat history
    if chat_history:
        for msg in chat_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    
    # Add the new user message
    messages.append(HumanMessage(content=user_message))
    
    result = chat_graph.invoke({"messages": messages})
    
    # Extract the final AI response
    ai_response = result["messages"][-1].content
    
    return {
        "response": ai_response,
        "tool_calls_made": sum(
            1 for m in result["messages"] 
            if hasattr(m, "tool_calls") and m.tool_calls
        ),
    }
