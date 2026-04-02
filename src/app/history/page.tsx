'use client';

import { useState, useEffect } from 'react';
import {
    History,
    ChevronDown,
    ChevronUp,
    Calendar,
    MapPin,
    Radar,
    BarChart3,
    Route,
    Database,
    Loader2,
    FileText,
    Clock,
    Shield,
    DollarSign,
    Zap,
    AlertTriangle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface MitigationPlan {
    id: number;
    name: string;
    strategy: string;
    description: string;
    estimatedCost: string;
    timeframe: string;
    riskLevel: string;
    co2Impact: string;
    reliabilityScore: number;
}

interface CrisisRun {
    id: string;
    crisisDescription: string;
    affectedRoutes: string;
    status: string;
    createdAt: string;
    riskScoutOutput: string | null;
    forecasterOutput: string | null;
    plans: MitigationPlan[];
}

// ── Utility: format date ───────────────────────────────────────────────
function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function timeAgo(iso: string) {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ── Risk level badge colours ───────────────────────────────────────────
function riskColor(level: string) {
    const l = level?.toLowerCase() || '';
    if (l.includes('high') || l.includes('critical')) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (l.includes('medium') || l.includes('moderate')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
}

// ═══════════════════════════════════════════════════════════════════════
//  PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function HistoryPage() {
    const [runs, setRuns] = useState<CrisisRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRun, setExpandedRun] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/crew/history');
                const data = await res.json();
                if (data.success && data.runs) {
                    setRuns(data.runs);
                    // Auto-expand latest
                    if (data.runs.length > 0) {
                        setExpandedRun(data.runs[0].id);
                    }
                }
            } catch (e) {
                console.error('Failed to load history', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleRun = (id: string) => {
        setExpandedRun(expandedRun === id ? null : id);
        setExpandedSection(null);
    };

    const toggleSection = (key: string) => {
        setExpandedSection(expandedSection === key ? null : key);
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <History size={24} className="text-violet-400" />
                        Crisis History
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Browse past AI-powered crisis analysis runs &amp; mitigation plans
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Database size={12} className="text-emerald-400" />
                        <span>{runs.length} total runs</span>
                    </div>
                </div>
            </div>

            {/* ── Loading State ─────────────────────────────────────────── */}
            {loading && (
                <div className="card-glass rounded-xl border border-slate-800 p-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="text-violet-400 animate-spin" />
                    <p className="text-sm text-slate-400">Loading crisis history from Supabase...</p>
                </div>
            )}

            {/* ── Empty State ──────────────────────────────────────────── */}
            {!loading && runs.length === 0 && (
                <div className="card-glass rounded-xl border border-slate-800 p-12 flex flex-col items-center justify-center gap-3">
                    <FileText size={32} className="text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-400">No Crisis Runs Yet</h3>
                    <p className="text-sm text-slate-500 text-center max-w-md">
                        Go to the <a href="/crisis" className="text-blue-400 hover:underline">Crisis Center</a> and 
                        run your first AI analysis. Results will appear here automatically.
                    </p>
                </div>
            )}

            {/* ── Timeline ─────────────────────────────────────────────── */}
            {!loading && runs.length > 0 && (
                <div className="relative space-y-4">
                    {/* Vertical timeline line */}
                    <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-violet-500/40 via-slate-700/40 to-transparent hidden md:block" />

                    {runs.map((run, index) => {
                        const isExpanded = expandedRun === run.id;
                        const isLatest = index === 0;

                        return (
                            <div key={run.id} className="relative md:pl-12">
                                {/* Timeline dot */}
                                <div className={`
                                    hidden md:flex absolute left-3 top-5 w-5 h-5 rounded-full border-2 items-center justify-center
                                    ${isLatest 
                                        ? 'border-violet-400 bg-violet-500/20' 
                                        : 'border-slate-600 bg-slate-800'}
                                `}>
                                    <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-violet-400' : 'bg-slate-600'}`} />
                                </div>

                                {/* Run Card */}
                                <div className={`
                                    card-glass rounded-xl border overflow-hidden transition-all duration-300
                                    ${isLatest ? 'border-violet-500/30' : 'border-slate-800'}
                                    ${isExpanded ? 'shadow-lg shadow-violet-500/5' : ''}
                                `}>
                                    {/* ── Card Header (always visible) ─── */}
                                    <button
                                        onClick={() => toggleRun(run.id)}
                                        className="w-full text-left px-5 py-4 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                {isLatest && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-semibold uppercase tracking-wider">
                                                        Latest
                                                    </span>
                                                )}
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                                                    {run.status}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                                                    {run.plans.length} plans
                                                </span>
                                                {run.riskScoutOutput && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                                                        AI Outputs
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-200 truncate pr-4">
                                                {run.crisisDescription.length > 140
                                                    ? run.crisisDescription.substring(0, 140) + '...'
                                                    : run.crisisDescription}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {formatDate(run.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {timeAgo(run.createdAt)}
                                                </span>
                                                {run.affectedRoutes && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        <MapPin size={11} />
                                                        {run.affectedRoutes.length > 60
                                                            ? run.affectedRoutes.substring(0, 60) + '...'
                                                            : run.affectedRoutes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={18} className="text-slate-400 shrink-0 mt-1" />
                                        ) : (
                                            <ChevronDown size={18} className="text-slate-400 shrink-0 mt-1" />
                                        )}
                                    </button>

                                    {/* ── Expanded Detail ─────────────── */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-800/50 px-5 py-5 space-y-4">

                                            {/* Full crisis description */}
                                            <div className="bg-slate-800/40 rounded-lg p-4">
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <AlertTriangle size={12} />
                                                    Crisis Description
                                                </h4>
                                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                                    {run.crisisDescription}
                                                </p>
                                                {run.affectedRoutes && (
                                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                        <MapPin size={11} />
                                                        {run.affectedRoutes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* ── Agent Outputs (Collapsible) ── */}
                                            {run.riskScoutOutput && (
                                                <div className="border border-slate-800 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSection(`${run.id}-scout`)}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Radar size={14} className="text-blue-400" />
                                                            <span className="text-xs font-semibold text-white">Risk Scout Output</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI</span>
                                                        </div>
                                                        {expandedSection === `${run.id}-scout` ? (
                                                            <ChevronUp size={14} className="text-slate-400" />
                                                        ) : (
                                                            <ChevronDown size={14} className="text-slate-400" />
                                                        )}
                                                    </button>
                                                    {expandedSection === `${run.id}-scout` && (
                                                        <div className="px-4 pb-4 space-y-2 border-t border-slate-800/50">
                                                            {run.riskScoutOutput.split('\n').filter(l => l.trim()).map((p, i) => (
                                                                <p key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-blue-500/20 pt-2">
                                                                    {p}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {run.forecasterOutput && (
                                                <div className="border border-slate-800 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSection(`${run.id}-forecast`)}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <BarChart3 size={14} className="text-amber-400" />
                                                            <span className="text-xs font-semibold text-white">Forecaster Output</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI</span>
                                                        </div>
                                                        {expandedSection === `${run.id}-forecast` ? (
                                                            <ChevronUp size={14} className="text-slate-400" />
                                                        ) : (
                                                            <ChevronDown size={14} className="text-slate-400" />
                                                        )}
                                                    </button>
                                                    {expandedSection === `${run.id}-forecast` && (
                                                        <div className="px-4 pb-4 space-y-2 border-t border-slate-800/50">
                                                            {run.forecasterOutput.split('\n').filter(l => l.trim()).map((p, i) => (
                                                                <p key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-amber-500/20 pt-2">
                                                                    {p}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── Mitigation Plans Grid ──── */}
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <Route size={12} />
                                                    Mitigation Plans ({run.plans.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {run.plans.map((plan) => (
                                                        <div
                                                            key={plan.id}
                                                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h5 className="text-sm font-semibold text-white leading-snug flex-1">
                                                                    {plan.name}
                                                                </h5>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ml-2 ${riskColor(plan.riskLevel)}`}>
                                                                    {plan.riskLevel}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                                                {plan.description}
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <DollarSign size={10} />
                                                                    <span className="text-slate-300">{plan.estimatedCost}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <Clock size={10} />
                                                                    <span className="text-slate-300">{plan.timeframe}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <Zap size={10} />
                                                                    <span className="text-slate-300">{plan.reliabilityScore}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <Shield size={10} />
                                                                    <span className="text-slate-300">{plan.strategy}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
