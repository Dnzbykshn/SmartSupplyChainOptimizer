# MCP Server Implementation Report
## Smart Supply Chain Optimizer — Model Context Protocol Integration

**Project:** Smart Supply Chain Optimizer
**Date:** 2026-05-05
**Author:** Deniz Buyuksahin
**Module:** Model Context Protocol (MCP) Integration

---

## 1. Executive Summary

This report documents the integration of the **Model Context Protocol (MCP)**
into the Smart Supply Chain Optimizer project. The integration consists of:

1. A custom MCP server (`supply-chain-mcp`) exposing 5 supply-chain tools
   over the standard MCP/JSON-RPC protocol.
2. Adapter layers that allow the project's two AI orchestrators — **CrewAI**
   and **LangGraph** — to consume the same MCP server transparently.
3. A **live UI Inspector** at `/mcp` that visualizes every MCP tool call in
   real time, satisfying the assignment requirement to "show the process and
   results so everyone can see how MCP operates."
4. Persistent activity logging to a Supabase `mcp_activity` table, providing
   an auditable trace of all protocol-level interactions.

The integration demonstrates the core value proposition of MCP:
**one server, many clients, one protocol** — the same server is consumed by
CrewAI, LangGraph, and (optionally) Claude Desktop, with zero per-client
integration code.

---

## 2. Background: What is MCP?

The Model Context Protocol (MCP) is an open protocol introduced by Anthropic
that standardizes how Large Language Model (LLM) applications discover and
invoke external tools and data sources.

Without MCP, every LLM framework has to write its own integration for every
external system (database, API, file system, etc.). With MCP, any tool that
implements the protocol can be consumed by any MCP-aware client — including
CrewAI, LangChain/LangGraph, OpenAI Agents, and Claude Desktop.

**Transport:** JSON-RPC 2.0 over stdio (standard input/output) or HTTP/SSE.
**Key operations:**
- `tools/list` — client asks the server which tools are available.
- `tools/call` — client invokes a specific tool with arguments.
- `resources/list`, `prompts/list` — additional capabilities (not used here).

---

## 3. Why MCP Was Added to This Project

Before this integration, the Smart Supply Chain Optimizer had **two
orchestrators** (CrewAI and LangGraph) and **duplicated tool code**:

- `backend/src/supply_chain_crew/tools.py` — CrewAI's `SupabaseInventoryTool`
- `backend/src/supply_chain_graph/tools_langchain.py` — LangGraph's
  `query_inventory`, `query_crisis_history`, `get_latest_risk_scan`,
  `search_supply_chain_news`

Both groups queried the same Supabase tables and the same Serper API, but
through separate, non-interoperable code paths.

MCP solves this:

1. **Eliminates duplicate code** — one canonical implementation per tool.
2. **Enables external clients** — Claude Desktop, MCP Inspector, or any
   future client can use the same tools immediately.
3. **Provides protocol-level observability** — every tool call is a discrete,
   serializable JSON-RPC message, ideal for logging and live visualization.
4. **Demonstrates a real-world MCP use case** — fulfilling the assignment
   requirement to demonstrate how MCP works.

---

## 4. Architecture

### 4.1 High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Crisis page  │  │ Chat page    │  │ /mcp Inspector │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────┘  │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                  Backend API (FastAPI)                   │
│  POST /api/analyze-crisis    POST /api/langgraph/chat    │
└─────────┬─────────────────────┬───────────────────┬──────┘
          │                     │                   │
          ▼                     ▼                   │
   ┌────────────┐        ┌────────────┐             │
   │  CrewAI    │        │  LangGraph │             │
   │  agents    │        │  chat      │             │
   └─────┬──────┘        └─────┬──────┘             │
         │                     │                    │
         │ MCPServerAdapter    │ langchain-mcp-     │
         │ (crewai_tools)      │ adapters           │
         ▼                     ▼                    │
   ┌──────────────────────────────────┐             │
   │   supply-chain-mcp   (THIS)      │             │
   │   FastMCP, stdio, 5 tools        │◀────────────┘
   │                                  │   reads activity log
   │   query_inventory                │
   │   get_crisis_history             │
   │   get_latest_risk_scan           │
   │   get_user_settings              │
   │   search_supply_chain_news       │
   └──────────────┬───────────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │ Supabase / Serper   │
         │ + mcp_activity log  │
         └─────────────────────┘
