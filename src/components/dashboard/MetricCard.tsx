/**
 * MetricCard.tsx — Reusable KPI metric card
 * 
 * Displays a single high-level metric with an icon, value, label, and trend.
 * Used on the Global Dashboard to show key supply chain indicators.
 * 
 * FUTURE: Values will be live-streamed from AI agent computations via Supabase Realtime.
 */

import {
    Package,
    Clock,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Minus,
    type LucideIcon,
} from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
}

/** Maps icon name strings to Lucide components */
const iconMap: Record<string, LucideIcon> = {
    Package,
    Clock,
    AlertTriangle,
    DollarSign,
};

export default function MetricCard({ label, value, change, trend, icon }: MetricCardProps) {
    const Icon = iconMap[icon] || Package;

    const trendColor =
        trend === 'up' && label !== 'Active Disruptions' && label !== 'Revenue at Risk'
            ? 'text-emerald-400'
            : trend === 'down' && (label === 'Active Disruptions' || label === 'Revenue at Risk')
                ? 'text-red-400'
                : trend === 'down'
                    ? 'text-red-400'
                    : 'text-slate-400';

    const TrendIcon =
        trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <div className="card-glass rounded-xl p-5 hover:border-slate-600 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Icon size={20} className="text-blue-400" />
                </div>
                <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                    <TrendIcon size={14} />
                    <span>{change}</span>
                </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        </div>
    );
}
