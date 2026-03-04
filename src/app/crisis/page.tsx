/**
 * Crisis Resolution Center Page (/crisis)
 * 
 * THE MOST CRITICAL PAGE for demonstrating future AI architecture.
 * Structured with distinct sections representing AI agent outputs:
 * 
 *   1. Global Risk Scout Analysis — external threat assessment
 *   2. Inventory Forecaster Impact — stock depletion projections
 *   3. Routing Strategist Recommendations — 3 mitigation plans
 *   4. Human-in-the-Loop — plan selection & authorization
 * 
 * FUTURE: Each section will receive real-time data from its corresponding
 * AI agent via Supabase Realtime subscriptions. The authorization step
 * will trigger a Supabase Edge Function that dispatches the chosen plan
 * to the logistics execution system.
 */

'use client';

import { useState } from 'react';
import AgentOutputCard from '@/components/crisis/AgentOutputCard';
import PlanCard from '@/components/crisis/PlanCard';
import { riskScoutData, inventoryImpact, mitigationPlans } from '@/lib/mock-data';
import {
    Radar,
    BarChart3,
    Route,
    ShieldCheck,
    AlertTriangle,
    Newspaper,
    Cloud,
    Globe,
    Package,
    CheckCircle2,
} from 'lucide-react';

export default function CrisisPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [authorized, setAuthorized] = useState(false);

    const handleAuthorize = () => {
        if (selectedPlan) {
            setAuthorized(true);
        }
    };

    const selectedPlanData = mitigationPlans.find((p) => p.id === selectedPlan);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck size={24} className="text-red-400" />
                    Crisis Resolution Center
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Multi-Agent AI analysis &amp; human-authorized resolution workflow
                </p>
            </div>

            {/* ─── SECTION 1: Global Risk Scout Analysis ─────────────────────── */}
            <AgentOutputCard
                title="Global Risk Scout Analysis"
                agentName="Risk Scout v2.1"
                icon={Radar}
                statusLabel={`Threat Level: ${riskScoutData.threatLevel}`}
                statusColor="text-red-400 bg-red-500/10 border-red-500/30"
            >
                <div className="space-y-4">
                    {/* Event overview */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-1">{riskScoutData.eventName}</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{riskScoutData.eventDescription}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Affected ports */}
                        <div className="bg-slate-800/50 rounded-lg p-4">
                            <h5 className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                                <Globe size={12} />
                                Affected Ports
                            </h5>
                            <ul className="space-y-1.5">
                                {riskScoutData.affectedPorts.map((port) => (
                                    <li key={port} className="text-sm text-slate-300 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        {port}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Weather conditions */}
                        <div className="bg-slate-800/50 rounded-lg p-4">
                            <h5 className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                                <Cloud size={12} />
                                Weather &amp; Secondary Risks
                            </h5>
                            <p className="text-sm text-slate-300">{riskScoutData.weatherConditions}</p>
                            <p className="text-xs text-slate-400 mt-2">
                                Est. Duration: <span className="text-amber-400 font-medium">{riskScoutData.estimatedDuration}</span>
                            </p>
                        </div>
                    </div>

                    {/* News headlines */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <h5 className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                            <Newspaper size={12} />
                            Latest News Intelligence
                        </h5>
                        <ul className="space-y-2">
                            {riskScoutData.newsHeadlines.map((headline, i) => (
                                <li key={i} className="text-sm text-slate-300 pl-3 border-l-2 border-blue-500/30">
                                    {headline}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Geopolitical factors */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <h5 className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={12} />
                            Geopolitical Risk Factors
                        </h5>
                        <ul className="space-y-1.5">
                            {riskScoutData.geopoliticalFactors.map((factor, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </AgentOutputCard>

            {/* ─── SECTION 2: Inventory Forecaster Impact ────────────────────── */}
            <AgentOutputCard
                title="Inventory Forecaster Impact"
                agentName="Inventory Forecaster v1.8"
                icon={BarChart3}
                statusLabel={`${inventoryImpact.totalSkusAffected} SKUs Affected`}
                statusColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
            >
                <div className="space-y-4">
                    {/* Summary metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-red-400">{inventoryImpact.totalSkusAffected}</p>
                            <p className="text-xs text-slate-400 mt-1">Total SKUs Affected</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400">{inventoryImpact.revenueAtRisk}</p>
                            <p className="text-xs text-slate-400 mt-1">Revenue at Risk</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <p className="text-lg font-bold text-white">{inventoryImpact.productionLineImpact}</p>
                            <p className="text-xs text-slate-400 mt-1">Production Line Impact</p>
                        </div>
                    </div>

                    {/* Critical items table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                                    <th className="text-left py-2 pr-4">Component</th>
                                    <th className="text-right py-2 px-3">Stock</th>
                                    <th className="text-right py-2 px-3">Daily Burn</th>
                                    <th className="text-right py-2 px-3">Days Left</th>
                                    <th className="text-left py-2 pl-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryImpact.criticalItems.map((item) => {
                                    const statusColors = {
                                        Critical: 'text-red-400 bg-red-500/10',
                                        Warning: 'text-amber-400 bg-amber-500/10',
                                        Stable: 'text-emerald-400 bg-emerald-500/10',
                                    };
                                    return (
                                        <tr key={item.name} className="border-b border-slate-800/50">
                                            <td className="py-3 pr-4 flex items-center gap-2">
                                                <Package size={14} className="text-slate-400 shrink-0" />
                                                <span className="text-slate-200">{item.name}</span>
                                            </td>
                                            <td className="text-right py-3 px-3 text-white font-medium">
                                                {item.currentStock.toLocaleString()}
                                            </td>
                                            <td className="text-right py-3 px-3 text-slate-300">
                                                {item.dailyBurnRate.toLocaleString()}/day
                                            </td>
                                            <td className="text-right py-3 px-3">
                                                <span className={`font-bold ${item.daysUntilDepletion <= 5 ? 'text-red-400' : item.daysUntilDepletion <= 14 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {item.daysUntilDepletion} days
                                                </span>
                                            </td>
                                            <td className="py-3 pl-3">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AgentOutputCard>

            {/* ─── SECTION 3: Routing Strategist Recommendations ─────────────── */}
            <AgentOutputCard
                title="Routing Strategist Recommendations"
                agentName="Routing Strategist v3.0"
                icon={Route}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                        Based on the current disruption analysis, the Routing Strategist has generated three
                        mitigation plans. Select the most appropriate strategy for human authorization.
                    </p>

                    {/* Plan cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {mitigationPlans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                isSelected={selectedPlan === plan.id}
                                onSelect={setSelectedPlan}
                            />
                        ))}
                    </div>
                </div>
            </AgentOutputCard>

            {/* ─── SECTION 4: Human-in-the-Loop Authorization ────────────────── */}
            <div className="card-glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <ShieldCheck size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Human-in-the-Loop Authorization</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Final approval required before plan execution
                        </p>
                    </div>
                </div>

                {authorized ? (
                    /* Success state */
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5 text-center">
                        <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                        <h4 className="text-lg font-bold text-emerald-400 mb-1">
                            Plan Authorized Successfully
                        </h4>
                        <p className="text-sm text-slate-300">
                            <strong>{selectedPlanData?.name}: {selectedPlanData?.strategy}</strong> has been
                            authorized for execution. In Phase 2, this action will trigger the
                            Multi-Agent orchestrator to begin logistics coordination.
                        </p>
                    </div>
                ) : (
                    /* Selection & authorize state */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-sm text-slate-300">
                            {selectedPlan ? (
                                <span>
                                    Selected: <strong className="text-white">{selectedPlanData?.name} — {selectedPlanData?.strategy}</strong>
                                </span>
                            ) : (
                                <span className="text-slate-400">
                                    Please select a mitigation plan above to proceed with authorization.
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleAuthorize}
                            disabled={!selectedPlan}
                            className={`
                px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                flex items-center gap-2 shrink-0
                ${selectedPlan
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }
              `}
                        >
                            <ShieldCheck size={16} />
                            Authorize Selected Plan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
