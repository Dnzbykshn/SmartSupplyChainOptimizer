"""
supply_chain_graph — LangGraph-powered Supply Chain Intelligence Module

Provides two main capabilities:
  1. Proactive Risk Monitoring: Scans shipping routes for emerging threats
  2. AI Chat Assistant: Answers supply chain questions using real-time data

Works alongside the existing CrewAI system (supply_chain_crew) without
replacing or modifying it.
"""

from supply_chain_graph.graph import run_risk_scan, run_chat

__all__ = ["run_risk_scan", "run_chat"]
