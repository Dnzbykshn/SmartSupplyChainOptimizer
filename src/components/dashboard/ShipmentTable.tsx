/**
 * ShipmentTable.tsx — Global shipments data table
 * 
 * Renders a responsive, styled table of active shipments with status badges.
 * 
 * FUTURE: This data will be fetched from Supabase with real-time subscriptions
 * so that shipment statuses update live as AI agents process tracking events.
 */

import type { Shipment } from '@/lib/types';
import { MapPin, ArrowRight } from 'lucide-react';

interface ShipmentTableProps {
    shipments: Shipment[];
}

/** Status badge color mapping */
const statusStyles: Record<Shipment['status'], string> = {
    'In Transit': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Delayed': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Delivered': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'At Risk': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Customs Hold': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function ShipmentTable({ shipments }: ShipmentTableProps) {
    return (
        <div className="card-glass rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-4 border-b border-slate-700/50">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MapPin size={16} className="text-blue-400" />
                    Active Global Shipments
                </h2>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th className="text-left px-5 py-3">Shipment ID</th>
                            <th className="text-left px-5 py-3">Route</th>
                            <th className="text-left px-5 py-3">Carrier</th>
                            <th className="text-left px-5 py-3">Cargo</th>
                            <th className="text-left px-5 py-3">Value</th>
                            <th className="text-left px-5 py-3">ETA</th>
                            <th className="text-left px-5 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map((shipment, i) => (
                            <tr
                                key={shipment.id}
                                className={`
                  border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors
                  ${i % 2 === 0 ? 'bg-slate-800/10' : ''}
                `}
                            >
                                <td className="px-5 py-3 font-mono text-xs text-blue-300">
                                    {shipment.id}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-slate-300">{shipment.origin}</span>
                                        <ArrowRight size={12} className="text-slate-500" />
                                        <span className="text-slate-300">{shipment.destination}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-400">
                                    {shipment.carrier}
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-300">
                                    {shipment.cargo}
                                </td>
                                <td className="px-5 py-3 text-xs font-medium text-white">
                                    {shipment.value}
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-400">
                                    {shipment.eta}
                                </td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`
                      inline-block px-2.5 py-1 rounded-full text-[11px] font-medium
                      border ${statusStyles[shipment.status]}
                    `}
                                    >
                                        {shipment.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
