"""
state.py — LangGraph State Schemas

Defines the TypedDict state schemas for both LangGraph workflows:
  - ScanState: For the risk monitoring pipeline
  - ChatState: For the conversational AI assistant
"""

from typing import TypedDict, Annotated, Any
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage


class ScanState(TypedDict):
    """State schema for the Risk Monitoring scan pipeline.
    
    Flows through: fetch_routes → scan_news → analyze_risks → save_results
    """
    # Input: list of routes/regions to monitor
    routes: list[str]
    
    # Accumulated raw news data per route (populated by scan_news node)
    raw_news: dict[str, str]
    
    # Analyzed risk results per route (populated by analyze_risks node)
    risk_results: list[dict[str, Any]]
    
    # Overall scan summary
    scan_summary: str


class ChatState(TypedDict):
    """State schema for the AI Chat Assistant (ReAct agent loop).
    
    Uses the standard messages pattern for conversational agents.
    The add_messages reducer appends new messages to the list.
    """
    messages: Annotated[list[BaseMessage], add_messages]
