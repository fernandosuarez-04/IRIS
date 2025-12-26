-- Create Focus Sessions Table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    task_name TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    target_type VARCHAR CHECK (target_type IN ('global', 'team', 'users')),
    target_ids UUID[], -- Array of user_ids or team_ids
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups of active sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_active 
ON public.focus_sessions(status, end_time);

-- RLS Policies
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can read active sessions (needed for the enforcer)
CREATE POLICY "Everyone can read active sessions"
    ON public.focus_sessions FOR SELECT
    USING (status = 'active');

-- Only admins/creators can insert/update (This logic is handled by API service role usually, but for client safety:)
CREATE POLICY "Admins can insert focus sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = created_by);
