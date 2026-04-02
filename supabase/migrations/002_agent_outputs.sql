-- ============================================================
-- Migration 002: Add intermediate agent output columns
-- Stores Risk Scout and Inventory Forecaster text outputs
-- alongside the existing crisis run record.
-- ============================================================

ALTER TABLE crisis_runs
ADD COLUMN IF NOT EXISTS risk_scout_output TEXT,
ADD COLUMN IF NOT EXISTS forecaster_output TEXT;
