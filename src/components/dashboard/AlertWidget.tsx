/**
 * AlertWidget.tsx — Prominent crisis alert banner
 * 
 * Displays a high-severity supply chain disruption alert with:
 *   - Visual severity indicators (red/amber styling)
 *   - Affected routes list
 *   - Impact summary
 *   - CTA button routing to the Crisis Resolution Center
 * 
 * FUTURE: Alerts will be triggered by the Global Risk Scout AI agent
 * and persisted in Supabase for audit trails.
 */

import Link from 'next/link';
import type { Alert } from '@/lib/types';
import { AlertTriangle, ArrowRight, Radio } from 'lucide-react';

interface AlertWidgetProps {
    alert: Alert;
}

export default function AlertWidget({ alert }: AlertWidgetProps) {
    const severityStyles = {
        critical: 'border-red-500/50 bg-red-950/40',
        high: 'border-amber-500/50 bg-amber-950/40',
        medium: 'border-yellow-500/50 bg-yellow-950/40',
        low: 'border-blue-500/50 bg-blue-950/40',
    };

    return (
        <div className={`rounded-xl border-2 p-5 ${severityStyles[alert.severity]}`}>
            {/* Header with pulsing indicator */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <AlertTriangle size={24} className="text-red-400" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Radio size={12} className="animate-pulse" />
                            {alert.severity} Alert
                        </p>
                        <h3 className="text-base font-bold text-white mt-0.5">
                            {alert.title}
                        </h3>
                    </div>
                </div>
                <span className="text-[10px] text-slate-400">
                    {new Date(alert.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {alert.description}
            </p>

            {/* Affected routes & impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-2">Affected Routes</p>
                    <div className="flex flex-wrap gap-1.5">
                        {alert.affectedRoutes.map((route) => (
                            <span
                                key={route}
                                className="text-[11px] px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-300"
                            >
                                {route}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-2">Estimated Impact</p>
                    <p className="text-sm text-white font-medium">{alert.estimatedImpact}</p>
                </div>
            </div>

            {/* CTA: Navigate to Crisis Resolution Center */}
            <Link
                href="/crisis"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                Open Crisis Resolution Center
                <ArrowRight size={16} />
            </Link>
        </div>
    );
}
