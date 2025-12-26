-- ============================================================================
-- ARIA Usage Tracking
-- Migration: 007_aria_usage_tracking.sql
-- Created: 2025-12-26
-- ============================================================================

CREATE TABLE IF NOT EXISTS aria_usage_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES account_users(user_id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(team_id) ON DELETE SET NULL,
    
    -- AI Details
    model VARCHAR(100) NOT NULL, -- e.g., 'gemini-2.0-flash-exp'
    
    -- Token Usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Interaction Context
    interaction_type VARCHAR(50) DEFAULT 'chat', -- 'chat', 'tool_execution', 'embedding'
    status VARCHAR(20) DEFAULT 'success',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aria_usage_user ON aria_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_aria_usage_team ON aria_usage_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_aria_usage_created ON aria_usage_logs(created_at);

-- View para estadísticas rápidas por equipo
CREATE OR REPLACE VIEW v_team_aria_usage AS
SELECT 
    team_id,
    DATE_TRUNC('day', created_at) as usage_date,
    SUM(total_tokens) as total_tokens,
    COUNT(*) as interaction_count
FROM aria_usage_logs
GROUP BY team_id, DATE_TRUNC('day', created_at);