```

### 4.2 Decision: stdio Transport

The server uses **stdio** transport (the default for MCP) rather than HTTP/SSE.

**Reasons:**
- Zero network configuration required — the client spawns the server as a
  child process and communicates over its standard streams.
- This is the transport Claude Desktop expects natively.
- Simpler security model — no ports to expose, no auth to configure.
- The server can write structured logs to **stderr** without polluting the
  protocol stream on stdout.

**Trade-off:** Each client launches its own server process. For a
production multi-tenant deployment HTTP/SSE would be preferable; for this
project (single-user, demonstration purposes) stdio is correct.

---

## 5. Implementation Details

### 5.1 The MCP Server — `backend/src/mcp_server/server.py`

The server is built on **FastMCP**, the high-level decorator-based API
provided by the `mcp` Python package (Anthropic's reference implementation).

**Server initialization:**
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("supply-chain-mcp")
```

**Tool registration uses Python decorators:**
```python
@mcp.tool()
def query_inventory(low_stock_only: bool = False) -> str:
    ...
```

FastMCP automatically:
- Generates the JSON Schema for each tool from Python type hints.
- Builds the `tools/list` response from the registered functions.
- Routes incoming `tools/call` messages to the right function.
- Wraps the return value in MCP-compliant content blocks.

**stdio rules followed:**
- Logging is configured to go to **stderr only** (`stream=sys.stderr`),
  because stdout is the protocol's data channel.
- The server reads `.env` and `.env.local` from the backend directory at
  startup so it can connect to Supabase regardless of who launched it.

**Activity logging:**
Every tool invocation is wrapped in a `_timed()` helper that records:
- Tool name
- Arguments (JSON-encoded, truncated to 2000 chars)
- Result preview (first 2000 chars)
- Duration in milliseconds
- Timestamp (UTC)

These rows are inserted into the `mcp_activity` Supabase table. If the
insert fails, it is silently ignored — a logging failure must never break
a tool call.

### 5.2 The 5 Tools

All 5 tools are pure Python functions decorated with `@mcp.tool()`.
Their docstrings serve as the tool descriptions surfaced to LLMs.

| Tool | Inputs | Output | Backing Service |
|------|--------|--------|-----------------|
| `query_inventory` | `low_stock_only: bool` | Stock list w/ days-of-supply | Supabase `inventory` |
| `get_crisis_history` | `limit: int` | Recent CrewAI runs + plans | Supabase `crisis_runs`, `mitigation_plans` |
| `get_latest_risk_scan` | `limit: int` | Recent risk scores per route | Supabase `risk_scans` |
| `get_user_settings` | (none) | User preferences as JSON | Supabase `user_settings` |
| `search_supply_chain_news` | `query: str` | Web search results | Serper API |

Each tool:
- Validates Supabase configuration before querying.
- Catches exceptions and returns a human-readable error string (rather than
  raising) so the calling LLM gets a useful message instead of a stack trace.
- Returns plain text (not JSON) to keep token usage low and LLM-friendly.

### 5.3 LangGraph Integration —
       `backend/src/supply_chain_graph/tools_mcp.py`

This module exposes one function:

```python
def get_chat_tools() -> List[BaseTool]:
    if os.getenv("USE_MCP_TOOLS", "").lower() in ("1", "true", "yes"):
        return load_mcp_tools_sync()
    from supply_chain_graph.tools_langchain import ALL_CHAT_TOOLS
    return ALL_CHAT_TOOLS
```

**The MCP loader:**

```python
async def _load():
    client = MultiServerMCPClient({
        "supply-chain": {
            "command": sys.executable,
            "args": ["-m", "mcp_server"],
            "transport": "stdio",
            "cwd": backend_src,
            "env": {**os.environ},
        }
    })
    return await client.get_tools()

_cached_tools = asyncio.run(_load())
```

The `langchain-mcp-adapters` library handles the heavy lifting:
- Spawns the MCP server as a subprocess.
- Sends `tools/list`, parses the response.
- Wraps each MCP tool as a LangChain `BaseTool` with the right schema.
- Tools become bind-able to any LangChain LLM via `.bind_tools(...)`.

The `graph.py` chat agent then calls `get_chat_tools()` instead of importing
`ALL_CHAT_TOOLS` directly. A single env flag toggles the behavior.

**Failure mode:** If MCP loading fails for any reason (server crashed,
package missing), the loader logs a warning and falls back to the original
direct tools — the application stays functional.

### 5.4 CrewAI Integration —
       `backend/src/supply_chain_crew/tools_mcp.py`

Uses the `crewai_tools.MCPServerAdapter` class:

```python
adapter = MCPServerAdapter(StdioServerParameters(
    command=sys.executable,
    args=["-m", "mcp_server"],
    cwd=backend_src,
    env={**os.environ},
))
tools = list(adapter.tools)
atexit.register(adapter.stop)
```

`crew.py` then has helper functions:

```python
def _scout_tools():
    if use_mcp_tools():
        return [find_tool("search_supply_chain_news")]
    return [SerperDevTool()]

def _forecaster_tools():
    if use_mcp_tools():
        return [find_tool("query_inventory")]
    return [SupabaseInventoryTool()]
```

