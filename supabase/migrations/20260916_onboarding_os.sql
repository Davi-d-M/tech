-- APEX OS: UNIFIED ONBOARDING ENGINE
-- Tracks progress across all roles (Customer, Rider, Merchant, Affiliate)

-- 1. ONBOARDING PROGRESS (State Store)
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'CUSTOMER', 'RIDER', 'MERCHANT', 'AFFILIATE', 'STAFF'
    current_step TEXT NOT NULL,
    completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
    score INTEGER DEFAULT 0, -- 0 to 100
    metadata JSONB DEFAULT '{}'::JSONB,
    is_completed BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role)
);

-- 2. ONBOARDING EVENTS (Analytics Stream)
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    step_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'START', 'COMPLETE', 'DROP', 'RESUME'
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. ACTIVATION TRIGGERS (ROI Tracking)
CREATE TABLE IF NOT EXISTS public.activation_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'FIRST_ORDER', 'FIRST_MISSION', 'FIRST_LINK', 'FIRST_SALE'
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 4. RLS & POLICIES
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_triggers ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own progress
CREATE POLICY "Users manage own onboarding" ON public.onboarding_progress
FOR ALL USING (auth.uid() = user_id);

-- Users log their own events
CREATE POLICY "Users log onboarding events" ON public.onboarding_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins manage all
CREATE POLICY "Admins view all onboarding" ON public.onboarding_progress
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid())
);

-- 5. TRIGGER: AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_onboarding_timestamp
    BEFORE UPDATE ON public.onboarding_progress
    FOR EACH ROW EXECUTE PROCEDURE update_onboarding_timestamp();
