/**
 * Global Dashboard Page (/)
 * 
 * The command center view showing:
 *   1. High-level KPI metrics (4 cards)
 *   2. Critical supply chain disruption alert with CTA
 *   3. Active global shipments table
 * 
 * FUTURE: All data will be fetched from Supabase with real-time subscriptions.
 * Metrics will be computed by AI agents and streamed to this page.
 */

import MetricCard from '@/components/dashboard/MetricCard';
import ShipmentTable from '@/components/dashboard/ShipmentTable';
import AlertWidget from '@/components/dashboard/AlertWidget';
import { dashboardMetrics, shipments, criticalAlert } from '@/lib/mock-data';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity size={24} className="text-blue-400" />
            Global Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time supply chain intelligence &amp; control center
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational — Last sync: Just now
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Critical Alert Widget */}
      <AlertWidget alert={criticalAlert} />

      {/* Shipments Table */}
      <ShipmentTable shipments={shipments} />
    </div>
  );
}