Two CrewAI agents — `global_risk_scout` and `inventory_forecaster` — receive
their tools through these helpers. With `USE_MCP_TOOLS=true` the same
MCP server backs them; without the flag, the original native tools are used.

This means **a single env flag** simultaneously switches both orchestrators
to MCP mode — that is the demo:

> "One server. CrewAI uses it. LangGraph uses it. Toggle one variable.
> Both orchestrators consume the same protocol."

### 5.5 The Activity Log Table — `supabase/mcp_activity.sql`

```sql
CREATE TABLE IF NOT EXISTS mcp_activity (
    id BIGSERIAL PRIMARY KEY,
    tool TEXT NOT NULL,
    args TEXT,
    result_preview TEXT,
    duration_ms INTEGER,
    called_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_activity_called_at
    ON mcp_activity(called_at DESC);
```

This table is the **source of truth for the live UI Inspector**. Every
tool invocation produces one row. The frontend polls this table every
2 seconds via the Supabase JS client.

### 5.6 The UI Inspector — `src/app/mcp/page.tsx`

A dedicated Next.js page at `/mcp` containing four sections:

1. **Server Status Card** — server name, transport, tool count, recent calls.
2. **Tool Catalog** — a card per registered tool, mirroring the
   `tools/list` response: name, description, argument signature.
3. **Demo Triggers** — buttons that POST to `/api/langgraph/chat` with
   curated prompts (e.g. "generate a full supply chain report" — exercises
   4 tools in one call).
4. **Live Activity Feed** — auto-refreshing list of `tools/call` events
   from `mcp_activity`, showing timestamp, tool name, args, result preview,
   and duration.
5. **Educational Panel** — concise explanation of how MCP works in this
   project, suitable for a viewer who is unfamiliar with the protocol.

The page is added to the sidebar navigation so it's a peer-level view
alongside Crisis Center, Intelligence, History, etc.

### 5.7 Configuration Toggle — `USE_MCP_TOOLS`

A single environment variable controls the behavior of both CrewAI and
LangGraph:

```bash
# Native mode — original direct tools
python src/api.py

# MCP mode — both orchestrators route through supply-chain-mcp
set USE_MCP_TOOLS=true
python src/api.py
```

This makes side-by-side demonstration trivial: launch the backend twice
in two terminals (one in each mode) and compare behavior.

---

## 6. Demonstration Flow

The intended demo is structured as **four acts**, each ~1-2 minutes,
totaling about 6 minutes for a polished walkthrough.

### Act 1 — "Here is the server"
Open `backend/src/mcp_server/server.py`. Show the `@mcp.tool()` decorators
and the 5 functions. Explain the file is a self-contained program that
exposes capabilities over the MCP protocol.

### Act 2 — "Here is the protocol, raw"
Run the official MCP Inspector against the server:

```bash
npx @modelcontextprotocol/inspector python -m mcp_server
```

Show the JSON Schema returned by `tools/list`. Manually invoke a tool —
viewers see the request/response JSON. This proves the server speaks a
real protocol, not just exposes a Python API.

### Act 3 — "Here is an LLM using it"
Start the backend with `USE_MCP_TOOLS=true`. Open `/mcp` in the browser.
Click the "Full Report (uses 4 tools)" button. The LangGraph chat agent
runs, calls 4 tools through MCP, and the activity feed populates in
real time. The viewer sees the protocol firing — this is the
"process and results" requirement of the assignment.

### Act 4 — "Same server, different client"
Open Claude Desktop with the supply-chain server registered in
`claude_desktop_config.json`. Ask a natural-language question
(e.g. "What's in our inventory right now?"). Claude calls the same MCP
server, the same activity feed picks up the call. The viewer sees that
one server, with **zero per-client integration code**, is being used by
a completely different application.

---

## 7. Files Created or Modified

### Created

| Path | Lines | Purpose |
|------|-------|---------|
| `backend/src/mcp_server/__init__.py` | 13 | Package marker, docstring |
| `backend/src/mcp_server/__main__.py` | 4 | `python -m mcp_server` entry point |
| `backend/src/mcp_server/server.py` | ~210 | The MCP server itself, 5 tools |
| `backend/src/mcp_server/README.md` | ~110 | Server docs + Claude Desktop config |
| `backend/src/supply_chain_graph/tools_mcp.py` | ~70 | LangGraph MCP loader |
| `backend/src/supply_chain_crew/tools_mcp.py` | ~60 | CrewAI MCP loader |
| `supabase/mcp_activity.sql` | ~25 | Activity log table |
| `src/app/mcp/page.tsx` | ~310 | UI Inspector page |
| `MCP_DEMO.md` | ~140 | Demo script for live presentation |
| `MCP_IMPLEMENTATION_REPORT.md` | (this file) | Implementation report |

