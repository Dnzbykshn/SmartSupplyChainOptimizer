"""
tools_langchain.py — LangChain Tool Wrappers for LangGraph Agents

Provides tools that LangGraph nodes/agents can use:
  - search_supply_chain_news: Web search via Serper API
  - query_inventory: Query Supabase inventory table
  - query_crisis_history: Query past crisis runs from Supabase
  - get_latest_risk_scan: Retrieve the most recent risk scan results

These are LangChain @tool functions, distinct from the CrewAI BaseTool
in supply_chain_crew/tools.py (which remains untouched).
"""

import os
import json
import requests
from langchain_core.tools import tool
from supabase import create_client


def _get_supabase():
    """Helper to get a Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


@tool
def search_supply_chain_news(query: str) -> str:
    """Search the web for recent supply chain news, shipping disruptions, 
    port delays, or trade-related events. Use specific route or region names 
    for best results.
    
    Args:
        query: Search query about supply chain, shipping, or trade news.
    """
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        return "Error: SERPER_API_KEY not found in environment variables."

    try:
        response = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            json={"q": query, "num": 5},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        results = []
        for item in data.get("organic", [])[:5]:
            results.append(
                f"- {item.get('title', 'No title')}\n"
                f"  Source: {item.get('link', 'N/A')}\n"
                f"  Snippet: {item.get('snippet', 'No snippet')}"
            )

        if not results:
            return f"No recent news found for: {query}"

        return f"WEB SEARCH RESULTS for '{query}':\n\n" + "\n\n".join(results)

    except Exception as e:
        return f"Search failed: {str(e)}"


@tool
def query_inventory() -> str:
    """Query the Supabase inventory database to get real-time stock levels,
    daily burn rates, warehouse locations, and remaining days of supply 
    for all tracked items. Use this to check current inventory status."""
    supabase = _get_supabase()
    if not supabase:
        return "Error: Supabase not configured."

    try:
        response = supabase.table("inventory").select("*").execute()

        if not response.data:
            return "The inventory table is currently empty."

        result_str = "CURRENT INVENTORY DATA:\n"
        for item in response.data:
            days_left = (
                item["current_stock"] / item["daily_burn_rate"]
                if item["daily_burn_rate"] > 0
                else float("inf")
            )
            status = "CRITICAL" if days_left < 7 else "WARNING" if days_left < 14 else "OK"
            result_str += (
                f"- {item['item_name']} ({item['category']})\n"
                f"  Stock: {item['current_stock']} {item['unit']}, "
                f"Burn: {item['daily_burn_rate']}/day\n"
                f"  Days Left: {days_left:.1f} days [{status}]\n"
                f"  Warehouse: {item['warehouse_location']}\n\n"
            )

        return result_str

    except Exception as e:
        return f"Inventory query failed: {str(e)}"


@tool
def query_crisis_history() -> str:
    """Query past crisis analysis runs from the Supabase database.
    Returns the most recent 5 crisis runs with their descriptions, 
    status, and associated mitigation plans."""
    supabase = _get_supabase()
    if not supabase:
        return "Error: Supabase not configured."

    try:
        runs = (
            supabase.table("crisis_runs")
            .select("id, crisis_description, affected_routes, status, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        if not runs.data:
            return "No past crisis runs found in the database."

        result = "PAST CRISIS RUNS (most recent first):\n\n"
        for run in runs.data:
            result += f"- [{run['status'].upper()}] {run['crisis_description']}\n"
            result += f"  Routes: {run.get('affected_routes', 'N/A')}\n"
            result += f"  Date: {run['created_at']}\n"

            # Fetch associated plans
            plans = (
                supabase.table("mitigation_plans")
                .select("name, strategy, estimated_cost, risk_level")
                .eq("run_id", run["id"])
                .execute()
            )
            if plans.data:
                for p in plans.data:
                    result += (
                        f"    → {p['name']}: {p['strategy']} "
                        f"(Cost: {p['estimated_cost']}, Risk: {p['risk_level']})\n"
                    )
            result += "\n"

        return result

    except Exception as e:
        return f"History query failed: {str(e)}"


@tool
def get_latest_risk_scan() -> str:
    """Get the most recent risk monitoring scan results from the database.
    Shows risk scores and summaries for all recently scanned routes."""
    supabase = _get_supabase()
    if not supabase:
        return "Error: Supabase not configured."

    try:
        scans = (
            supabase.table("risk_scans")
            .select("*")
            .order("scanned_at", desc=True)
            .limit(10)
            .execute()
        )

        if not scans.data:
            return "No risk scans found. Run a scan first using the monitoring page."

        result = "LATEST RISK SCAN RESULTS:\n\n"
        for scan in scans.data:
            risk_emoji = "🔴" if scan["risk_score"] >= 7 else "🟡" if scan["risk_score"] >= 4 else "🟢"
            result += (
                f"{risk_emoji} {scan['route']} — Risk: {scan['risk_score']}/10 "
                f"({scan['risk_category']})\n"
                f"   {scan['summary']}\n"
                f"   Scanned: {scan['scanned_at']}\n\n"
            )

        return result

    except Exception as e:
        return f"Risk scan query failed: {str(e)}"


# Export all tools as a list for easy binding
ALL_CHAT_TOOLS = [
    search_supply_chain_news,
    query_inventory,
    query_crisis_history,
    get_latest_risk_scan,
]
