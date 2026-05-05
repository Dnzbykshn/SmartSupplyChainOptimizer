-- ============================================================
--  MCP Activity Log Table
--  Records every MCP tool call so the UI Inspector panel can
--  show "process and results" of MCP operations in real time.
--
--  Run this in the Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS mcp_activity (
    id BIGSERIAL PRIMARY KEY,
    tool TEXT NOT NULL,
    args TEXT,
    result_preview TEXT,
    duration_ms INTEGER,
    called_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_activity_called_at
    ON mcp_activity(called_at DESC);

-- Optional: auto-prune rows older than 7 days (uncomment if desired)
-- CREATE OR REPLACE FUNCTION prune_mcp_activity() RETURNS void AS $$
-- BEGIN
--     DELETE FROM mcp_activity WHERE called_at < now() - INTERVAL '7 days';
-- END;
-- $$ LANGUAGE plpgsql;
