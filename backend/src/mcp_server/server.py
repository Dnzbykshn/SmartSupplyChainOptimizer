"""
supply-chain-mcp — Model Context Protocol server for Smart Supply Chain Optimizer.

Exposes supply chain data and capabilities over the MCP protocol so any
MCP-compatible client (CrewAI, LangGraph, Claude Desktop, MCP Inspector, ...)
can consume them through one unified interface.

Tools exposed:
  - query_inventory          live stock + days-of-supply
  - get_crisis_history       past CrewAI crisis runs + mitigation plans
  - get_latest_risk_scan     latest LangGraph risk scan results
  - get_user_settings        user risk tolerance / budget config
  - search_supply_chain_news web search via Serper

Transport: stdio (standard MCP transport, works with Claude Desktop directly).
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from supabase import create_client

# Load .env from the backend directory regardless of where the server is launched.
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))
load_dotenv(os.path.join(_BACKEND_DIR, ".env.local"), override=False)

# stdio transport uses stdout for protocol messages — log to stderr only.
logging.basicConfig(
    level=logging.INFO,
    stream=sys.stderr,
    format="[mcp-server] %(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("supply-chain-mcp")

mcp = FastMCP("supply-chain-mcp")


def _supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def _activity_log(tool: str, args: dict, result_preview: str, duration_ms: int):
    """Best-effort write of a tool call to the mcp_activity table for the
    UI inspector panel. Silently swallows errors so a logging failure never
    breaks a tool call."""
    sb = _supabase()
    if not sb:
        return
    try:
        sb.table("mcp_activity").insert({
            "tool": tool,
            "args": json.dumps(args, ensure_ascii=False)[:2000],
            "result_preview": result_preview[:2000],
            "duration_ms": duration_ms,
            "called_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception as e:
        log.debug("activity log skipped: %s", e)


def _timed(tool_name: str, args: dict, fn):
    start = datetime.now(timezone.utc)
    try:
        out = fn()
    except Exception as e:
        out = f"ERROR: {e}"
    dur = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
    log.info("%s (%dms) args=%s", tool_name, dur, args)
    _activity_log(tool_name, args, out if isinstance(out, str) else str(out), dur)
    return out


@mcp.tool()
def query_inventory(low_stock_only: bool = False) -> str:
    """Query live inventory: stock levels, daily burn rates, warehouse, and
    estimated days of supply. Set low_stock_only=true to return only items
    with under 14 days of supply remaining."""

    def _do():
        sb = _supabase()
        if not sb:
            return "Error: Supabase not configured."
        rows = sb.table("inventory").select("*").execute().data or []
        if not rows:
            return "Inventory table is empty."

        out = ["CURRENT INVENTORY:"]
        for it in rows:
            burn = it.get("daily_burn_rate") or 0
            stock = it.get("current_stock") or 0
            days = stock / burn if burn > 0 else float("inf")
            if low_stock_only and days >= 14:
                continue
            status = "CRITICAL" if days < 7 else "WARNING" if days < 14 else "OK"
            out.append(
                f"- {it['item_name']} ({it['category']}) "
                f"stock={stock} {it['unit']}, burn={burn}/day, "
                f"days_left={days:.1f} [{status}], wh={it['warehouse_location']}"
            )
        if len(out) == 1:
            return "No items match the filter."
        return "\n".join(out)

    return _timed("query_inventory", {"low_stock_only": low_stock_only}, _do)


@mcp.tool()
def get_crisis_history(limit: int = 5) -> str:
    """Return the most recent N crisis analysis runs from CrewAI, including
    the mitigation plans that were generated for each."""

    def _do():
        sb = _supabase()
        if not sb:
            return "Error: Supabase not configured."
        runs = (
            sb.table("crisis_runs")
            .select("id, crisis_description, affected_routes, status, created_at")
            .order("created_at", desc=True)
            .limit(max(1, min(limit, 50)))
            .execute()
            .data
            or []
        )
        if not runs:
            return "No past crisis runs."

        out = [f"PAST CRISIS RUNS (n={len(runs)}):"]
        for r in runs:
            out.append(
                f"- [{r['status'].upper()}] {r['crisis_description']} "
                f"(routes: {r.get('affected_routes', 'N/A')}, {r['created_at']})"
            )
            plans = (
                sb.table("mitigation_plans")
                .select("name, strategy, estimated_cost, risk_level")
                .eq("run_id", r["id"])
                .execute()
                .data
                or []
            )
            for p in plans:
                out.append(
                    f"    -> {p['name']}: {p['strategy']} "
                    f"(cost={p['estimated_cost']}, risk={p['risk_level']})"
                )
        return "\n".join(out)

    return _timed("get_crisis_history", {"limit": limit}, _do)


@mcp.tool()
def get_latest_risk_scan(limit: int = 10) -> str:
    """Return the most recent risk monitoring scan results (route-level risk
    scores produced by LangGraph)."""

    def _do():
        sb = _supabase()
        if not sb:
            return "Error: Supabase not configured."
        scans = (
            sb.table("risk_scans")
            .select("*")
            .order("scanned_at", desc=True)
            .limit(max(1, min(limit, 50)))
            .execute()
            .data
            or []
        )
        if not scans:
            return "No risk scans found."
        out = [f"LATEST RISK SCANS (n={len(scans)}):"]
        for s in scans:
            out.append(
                f"- {s['route']} risk={s['risk_score']}/10 "
                f"({s['risk_category']}) - {s['summary']} @ {s['scanned_at']}"
            )
        return "\n".join(out)

    return _timed("get_latest_risk_scan", {"limit": limit}, _do)


@mcp.tool()
def get_user_settings() -> str:
    """Return the user's configured supply chain settings (risk tolerance,
    budget cap, preferred warehouses, etc.). Useful context for any agent
    that produces recommendations."""

    def _do():
        sb = _supabase()
        if not sb:
            return "Error: Supabase not configured."
        rows = (
            sb.table("user_settings").select("*").limit(1).execute().data or []
        )
        if not rows:
            return "No user settings found (defaults will apply)."
        return json.dumps(rows[0], ensure_ascii=False, indent=2)

    return _timed("get_user_settings", {}, _do)


@mcp.tool()
def search_supply_chain_news(query: str) -> str:
    """Search the web for recent supply chain, shipping, port, or trade news.
    Use specific route or region names for best results (e.g. 'Suez Canal',
    'Port of Los Angeles strike')."""

    def _do():
        api_key = os.getenv("SERPER_API_KEY")
        if not api_key:
            return "Error: SERPER_API_KEY not configured."
        try:
            r = requests.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 5},
                timeout=10,
            )
            r.raise_for_status()
            items = r.json().get("organic", [])[:5]
            if not items:
                return f"No results for: {query}"
            lines = [f"WEB SEARCH '{query}':"]
            for it in items:
                lines.append(
                    f"- {it.get('title', 'No title')}\n"
                    f"  {it.get('link', '')}\n"
                    f"  {it.get('snippet', '')}"
                )
            return "\n".join(lines)
        except Exception as e:
            return f"Search failed: {e}"

    return _timed("search_supply_chain_news", {"query": query}, _do)


def main():
    log.info("starting supply-chain-mcp server (stdio transport)")
    mcp.run()


if __name__ == "__main__":
    main()
