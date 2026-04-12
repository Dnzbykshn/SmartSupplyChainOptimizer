'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Shield,
    Radar,
    Send,
    Bot,
    User,
    AlertTriangle,
    TrendingUp,
    MapPin,
    Clock,
    ChevronRight,
    Loader2,
    RefreshCw,
    MessageSquare,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Sparkles,
    Zap,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────

interface RiskScan {
    id: string;
    route: string;
    risk_score: number;
    risk_category: string;
    summary: string;
    news_sources: string[];
    confidence: string;
    recommended_action: string;
    scanned_at: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolCalls?: number;
}

// ─── Helper Functions ─────────────────────────────────────

function getRiskColor(score: number) {
    if (score >= 7) return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500' };
    if (score >= 4) return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' };
}

function getRiskLabel(score: number) {
    if (score >= 8) return 'CRITICAL';
    if (score >= 7) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    return 'LOW';
}

function getCategoryIcon(category: string) {
    const icons: Record<string, string> = {
        geopolitical: '🌍', weather: '🌊', labor: '✊',
        infrastructure: '🏗️', piracy: '☠️', regulatory: '📋',
        congestion: '🚢', none: '✅',
    };
    return icons[category] || '❓';
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function MonitoringPage() {
    // ─── Risk Monitor State ───────────────────────────────
    const [scans, setScans] = useState<RiskScan[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scansLoading, setScansLoading] = useState(true);

    // ─── Chat State ───────────────────────────────────────
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hello! I\'m your Supply Chain Intelligence Assistant powered by **LangGraph**. I can help you with:\n\n• 📊 Real-time inventory status\n• 🔍 Risk scan analysis\n• 📜 Past crisis history\n• 🌐 Latest shipping news\n\nTry asking me something like *"What\'s our current inventory status?"* or *"Summarize the latest risk scan."*',
            timestamp: new Date(),
        },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ─── Load existing scans on mount ─────────────────────
    useEffect(() => {
        fetchScans();
    }, []);

    // ─── Auto-scroll chat ─────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchScans() {
        setScansLoading(true);
        try {
            const res = await fetch('/api/langgraph/scans');
            const data = await res.json();
            if (data.success && data.scans) {
                setScans(data.scans);
            }
        } catch (err) {
            console.error('Failed to fetch scans:', err);
        } finally {
            setScansLoading(false);
        }
    }

    async function runScan() {
        setScanning(true);
        try {
            const res = await fetch('/api/langgraph/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh scans from DB
                await fetchScans();
            }
        } catch (err) {
            console.error('Scan failed:', err);
        } finally {
            setScanning(false);
        }
    }

    async function sendChat() {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = chatInput;
        setChatInput('');
        setChatLoading(true);

        try {
            // Build history (exclude the welcome message)
            const history = messages
                .filter((_, i) => i > 0)
                .map(m => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/langgraph/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    history,
                }),
            });
            const data = await res.json();

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: data.success
                    ? data.response
                    : `Error: ${data.error || 'Something went wrong'}`,
                timestamp: new Date(),
                toolCalls: data.tool_calls_made,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I couldn\'t connect to the backend. Make sure the FastAPI server is running on port 8000.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    }

    // ─── Computed Stats ───────────────────────────────────
    const latestScans = scans.reduce<Record<string, RiskScan>>((acc, scan) => {
        if (!acc[scan.route] || new Date(scan.scanned_at) > new Date(acc[scan.route].scanned_at)) {
            acc[scan.route] = scan;
        }
        return acc;
    }, {});
    const uniqueRoutes = Object.values(latestScans);
    const highRiskCount = uniqueRoutes.filter(s => s.risk_score >= 7).length;
    const mediumRiskCount = uniqueRoutes.filter(s => s.risk_score >= 4 && s.risk_score < 7).length;
    const lowRiskCount = uniqueRoutes.filter(s => s.risk_score < 4).length;

    return (
        <div className="min-h-screen p-4 lg:p-6 space-y-6">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-violet-400" size={28} />
                        Supply Chain Intelligence
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Proactive risk monitoring &amp; AI-powered insights — Powered by LangGraph
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30">
                        <Sparkles size={14} className="text-violet-400" />
                        <span className="text-xs font-medium text-violet-300">LangGraph Engine</span>
                    </div>
                    <button
                        onClick={runScan}
                        disabled={scanning}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-600/20"
                    >
                        {scanning ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Radar size={16} />
                                Scan Now
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <ShieldX size={22} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{highRiskCount}</p>
                        <p className="text-xs text-slate-400">High Risk Routes</p>
                    </div>
                </div>
                <div className="card-glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <ShieldAlert size={22} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{mediumRiskCount}</p>
                        <p className="text-xs text-slate-400">Medium Risk</p>
                    </div>
                </div>
                <div className="card-glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck size={22} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{lowRiskCount}</p>
                        <p className="text-xs text-slate-400">Low Risk</p>
                    </div>
                </div>
            </div>

            {/* ── Main Split Panel ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-320px)] min-h-[500px]">

                {/* ─── LEFT: Risk Monitor ─────────────────────── */}
                <div className="card-glass rounded-xl flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Radar size={16} className="text-violet-400" />
                            Route Risk Monitor
                        </h2>
                        <button
                            onClick={fetchScans}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {scansLoading ? (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <Loader2 size={24} className="animate-spin mr-2" />
                                Loading scans...
                            </div>
                        ) : uniqueRoutes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                <Shield size={40} className="opacity-30" />
                                <p className="text-sm">No scans yet. Click <strong>Scan Now</strong> to start.</p>
                            </div>
                        ) : (
                            uniqueRoutes
                                .sort((a, b) => b.risk_score - a.risk_score)
                                .map((scan) => {
                                    const colors = getRiskColor(scan.risk_score);
                                    return (
                                        <div
                                            key={scan.id}
                                            className={`rounded-lg border ${colors.border} ${colors.bg} p-4 transition-all duration-200 hover:scale-[1.01]`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse`} />
                                                    <span className="text-sm font-semibold text-white">
                                                        {scan.route}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}
                                                >
                                                    {scan.risk_score}/10 {getRiskLabel(scan.risk_score)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                                                {scan.summary}
                                            </p>

                                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    {getCategoryIcon(scan.risk_category)} {scan.risk_category}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> {formatTime(scan.scanned_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp size={10} /> {scan.confidence}
                                                </span>
                                            </div>

                                            {scan.risk_score >= 7 && (
                                                <Link
                                                    href="/crisis"
                                                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <Zap size={12} />
                                                    Run CrewAI Crisis Analysis
                                                    <ChevronRight size={12} />
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* ─── RIGHT: AI Chat Assistant ───────────────── */}
                <div className="card-glass rounded-xl flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700/50">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <MessageSquare size={16} className="text-violet-400" />
                            AI Assistant
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-normal">
                                ReAct Agent
                            </span>
                        </h2>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot size={14} className="text-violet-400" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600/30 border border-blue-500/30 text-blue-100'
                                            : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {msg.toolCalls !== undefined && msg.toolCalls > 0 && (
                                            <span className="flex items-center gap-0.5 text-violet-400">
                                                <Zap size={9} /> {msg.toolCalls} tool{msg.toolCalls > 1 ? 's' : ''} used
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User size={14} className="text-blue-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-violet-400" />
                                </div>
                                <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    Thinking & querying tools...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="px-4 py-3 border-t border-slate-700/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                                placeholder="Ask about inventory, risks, or past crises..."
                                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                disabled={chatLoading}
                            />
                            <button
                                onClick={sendChat}
                                disabled={chatLoading || !chatInput.trim()}
                                className="px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            {[
                                'What\'s our inventory status?',
                                'Summarize the latest risk scan',
                                'Show past crises',
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => { setChatInput(suggestion); }}
                                    className="text-[10px] text-slate-500 hover:text-violet-400 transition-colors truncate"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
