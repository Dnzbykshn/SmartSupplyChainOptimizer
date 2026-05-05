"""
Supply Chain MCP Server

A Model Context Protocol (MCP) server that exposes supply chain data and
tools over the standard MCP protocol (JSON-RPC over stdio).

The same server is consumed by:
  - CrewAI agents (via crewai-tools MCP adapter)
  - LangGraph agents (via langchain-mcp-adapters)
  - Claude Desktop / any MCP-compatible client

Run standalone:
    python -m mcp_server.server
"""
