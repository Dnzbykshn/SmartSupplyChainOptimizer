-- ============================================================
-- Smart Supply Chain Optimizer — User Settings Migration
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- This creates the user_settings table for AI agent configuration
-- ============================================================

-- ─── User Settings Table (Agent Configuration) ─────────────
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

-- Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on user_settings" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on user_settings" ON user_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on user_settings" ON user_settings FOR INSERT WITH CHECK (true);
