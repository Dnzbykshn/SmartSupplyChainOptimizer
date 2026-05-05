/**
 * MCP Inspector Page
 *
 * Live demonstration of the Model Context Protocol in action.
 *
 * Shows:
 *   1. The supply-chain-mcp server's tool catalog (what is exposed)
 *   2. A real-time feed of every tools/call made through the protocol
 *      (sourced from the mcp_activity Supabase table — written by the
 *      MCP server's _activity_log helper on every invocation)
 *   3. Demo triggers that exercise the MCP path end-to-end so a viewer
 *      can see the protocol fire in real time
 *
 * This is the "process and results so everyone can see how MCP operates"
 * piece of the assignment. Without this panel MCP is invisible — it
 * looks like a regular function call. With it, you can watch the
 * JSON-RPC tool calls happen live.
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Activity,
    Box,
    CheckCircle2,
    Clock,
    Database,
    Network,
    Play,
    RefreshCw,
    Search,
    Terminal,
    Wrench,
    Zap,
} from 'lucide-react';

// ─── Static catalog: what the supply-chain-mcp server exposes ──────────
// (Mirrors backend/src/mcp_server/server.py — kept in sync manually since
// the server runs over stdio and the browser cannot tools/list it directly.)
const MCP_TOOLS = [
    {
        name: 'query_inventory',
        description: 'Live stock + days-of-supply (filterable by low-stock).',
        icon: Box,
        args: ['low_stock_only?: boolean'],
    },
    {
        name: 'get_crisis_history',
        description: 'Past CrewAI crisis runs with their mitigation plans.',
        icon: Database,
        args: ['limit?: int'],
    },
    {
        name: 'get_latest_risk_scan',
        description: 'Most recent route-level risk scores from LangGraph.',
        icon: Activity,
        args: ['limit?: int'],
    },
    {
        name: 'get_user_settings',
        description: 'User risk tolerance, budget cap, preferred warehouses.',
        icon: Wrench,
        args: [],
    },
    {
        name: 'search_supply_chain_news',
        description: 'Web search via Serper for shipping / port / trade news.',
        icon: Search,
        args: ['query: string'],
    },
];

interface ActivityRow {
    id: number;
    tool: string;
    args: string | null;
    result_preview: string | null;
    duration_ms: number | null;
    called_at: string;
}

export default function MCPInspectorPage() {
    const [activity, setActivity] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [demoRunning, setDemoRunning] = useState(false);
    const [demoResult, setDemoResult] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    async function loadActivity() {
        if (!supabase) {
            setLoading(false);
            return;
        }
        const { data } = await supabase
            .from('mcp_activity')
            .select('*')
            .order('called_at', { ascending: false })
            .limit(50);
        setActivity(data || []);
        setLoading(false);
    }

    useEffect(() => {
        loadActivity();
        if (!autoRefresh) return;
        const t = setInterval(loadActivity, 2000);
        return () => clearInterval(t);
    }, [autoRefresh]);

    async function runDemo(message: string) {
        setDemoRunning(true);
        setDemoResult(null);
        try {
            const res = await fetch('/api/langgraph/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            setDemoResult(data.response || JSON.stringify(data));
        } catch (e) {
            setDemoResult(`Error: ${e}`);
        }
        setDemoRunning(false);
        loadActivity();
    }

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                        <Network size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">MCP Inspector</h1>
                        <p className="text-sm text-slate-400">
                            Live view of the Model Context Protocol layer powering this app
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Server Status Card ──────────────────────────────── */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                Server Online
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-white font-mono">supply-chain-mcp</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Custom MCP server — exposes supply chain data through JSON-RPC
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-white">{MCP_TOOLS.length}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tools</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">stdio</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Transport</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{activity.length}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Recent Calls</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tool Catalog ─────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wrench size={14} /> Tool Catalog (tools/list response)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MCP_TOOLS.map((t) => {
                        const Icon = t.icon;
                        return (
                            <div
                                key={t.name}
                                className="rounded-lg bg-slate-900 border border-slate-800 p-4 hover:border-emerald-500/40 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                                        <Icon size={14} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-mono text-sm text-white">{t.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{t.description}</div>
                                        {t.args.length > 0 && (
                                            <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                                                args: ({t.args.join(', ')})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Demo Triggers ───────────────────────────────────── */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap size={14} /> Trigger MCP Demo
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                    Run a query against the LangGraph chat agent. With{' '}
                    <code className="text-emerald-400 bg-slate-800 px-1 rounded">USE_MCP_TOOLS=true</code>{' '}
                    set on the backend, the agent will reach all data through the MCP server below —
                    you&apos;ll see calls appear in the activity feed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                        disabled={demoRunning}
                        onClick={() => runDemo('What is in our inventory right now? Highlight low stock.')}
                        className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                        Query Inventory
                    </button>
                    <button
                        disabled={demoRunning}
                        onClick={() => runDemo('Show me the latest risk scan results across all routes.')}
                        className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                        Latest Risk Scan
                    </button>
                    <button
                        disabled={demoRunning}
                        onClick={() => runDemo('Generate a full supply chain report.')}
                        className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                        Full Report (uses 4 tools)
                    </button>
                </div>
                {demoRunning && (
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" /> Calling MCP tools...
                    </div>
                )}
                {demoResult && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Agent Response</div>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{demoResult}</pre>
                    </div>
                )}
            </div>

            {/* ── Live Activity Feed ──────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Terminal size={14} /> Live tools/call Activity
                    </h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="accent-emerald-500"
                            />
                            Auto-refresh (2s)
                        </label>
                        <button
                            onClick={loadActivity}
                            className="text-xs text-slate-400 hover:text-white p-1"
                            aria-label="Refresh"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-center text-slate-500 text-sm">Loading...</div>
                    ) : activity.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                            No MCP calls recorded yet. Run a demo above or chat with the agent
                            (with USE_MCP_TOOLS=true on the backend).
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                            {activity.map((row) => (
                                <div key={row.id} className="p-3 hover:bg-slate-900/50 font-mono text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-slate-500">
                                            {new Date(row.called_at).toLocaleTimeString()}
                                        </span>
                                        <span className="text-emerald-400 font-bold">tools/call</span>
                                        <span className="text-blue-400">{row.tool}</span>
                                        <span className="text-slate-500 text-[10px] flex items-center gap-1">
                                            <Clock size={10} />
                                            {row.duration_ms ?? '?'}ms
                                        </span>
                                    </div>
                                    {row.args && row.args !== '{}' && (
                                        <div className="mt-1 text-slate-400">
                                            <span className="text-slate-600">args:</span> {row.args}
                                        </div>
                                    )}
                                    {row.result_preview && (
                                        <div className="mt-1 text-slate-500 truncate">
                                            <span className="text-slate-600">→</span>{' '}
                                            {row.result_preview.slice(0, 200)}
                                            {row.result_preview.length > 200 && '...'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── How It Works (educational) ──────────────────────── */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Play size={14} /> How MCP Works in This Project
                </h3>
                <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                    <li>
                        <span className="text-white">supply-chain-mcp</span> server is launched as
                        a child process by the LangGraph backend (and can be launched independently
                        by Claude Desktop, MCP Inspector, etc.).
                    </li>
                    <li>
                        On startup, clients send <code className="text-emerald-400">tools/list</code> over
                        JSON-RPC and receive the tool catalog above.
                    </li>
                    <li>
                        When the LLM agent decides to use a tool, the client sends{' '}
                        <code className="text-emerald-400">tools/call</code> with the tool name and
                        arguments. The server executes (Supabase / Serper) and returns the result.
                    </li>
                    <li>
                        Every call is recorded to <code className="text-emerald-400">mcp_activity</code>{' '}
                        — that&apos;s what you see in the live feed above.
                    </li>
                    <li>
                        The same server can be consumed by <span className="text-white">any</span>{' '}
                        MCP-compatible client. One server, many clients — that&apos;s the value of MCP.
                    </li>
                </ol>
            </div>
        </div>
    );
}
