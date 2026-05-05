# MCP Integration Demo Guide

This project demonstrates the **Model Context Protocol (MCP)** by exposing
the supply chain data and capabilities through a custom MCP server, then
consuming it from multiple clients (LangGraph agents, Claude Desktop,
MCP Inspector).

---

## What is MCP?

MCP is a JSON-RPC based protocol that standardizes how LLM applications
discover and call external tools / data sources. Instead of every framework
(CrewAI, LangChain, OpenAI Agents, ...) writing its own tool integrations,
they all speak MCP — and any MCP server is usable by any of them.

**One server, many clients.** That is the value proposition.

---

## What's in this project

```
┌──────────────────────────────────────────────────────┐
│   supply-chain-mcp  (backend/src/mcp_server)         │
│                                                       │
│   Tools exposed over JSON-RPC / stdio:                │
│     • query_inventory                                 │
│     • get_crisis_history                              │
│     • get_latest_risk_scan                            │
│     • get_user_settings                               │
│     • search_supply_chain_news                        │
└──────────────────────────────────────────────────────┘
            ▲              ▲              ▲
            │              │              │
   ┌────────┘     ┌────────┘     ┌────────┘
   │              │              │
┌──────────┐  ┌────────────┐  ┌──────────────────┐
│ LangGraph│  │ Claude     │  │ MCP Inspector    │
│ chat     │  │ Desktop    │  │ (npx tool)       │
│ agent    │  │            │  │                  │
└──────────┘  └────────────┘  └──────────────────┘
```

Plus a **live UI Inspector page** at [/mcp](src/app/mcp/page.tsx) that
shows every `tools/call` happening in real time (sourced from the
`mcp_activity` Supabase table that the server writes to on every call).

---

## Files added / changed

| Path | What it is |
|---|---|
| `backend/src/mcp_server/server.py` | The MCP server (FastMCP, stdio transport). |
| `backend/src/mcp_server/__main__.py` | `python -m mcp_server` entry point. |
| `backend/src/mcp_server/README.md` | Server-specific docs + Claude Desktop config. |
| `backend/src/supply_chain_graph/tools_mcp.py` | Loader that pulls MCP tools into LangGraph via `langchain-mcp-adapters`. |
| `backend/src/supply_chain_graph/graph.py` | Chat graph now uses `get_chat_tools()` — switches to MCP when `USE_MCP_TOOLS=true`. |
| `backend/requirements.txt` | Added `mcp>=1.2.0`. |
| `supabase/mcp_activity.sql` | New table — every MCP tool call gets logged here. |
| `src/app/mcp/page.tsx` | The live MCP Inspector UI page. |
| `src/components/layout/Sidebar.tsx` | Added "MCP Inspector" nav item. |

---

## Setup (one-time)

1. **Create the activity log table** in Supabase. Open the Supabase SQL Editor
   and run [supabase/mcp_activity.sql](supabase/mcp_activity.sql).

2. **Install the MCP package** (already in requirements.txt):
   ```bash
   cd backend
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **(Optional) Install MCP Inspector** for the protocol-level demo:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

---

## Demo flow (the script for showing this to someone)

### Act 1: "Here's the server" (1 minute)

Open [backend/src/mcp_server/server.py](backend/src/mcp_server/server.py).
Show:

> "This is my MCP server. It exposes 5 tools over the standard MCP protocol.
> Anyone speaking MCP can use it — it doesn't care if it's CrewAI, LangChain,
> Claude Desktop, or a CLI."

### Act 2: "Here's the protocol" (2 minutes)

In a terminal:

```bash
cd backend/src
npx @modelcontextprotocol/inspector ../.venv/Scripts/python.exe -m mcp_server
```

A browser window opens. Click **Connect**, then **List Tools** — show the
5 tools with their JSON schemas. Pick `query_inventory`, click **Run Tool**.

> "This is the raw MCP protocol — `tools/list`, `tools/call` over JSON-RPC.
> No LLM involved. Just the protocol."

### Act 3: "Here's an LLM using it" (2 minutes)

Start the backend with MCP mode on:

```bash
cd backend/src
set USE_MCP_TOOLS=true
.\.venv\Scripts\python.exe api.py
```

Start the frontend in another terminal:
```bash
npm run dev
```

Navigate to **/mcp** in the browser. Show:

- The tool catalog card (this is what `tools/list` returns)
- Click **"Full Report (uses 4 tools)"**
- Watch the live activity feed populate as the LangGraph agent makes
  4 separate `tools/call` invocations through the MCP server

> "The LangGraph agent here used Gemini to pick the tools, but it called
> them through MCP. Same server, different client."

### Act 4: "Same server, different client" (1 minute)

Open Claude Desktop (config in
[backend/src/mcp_server/README.md](backend/src/mcp_server/README.md)).
Ask it: "What's in our supply chain inventory?". Claude calls the same
`query_inventory` tool. Show the call appearing in the **/mcp** activity
feed in your browser.

> "I never modified Claude Desktop. I never wrote integration code for it.
> It just speaks MCP, my server speaks MCP, they connected. That's the
> whole point of the protocol."

---

## Toggling MCP mode

The LangGraph chat uses MCP when `USE_MCP_TOOLS=true` is in the backend's
environment. Without it, the chat uses the original direct-Supabase
LangChain tools as a fallback. This makes it easy to:

- Demo the same chat working in both modes side-by-side
- Keep the app functional even if the MCP server has issues

```bash
# MCP mode (Phase 2 demo path)
set USE_MCP_TOOLS=true && python api.py

# Native mode (original path)
python api.py
```

Both modes write their data through Supabase, but **only MCP mode produces
activity in the `mcp_activity` table** — that's the giveaway in the live feed.

---

## What this demonstrates

1. **MCP is a protocol, not a library.** The server is a standalone process.
   Many different clients can connect.
2. **Process visibility.** The live activity feed shows the protocol firing —
   `tools/list`, `tools/call`, args, results, latency.
3. **Real value.** This isn't a toy demo — the LangGraph chat agent in this
   app actually fetches its data through the MCP server when toggled on.
4. **Interoperability.** Claude Desktop, MCP Inspector, and our LangGraph
   agent all consume the same server with zero per-client glue code.
