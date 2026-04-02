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
