/**
 * SettingsControl.tsx — Reusable settings form controls
 * 
 * Provides slider, toggle, and dropdown controls for agent configuration.
 * Each control has a label, description, and current value display.
 * 
 * FUTURE: Configuration changes will be persisted to Supabase and
 * consumed by the Multi-Agent orchestrator to influence decision-making.
 */

'use client';

interface SliderControlProps {
    label: string;
    description: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    formatValue?: (value: number) => string;
    onChange: (value: number) => void;
}

export function SliderControl({
    label,
    description,
    value,
    min,
    max,
    step = 1,
    unit = '',
    formatValue,
    onChange,
}: SliderControlProps) {
    const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="card-glass rounded-xl p-5">
            <div className="flex items-start justify-between mb-1">
                <div>
                    <h4 className="text-sm font-semibold text-white">{label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                </div>
                <span className="text-lg font-bold text-blue-400 shrink-0 ml-4">{displayValue}</span>
            </div>
            <div className="mt-4 relative">
                {/* Progress fill behind the range input */}
                <div className="absolute top-[9px] left-0 h-1.5 rounded-full bg-blue-600/60" style={{ width: `${percentage}%` }} />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="relative z-10 w-full"
                />
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                    <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
                    <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
                </div>
            </div>
        </div>
    );
}

// ── Toggle control ──────────────────────────────────────────────────────────

interface ToggleControlProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, description, checked, onChange }: ToggleControlProps) {
    return (
        <div className="card-glass rounded-xl p-5">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-white">{label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onChange(!checked)}
                    className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
            border-2 border-transparent transition-colors duration-200
            ${checked ? 'bg-blue-600' : 'bg-slate-600'}
          `}
                    role="switch"
                    aria-checked={checked}
                >
                    <span
                        className={`
              pointer-events-none inline-block h-5 w-5 rounded-full
              bg-white shadow transform transition-transform duration-200
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
                    />
                </button>
            </div>
        </div>
    );
}

// ── Dropdown control ────────────────────────────────────────────────────────

interface DropdownControlProps {
    label: string;
    description: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

export function DropdownControl({ label, description, value, options, onChange }: DropdownControlProps) {
    return (
        <div className="card-glass rounded-xl p-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h4 className="text-sm font-semibold text-white">{label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                </div>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
