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
 * INTEGRATION: All configuration values are persisted to the Supabase
 * `user_settings` table and consumed by the CrewAI Multi-Agent orchestrator.
 * Changes saved here directly influence agent recommendations.
 */

'use client';

import { useState, useEffect } from 'react';
import { SliderControl, ToggleControl, DropdownControl } from '@/components/settings/SettingsControl';
import { defaultAgentConfig } from '@/lib/mock-data';
import type { AgentConfig } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Settings, Save, CheckCircle2, RotateCcw, Loader2, Database, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const [config, setConfig] = useState<AgentConfig>({ ...defaultAgentConfig });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
    const [error, setError] = useState<string | null>(null);

    /** Load settings from Supabase on mount */
    useEffect(() => {
        async function loadSettings() {
            try {
                const { data, error: fetchError } = await supabase
                    .from('user_settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (fetchError) throw fetchError;

                if (data) {
                    setConfig({
                        riskToleranceLevel: data.risk_tolerance_level,
                        maxAirFreightBudget: data.max_air_freight_budget,
                        minSafetyStockDays: data.min_safety_stock_days,
                        autoRerouteEnabled: data.auto_reroute_enabled,
                        preferredCarrier: data.preferred_carrier,
                        notificationFrequency: data.notification_frequency,
                        costOptimizationMode: data.cost_optimization_mode,
                    });
                    setDataSource('supabase');
                }
            } catch (err) {
                console.log('Failed to load settings from Supabase, using defaults:', err);
                setDataSource('local');
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    /** Update a single config field */
    const updateConfig = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
        setError(null);
    };

    /** Save configuration to Supabase */
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            // Map camelCase frontend fields to snake_case DB columns
            const dbPayload = {
                risk_tolerance_level: config.riskToleranceLevel,
                max_air_freight_budget: config.maxAirFreightBudget,
                min_safety_stock_days: config.minSafetyStockDays,
                auto_reroute_enabled: config.autoRerouteEnabled,
                preferred_carrier: config.preferredCarrier,
                notification_frequency: config.notificationFrequency,
                cost_optimization_mode: config.costOptimizationMode,
                updated_at: new Date().toISOString(),
            };

            // Try to get existing settings row
            const { data: existing } = await supabase
                .from('user_settings')
                .select('id')
                .limit(1)
                .single();

            if (existing) {
                // Update existing row
                const { error: updateError } = await supabase
                    .from('user_settings')
                    .update(dbPayload)
                    .eq('id', existing.id);

                if (updateError) throw updateError;
            } else {
                // Insert new row
                const { error: insertError } = await supabase
                    .from('user_settings')
                    .insert(dbPayload);

                if (insertError) throw insertError;
            }

            setSaved(true);
            setDataSource('supabase');
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError('Failed to save to database. Settings saved locally only.');
            // Still show saved for local state
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    /** Reset to defaults */
    const handleReset = () => {
        setConfig({ ...defaultAgentConfig });
        setSaved(false);
        setError(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                    <p className="text-sm text-slate-400">Loading agent configurations...</p>
                </div>
            </div>
        );
    }

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
                    {/* Data source badge */}
                    <span className={`
                        text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider
                        flex items-center gap-1.5 shrink-0
                        ${dataSource === 'supabase'
                            ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                            : 'text-slate-400 bg-slate-500/10 border border-slate-500/30'}
                    `}>
                        <Database size={10} />
                        {dataSource === 'supabase' ? 'Supabase Synced' : 'Local Only'}
                    </span>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
              flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${saving
                                ? 'bg-blue-600/50 text-blue-300 cursor-wait'
                                : saved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'}
            `}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle2 size={16} />
                                Saved to Database!
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

            {/* Error banner */}
            {error && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-300">{error}</p>
                </div>
            )}

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

            {/* Integration status */}
            <div className="card-glass rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-emerald-400">✅ AI Integration Active:</strong> These configuration
                    values are persisted to the Supabase PostgreSQL database. When the CrewAI Multi-Agent system
                    runs, it reads these parameters and injects them into the Routing Strategist&apos;s
                    decision-making context. Changes saved here directly influence future AI recommendations
                    across cost tolerance, carrier selection, and risk assessment dimensions.
                </p>
            </div>
        </div>
    );
}
