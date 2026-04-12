"""
models.py — Pydantic Models for LangGraph Risk Monitoring

These models define the structured output schemas for the risk analysis
LLM calls. They map to the frontend TypeScript interfaces and the
Supabase `risk_scans` table.
"""

from typing import List, Literal
from pydantic import BaseModel, Field


class RouteRisk(BaseModel):
    """Risk assessment for a single shipping route."""

    route: str = Field(
        description="The shipping route, e.g. 'Shanghai → Rotterdam'"
    )
    risk_score: int = Field(
        ge=1, le=10,
        description="Risk score from 1 (safe) to 10 (critical disruption imminent)"
    )
    risk_category: Literal[
        "geopolitical", "weather", "labor", "infrastructure", 
        "piracy", "regulatory", "congestion", "none"
    ] = Field(
        description="Primary risk category"
    )
    summary: str = Field(
        description="2-3 sentence explanation of the risk situation based on found news"
    )
    news_sources: List[str] = Field(
        description="List of relevant news headlines or source titles found"
    )
    confidence: Literal["high", "medium", "low"] = Field(
        description="Confidence level in this assessment based on recency and quality of sources"
    )
    recommended_action: str = Field(
        description="Short recommended action, e.g. 'Monitor closely', 'Consider rerouting', 'Activate crisis protocol'"
    )


class RiskScanResult(BaseModel):
    """Complete result of a risk monitoring scan across all routes."""

    routes_scanned: int = Field(
        description="Number of routes scanned"
    )
    high_risk_count: int = Field(
        description="Number of routes with risk score >= 7"
    )
    overall_status: Literal["clear", "caution", "alert", "critical"] = Field(
        description="Overall supply chain status based on highest risk found"
    )
    scan_summary: str = Field(
        description="1-2 sentence executive summary of the scan findings"
    )
    route_risks: List[RouteRisk] = Field(
        description="Individual risk assessments for each scanned route"
    )