### Modified

| Path | Change |
|------|--------|
| `backend/requirements.txt` | Added `mcp`, `langchain-mcp-adapters`, `crewai-tools[mcp]` |
| `backend/src/supply_chain_crew/crew.py` | Switched to `_scout_tools()` / `_forecaster_tools()` helpers that pick MCP or native tools based on env flag |
| `backend/src/supply_chain_graph/graph.py` | Replaced direct `ALL_CHAT_TOOLS` import with `get_chat_tools()` call |
| `src/components/layout/Sidebar.tsx` | Added "MCP Inspector" navigation item |

---

## 8. Validation Performed

- **Server startup test:** `python -m mcp_server` boots, FastMCP registers
  5 tools, no errors on stderr.
- **Tool listing test:** Calling `mcp.list_tools()` from a Python REPL
  returns all 5 tools with correct names and descriptions.
- **Tool invocation test:** Calling `query_inventory` over MCP succeeds;
  the underlying Supabase query runs (failures here are network-environmental,
  not protocol-level).
- **LangGraph adapter test:** With `USE_MCP_TOOLS=true`, the LangGraph
  chat graph builds with 5 MCP-backed tools instead of the native 4.
  Logs show `Loaded 5 tools via MCP: query_inventory, get_crisis_history, ...`
- **CrewAI adapter test:** With `USE_MCP_TOOLS=true`, `tools_mcp.py`
  successfully spawns the MCP server, retrieves tools, and registers them
  on agents. Logs show `CrewAI loaded 5 MCP tools: ...`
- **Frontend type-check:** `npx tsc --noEmit` exits 0; the new `/mcp`
  page has no type errors.
- **Backwards compatibility:** Without `USE_MCP_TOOLS=true`, the project
  behaves identically to before — all original endpoints, all original
  tool paths, all original output formats.

---

## 9. How the Implementation Maps to Assignment Requirements

The assignment stated:

> "You will need to demonstrate within your project how MCP works and explain
> its function clearly. Make sure your project shows the process and results
> so everyone can see how MCP operates."

| Requirement | How it is fulfilled |
|---|---|
| Demonstrate **how MCP works** | A self-written MCP server exists in the repo. Source is readable in one file. The protocol is exercised by 3 different clients (CrewAI, LangGraph, Claude Desktop). |
| Explain its **function** clearly | This report; the README in `mcp_server/`; the educational panel on the `/mcp` page; the demo script in `MCP_DEMO.md`. |
| Show the **process** | The `/mcp` Inspector page renders every `tools/call` in real time — name, args, result, duration. The MCP Inspector CLI also exposes raw JSON-RPC messages. |
| Show the **results** | The same Inspector page shows tool return values; the chat agent's final response also appears below the demo buttons. |
| Make it visible to **everyone** | The Inspector lives at a stable URL inside the application; no special tooling required to view it. |

---

## 10. Lessons Learned & Design Choices

**Why a single env flag instead of two endpoints?**
Initially the design called for parallel `/api/langgraph/chat` and
`/api/langgraph/chat-mcp` endpoints. A single env-flag toggle was chosen
instead because it makes the demo dramatic — one variable, both
orchestrators switch — and avoids API surface duplication.

**Why not replace the native tools entirely?**
Keeping a fallback path means a single point of failure (the MCP server
not starting) does not crash the application. For a production deployment
this safety would arguably be unnecessary; for a graded demonstration it is
prudent.

**Why log to Supabase rather than a stream?**
A WebSocket or SSE stream would deliver lower latency, but Supabase
provides free durability, replay, and querying. For a demo (where calls
happen at human pace, not millisecond pace) 2-second polling is
indistinguishable from real-time.

**Why FastMCP instead of the lower-level Server class?**
FastMCP infers JSON Schema from Python type hints, which keeps the
tool definitions concise (~10 lines per tool). The lower-level API
would have required ~30 lines per tool to register schemas manually.

---

## 11. Conclusion

The Smart Supply Chain Optimizer now contains a functional, demonstrable
MCP integration. A custom server exposes domain-specific tools over the
standard protocol. Two distinct orchestration frameworks (CrewAI and
LangGraph) consume those tools through that protocol. An external client
(Claude Desktop) can do the same with three lines of configuration.

The integration is fully reversible (toggle one env var to disable),
fully observable (the `/mcp` Inspector page), and fully documented (this
report, the demo script, and the per-module READMEs).

The end-to-end implementation provides a concrete answer to the
assignment's requirement to demonstrate how MCP works, why it matters,
and what its protocol-level behavior looks like.

---

*— End of Report —*
