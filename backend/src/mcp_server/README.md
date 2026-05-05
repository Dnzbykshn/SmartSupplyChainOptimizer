# supply-chain-mcp

A **Model Context Protocol (MCP)** server that exposes the project's supply
chain data and capabilities through the standard MCP protocol (JSON-RPC over
stdio).

The same server is consumed by:

- **CrewAI agents** (via the `crewai-tools` MCP adapter)
- **LangGraph agents** (via `langchain-mcp-adapters`)
- **Claude Desktop** or any MCP-compatible client (zero code, just config)

This is the demonstration of "how MCP works": one server, many clients,
one protocol.

---

## Tools exposed

| Tool                       | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `query_inventory`          | Live stock + days-of-supply (filterable)    |
| `get_crisis_history`       | Past CrewAI runs + their mitigation plans   |
| `get_latest_risk_scan`     | Latest LangGraph route risk scores          |
| `get_user_settings`        | User risk tolerance / budget configuration  |
| `search_supply_chain_news` | Web search via Serper API                   |

Every call is logged to the `mcp_activity` Supabase table so the UI
Inspector panel can show calls in real time.

---

## Setup

### 1. Install dependencies

```bash
cd backend
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 2. Create the activity log table

Run [supabase/mcp_activity.sql](../../../supabase/mcp_activity.sql) in the
Supabase SQL Editor.

### 3. Configure environment

The server reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SERPER_API_KEY` from `backend/.env` (already configured for the project).

---

## Running

### Standalone (for debugging with MCP Inspector)

```bash
cd backend/src
python -m mcp_server
```

Then in another terminal:

```bash
npx @modelcontextprotocol/inspector python -m mcp_server
```

The Inspector shows the protocol-level `tools/list` and `tools/call`
messages — useful for explaining how MCP works.

### From Claude Desktop

Add this to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supply-chain": {
      "command": "C:\\Users\\deniz\\Desktop\\SmartSupplyChainOptimizer\\backend\\.venv\\Scripts\\python.exe",
      "args": ["-m", "mcp_server"],
      "cwd": "C:\\Users\\deniz\\Desktop\\SmartSupplyChainOptimizer\\backend\\src"
    }
  }
}
```

Restart Claude Desktop. Ask "What's in my supply chain inventory?" — Claude
will call `query_inventory` over MCP and you'll see the tool indicator.

---

## How it fits the project

```
                 ┌──────────────────────────────────────────┐
                 │         supply-chain-mcp (THIS)          │
                 │  query_inventory   get_crisis_history    │
                 │  get_latest_risk_scan  get_user_settings │
                 │  search_supply_chain_news                │
                 └──────────────────────────────────────────┘
                          ▲           ▲           ▲
        MCP / stdio       │           │           │
                          │           │           │
              ┌───────────┘           │           └────────────┐
              │                       │                        │
       ┌──────────────┐       ┌───────────────┐       ┌─────────────────┐
       │  CrewAI      │       │  LangGraph    │       │  Claude Desktop │
       │  agents      │       │  agents       │       │  (any client)   │
       └──────────────┘       └───────────────┘       └─────────────────┘
              │                       │
              └─── /api/analyze-crisis & /api/langgraph/* (FastAPI) ──┐
                                                                      ▼
                                                            Next.js frontend
                                                              + MCP Inspector panel
```

Phase 2 will wire CrewAI and LangGraph to consume tools through this server
instead of their current direct Supabase queries.
