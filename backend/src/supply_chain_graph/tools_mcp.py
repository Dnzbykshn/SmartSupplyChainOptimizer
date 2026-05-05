"""
tools_mcp.py — MCP-backed tool loader for LangGraph

Instead of importing the LangChain @tool functions directly (which call
Supabase/Serper inline), this module spawns the supply-chain-mcp server
as a child process and loads the tools through the MCP protocol.

This is the "Phase 2" demonstration: the LangGraph chat agent reaches
its data through the same MCP server that Claude Desktop or any other
MCP client would use.

Toggle via env var:  USE_MCP_TOOLS=true   →  load tools via MCP
                     (anything else)       →  fall back to direct tools
"""

import os
import sys
import asyncio
import logging
from typing import List

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

log = logging.getLogger(__name__)


def _server_command() -> dict:
    """Build the stdio launch config for the local MCP server."""
    backend_src = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return {
        "supply-chain": {
            "command": sys.executable,
            "args": ["-m", "mcp_server"],
            "transport": "stdio",
            "cwd": backend_src,
            "env": {**os.environ},
        }
    }


_cached_tools: List[BaseTool] | None = None


def load_mcp_tools_sync() -> List[BaseTool]:
    """Synchronously load tools from the MCP server (cached after first call).

    The langchain-mcp-adapters API is async; we run it once on a fresh event
    loop and cache the resulting tool list for the lifetime of the process.
    """
    global _cached_tools
    if _cached_tools is not None:
        return _cached_tools

    async def _load():
        client = MultiServerMCPClient(_server_command())
        return await client.get_tools()

    try:
        _cached_tools = asyncio.run(_load())
        log.info("Loaded %d tools via MCP: %s",
                 len(_cached_tools), [t.name for t in _cached_tools])
        return _cached_tools
    except Exception as e:
        log.error("MCP tool loading failed: %s", e)
        raise


def get_chat_tools() -> List[BaseTool]:
    """Return the tool list for the LangGraph chat agent.

    If USE_MCP_TOOLS is truthy, load via MCP. Otherwise fall back to the
    direct LangChain tools so the app stays functional even if MCP is down.
    """
    if os.getenv("USE_MCP_TOOLS", "").lower() in ("1", "true", "yes"):
        try:
            return load_mcp_tools_sync()
        except Exception as e:
            log.warning("MCP unavailable, falling back to direct tools: %s", e)

    from supply_chain_graph.tools_langchain import ALL_CHAT_TOOLS
    return ALL_CHAT_TOOLS
