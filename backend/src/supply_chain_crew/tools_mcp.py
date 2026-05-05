"""
tools_mcp.py — MCP-backed tool loader for CrewAI

Connects to the supply-chain-mcp server via stdio and exposes its tools
to CrewAI agents through the official `crewai_tools.MCPServerAdapter`.

Toggle via env var:  USE_MCP_TOOLS=true   →  agents use MCP tools
                     (anything else)       →  fall back to direct tools

The same env flag controls LangGraph (see supply_chain_graph/tools_mcp.py),
so flipping it in one place changes both orchestrators at once — that is
the demo: one server, two clients.
"""

import os
import sys
import logging
from typing import List, Any

log = logging.getLogger(__name__)

_adapter = None
_cached_tools: List[Any] | None = None


def _server_params():
    from mcp import StdioServerParameters
    backend_src = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return StdioServerParameters(
        command=sys.executable,
        args=["-m", "mcp_server"],
        cwd=backend_src,
        env={**os.environ},
    )


def load_mcp_tools_for_crewai() -> List[Any]:
    """Start the MCP adapter and return the tool list (cached).

    The adapter spawns supply-chain-mcp as a child process over stdio.
    We keep it alive for the lifetime of the API process; .stop() is
    called via atexit.
    """
    global _adapter, _cached_tools
    if _cached_tools is not None:
        return _cached_tools

    from crewai_tools import MCPServerAdapter
    import atexit

    _adapter = MCPServerAdapter(_server_params())
    # MCPServerAdapter starts the child process automatically in __init__;
    # no need to call .start() again. The tools list is populated lazily.
    _cached_tools = list(_adapter.tools)
    atexit.register(lambda: _adapter and _adapter.stop())

    log.info("CrewAI loaded %d tools via MCP: %s",
             len(_cached_tools), [t.name for t in _cached_tools])
    return _cached_tools


def find_tool(name: str):
    """Lookup an MCP tool by name from the loaded list."""
    for t in load_mcp_tools_for_crewai():
        if t.name == name:
            return t
    raise KeyError(f"MCP tool not found: {name}")


def use_mcp_tools() -> bool:
    return os.getenv("USE_MCP_TOOLS", "").lower() in ("1", "true", "yes")
