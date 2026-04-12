-- ============================================================
-- Migration 002: Add Risk Scans Table for LangGraph Monitoring
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Risk Scans Table (LangGraph Monitoring) ────────────────
-- Stores proactive risk monitoring scan results per route
CREATE TABLE IF NOT EXISTS risk_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route TEXT NOT NULL,                    -- e.g. 'Shanghai → Rotterdam'
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 10),
    risk_category TEXT NOT NULL DEFAULT 'none' 
        CHECK (risk_category IN (
            'geopolitical', 'weather', 'labor', 'infrastructure',
            'piracy', 'regulatory', 'congestion', 'none'
        )),
    summary TEXT NOT NULL DEFAULT '',
    news_sources TEXT[] DEFAULT '{}',        -- Array of news source titles
    confidence TEXT DEFAULT 'low' 
        CHECK (confidence IN ('high', 'medium', 'low')),
    recommended_action TEXT DEFAULT '',
    scanned_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_risk_scans_scanned_at 
    ON risk_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scans_risk_score 
    ON risk_scans(risk_score DESC);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE risk_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on risk_scans"
    ON risk_scans FOR SELECT
    USING (true);

CREATE POLICY "Allow service insert on risk_scans"
    ON risk_scans FOR INSERT
    WITH CHECK (true);

-- ─── Enable Realtime ────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE risk_scans;
