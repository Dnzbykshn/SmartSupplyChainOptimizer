/**
 * AgentOutputCard.tsx — Generic AI agent output display card
 * 
 * A reusable container that frames the output of a specific AI agent.
 * Each card has a header (agent name + icon), a status badge, and
 * a children slot for the agent-specific content.
 * 
 * FUTURE: Each card will show a live processing indicator while
 * the corresponding AI agent is computing results in real-time.
 */

import { type LucideIcon } from 'lucide-react';

interface AgentOutputCardProps {
    title: string;
    agentName: string;
    icon: LucideIcon;
    statusLabel?: string;
    statusColor?: string;
    children: React.ReactNode;
}

export default function AgentOutputCard({
    title,
    agentName,
    icon: Icon,
    statusLabel = 'Analysis Complete',
    statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    children,
}: AgentOutputCardProps) {
    return (
        <div className="card-glass rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <Icon size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{title}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Agent: {agentName}
                        </p>
                    </div>
                </div>
                <span
                    className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${statusColor}`}
                >
                    {statusLabel}
                </span>
            </div>

            {/* Card body — agent-specific content */}
            <div className="p-5">{children}</div>
        </div>
    );
}
