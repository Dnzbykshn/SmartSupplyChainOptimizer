/**
 * PlanCard.tsx — Selectable mitigation plan card
 * 
 * Displays a routing strategist's proposed plan with cost, timeframe,
 * risk level, and key details. Supports selection via click.
 * 
 * FUTURE: Plan parameters will be computed by the Routing Strategist AI agent
 * based on real-time data from Supabase and external logistics APIs.
 */

import type { MitigationPlan } from '@/lib/types';
import { CheckCircle2, Clock, DollarSign, Shield, Leaf } from 'lucide-react';

interface PlanCardProps {
    plan: MitigationPlan;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const riskColors: Record<MitigationPlan['riskLevel'], string> = {
    Low: 'text-emerald-400 bg-emerald-500/10',
    Medium: 'text-amber-400 bg-amber-500/10',
    High: 'text-red-400 bg-red-500/10',
};

export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(plan.id)}
            className={`
        w-full text-left rounded-xl border-2 p-5 transition-all duration-300
        ${isSelected
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/20'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                }
      `}
        >
            {/* Plan header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-400 uppercase">{plan.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${riskColors[plan.riskLevel]}`}>
                            {plan.riskLevel} Risk
                        </span>
                    </div>
                    <h4 className="text-base font-semibold text-white">{plan.strategy}</h4>
                </div>
                {isSelected && (
                    <CheckCircle2 size={22} className="text-blue-400 shrink-0" />
                )}
            </div>

            <p className="text-sm text-slate-300 mb-4">{plan.description}</p>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                    <DollarSign size={14} className="text-slate-400" />
                    <div>
                        <p className="text-slate-400">Est. Cost</p>
                        <p className="text-white font-medium">{plan.estimatedCost}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Clock size={14} className="text-slate-400" />
                    <div>
                        <p className="text-slate-400">Timeframe</p>
                        <p className="text-white font-medium">{plan.timeframe}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Shield size={14} className="text-slate-400" />
                    <div>
                        <p className="text-slate-400">Reliability</p>
                        <p className="text-white font-medium">{plan.reliabilityScore}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Leaf size={14} className="text-slate-400" />
                    <div>
                        <p className="text-slate-400">CO₂ Impact</p>
                        <p className="text-white font-medium">{plan.co2Impact}</p>
                    </div>
                </div>
            </div>

            {/* Detail bullets */}
            <ul className="space-y-1.5">
                {plan.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="mt-1 w-1 h-1 rounded-full bg-slate-500 shrink-0" />
                        {detail}
                    </li>
                ))}
            </ul>
        </button>
    );
}
