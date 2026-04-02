-- ============================================================
-- Smart Supply Chain Optimizer — Supabase Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Crisis Runs Table ──────────────────────────────────────
-- Stores each CrewAI execution run with its input scenario
CREATE TABLE IF NOT EXISTS crisis_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crisis_description TEXT NOT NULL,
    affected_routes TEXT,
    inventory_status TEXT,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    token_usage JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Mitigation Plans Table ─────────────────────────────────
-- Stores the AI-generated plans linked to a crisis run
CREATE TABLE IF NOT EXISTS mitigation_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID REFERENCES crisis_runs(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,          -- 'plan-a', 'plan-b', 'plan-c'
    name TEXT NOT NULL,             -- 'Plan A', 'Plan B', 'Plan C'
    strategy TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_cost TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    co2_impact TEXT NOT NULL,
    reliability_score INTEGER NOT NULL CHECK (reliability_score BETWEEN 0 AND 100),
    details TEXT[] NOT NULL,        -- Array of detail strings
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mitigation_plans_run_id ON mitigation_plans(run_id);
CREATE INDEX IF NOT EXISTS idx_crisis_runs_created_at ON crisis_runs(created_at DESC);

-- ─── Row Level Security ─────────────────────────────────────
-- Enable RLS on both tables
ALTER TABLE crisis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitigation_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the frontend dashboard)
CREATE POLICY "Allow public read on crisis_runs"
    ON crisis_runs FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on mitigation_plans"
    ON mitigation_plans FOR SELECT
    USING (true);

-- Allow service role to insert (backend only)
CREATE POLICY "Allow service insert on crisis_runs"
    ON crisis_runs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow service insert on mitigation_plans"
    ON mitigation_plans FOR INSERT
    WITH CHECK (true);

-- ─── Enable Realtime ────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE crisis_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE mitigation_plans;

-- ─── Inventory Table (For AI Forecaster) ────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    daily_burn_rate INTEGER NOT NULL,
    unit TEXT DEFAULT 'units',
    warehouse_location TEXT,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Seed Data (For Testing)
INSERT INTO inventory (item_name, category, current_stock, daily_burn_rate, warehouse_location) 
VALUES 
    ('Li-Ion Battery Cells (Type 21700)', 'Electronics', 45000, 8500, 'Shanghai Central Hub'),
    ('OLED Display Modules (6.7 inch)', 'Displays', 12000, 3200, 'Shanghai Central Hub'),
    ('PCB Assembly Boards (Rev. C)', 'Electronics', 28000, 2100, 'Ningbo Fast-Track'),
    ('Aluminum Enclosure Shells', 'Hardware', 67000, 1800, 'Hamburg Port Depot')
ON CONFLICT DO NOTHING;

-- Policies for inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow service insert on inventory" ON inventory FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- ─── User Settings Table (Agent Configuration) ─────────────
-- Stores corporate parameters that influence AI agent decisions.
-- Single-row pattern (no auth). The backend reads this before each crew run.
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_tolerance_level INTEGER DEFAULT 5 CHECK (risk_tolerance_level BETWEEN 1 AND 10),
    max_air_freight_budget INTEGER DEFAULT 250000,
    min_safety_stock_days INTEGER DEFAULT 14 CHECK (min_safety_stock_days BETWEEN 0 AND 90),
    auto_reroute_enabled BOOLEAN DEFAULT false,
    preferred_carrier TEXT DEFAULT 'any',
    notification_frequency TEXT DEFAULT 'hourly' CHECK (notification_frequency IN ('realtime', 'hourly', 'daily')),
    cost_optimization_mode TEXT DEFAULT 'balanced' CHECK (cost_optimization_mode IN ('aggressive', 'balanced', 'conservative')),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default settings row
INSERT INTO user_settings (
    risk_tolerance_level, max_air_freight_budget, min_safety_stock_days,
    auto_reroute_enabled, preferred_carrier, notification_frequency, cost_optimization_mode
) VALUES (5, 250000, 14, false, 'any', 'hourly', 'balanced')
ON CONFLICT DO NOTHING;

-- Policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on user_settings" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on user_settings" ON user_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on user_settings" ON user_settings FOR INSERT WITH CHECK (true);
