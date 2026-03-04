/**
 * Agent Configurations Page (/settings)
 * 
 * The primary data-gathering layer allowing users to adjust systemic
 * parameters that influence AI agent decision-making:
 * 
 *   - Corporate Risk Tolerance Level (1-10 scale)
 *   - Maximum Air Freight Budget Margin ($0-$500K)
 *   - Minimum Safety Stock Days (0-90)
 *   - Auto-Reroute toggle
 *   - Preferred Carrier dropdown
 *   - Notification Frequency dropdown
 *   - Cost Optimization Mode dropdown
 * 
 * FUTURE: All configuration values will be persisted to Supabase and
 * consumed by the Multi-Agent orchestrator. Changes will trigger
 * immediate re-computation of agent recommendations.
 * 
 * ARCHITECTURAL NOTE:
 * Currently all state is managed client-side with React useState.
 * In Phase 2, this will be replaced with:
 *   1. Supabase upsert on save
 *   2. Optimistic UI updates
 *   3. Real-time sync across browser tabs
 */

'use client';

import { useState } from 'react';
import { SliderControl, ToggleControl, DropdownControl } from '@/components/settings/SettingsControl';
import { defaultAgentConfig } from '@/lib/mock-data';
import type { AgentConfig } from '@/lib/types';
import { Settings, Save, CheckCircle2, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
    const [config, setConfig] = useState<AgentConfig>({ ...defaultAgentConfig });
    const [saved, setSaved] = useState(false);

    /** Update a single config field */
    const updateConfig = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setSaved(false); // Reset saved state on any change
    };

    /** Simulate saving configuration */
    const handleSave = () => {
        // FUTURE: This will call a Supabase upsert
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    /** Reset to defaults */
    const handleReset = () => {
        setConfig({ ...defaultAgentConfig });
        setSaved(false);
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings size={24} className="text-blue-400" />
                        Agent Configurations
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Adjust systemic parameters that influence Multi-Agent AI decision-making
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className={`
              flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}
            `}
                    >
                        {saved ? (
                            <>
                                <CheckCircle2 size={16} />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Risk & Budget Section */}
            <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Risk &amp; Budget Parameters
                </h2>
                <div className="space-y-4">
                    <SliderControl
                        label="Corporate Risk Tolerance Level"
                        description="Defines how aggressively the AI agents should balance cost vs. reliability. Lower values prioritize safety; higher values accept more risk for cost savings."
                        value={config.riskToleranceLevel}
                        min={1}
                        max={10}
                        onChange={(v) => updateConfig('riskToleranceLevel', v)}
                        formatValue={(v) => `Level ${v}`}
                    />

                    <SliderControl
                        label="Maximum Air Freight Budget Margin"
                        description="The maximum additional budget allocated for emergency air freight operations per crisis event."
                        value={config.maxAirFreightBudget}
                        min={0}
                        max={500000}
                        step={10000}
                        onChange={(v) => updateConfig('maxAirFreightBudget', v)}
                        formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />

                    <SliderControl
                        label="Minimum Safety Stock Days"
                        description="The minimum number of days of safety stock to maintain before triggering automated replenishment alerts."
                        value={config.minSafetyStockDays}
                        min={0}
                        max={90}
                        unit=" days"
                        onChange={(v) => updateConfig('minSafetyStockDays', v)}
                    />
                </div>
            </div>

            {/* Automation Section */}
            <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Automation &amp; Preferences
                </h2>
                <div className="space-y-4">
                    <ToggleControl
                        label="Auto-Reroute Capability"
                        description="When enabled, the Routing Strategist can automatically reroute shipments below a cost threshold without human approval."
                        checked={config.autoRerouteEnabled}
                        onChange={(v) => updateConfig('autoRerouteEnabled', v)}
                    />

                    <DropdownControl
                        label="Preferred Carrier"
                        description="Default carrier preference for new shipment routing decisions."
                        value={config.preferredCarrier}
                        options={[
                            { value: 'any', label: 'No Preference (Best Available)' },
                            { value: 'maersk', label: 'Maersk Line' },
                            { value: 'msc', label: 'MSC' },
                            { value: 'cosco', label: 'COSCO Shipping' },
                            { value: 'evergreen', label: 'Evergreen Marine' },
                            { value: 'one', label: 'ONE (Ocean Network Express)' },
                        ]}
                        onChange={(v) => updateConfig('preferredCarrier', v)}
                    />

                    <DropdownControl
                        label="Notification Frequency"
                        description="How often should the system send disruption alerts and agent reports."
                        value={config.notificationFrequency}
                        options={[
                            { value: 'realtime', label: 'Real-Time (Immediate)' },
                            { value: 'hourly', label: 'Hourly Digest' },
                            { value: 'daily', label: 'Daily Summary' },
                        ]}
                        onChange={(v) => updateConfig('notificationFrequency', v as AgentConfig['notificationFrequency'])}
                    />

                    <DropdownControl
                        label="Cost Optimization Mode"
                        description="Controls how aggressively the system optimizes for cost reduction vs. reliability."
                        value={config.costOptimizationMode}
                        options={[
                            { value: 'aggressive', label: 'Aggressive — Minimize costs, accept moderate risk' },
                            { value: 'balanced', label: 'Balanced — Optimal cost-reliability trade-off' },
                            { value: 'conservative', label: 'Conservative — Prioritize reliability over cost' },
                        ]}
                        onChange={(v) => updateConfig('costOptimizationMode', v as AgentConfig['costOptimizationMode'])}
                    />
                </div>
            </div>

            {/* Future integration note */}
            <div className="card-glass rounded-xl p-5 border border-dashed border-slate-600">
                <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Phase 2 Integration Note:</strong> These configuration
                    values will be persisted to a Supabase PostgreSQL database and consumed by the Multi-Agent
                    AI orchestrator. Any configuration change will trigger immediate re-computation of agent
                    recommendations across all active crisis scenarios.
                </p>
            </div>
        </div>
    );
}
