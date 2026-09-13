-- APEX OS: INTELLIGENCE WORLD EXPANSION (FIXED)
-- Connects Predictive Metrics, Behavioral Cohorts, and Compliance Hub.

-- 1. SEARCH INTELLIGENCE (Demand Signals)
CREATE TABLE IF NOT EXISTS public.search_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    is_success BOOLEAN DEFAULT true,
    category_hint TEXT, -- e.g. 'Whiskey'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.5 USER SIGNALS ENHANCEMENT
ALTER TABLE public.user_signals
ADD COLUMN IF NOT EXISTS visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_signals_visitor ON public.user_signals(visitor_id);

-- 2. CUSTOMER SEGMENTS (Behavioral Cohorts)
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g. 'HIGH_WHISKEY_INTENT'
    description TEXT,
    criteria JSONB NOT NULL, -- The logic for the segment
    is_dynamic BOOLEAN DEFAULT true,
    last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PREDICTIVE CUSTOMER SCORES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS purchase_propensity INTEGER DEFAULT 0, -- 0-100
ADD COLUMN IF NOT EXISTS churn_risk INTEGER DEFAULT 0, -- 0-100
ADD COLUMN IF NOT EXISTS predicted_clv NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_purchase_category TEXT,
ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'WhatsApp',
ADD COLUMN IF NOT EXISTS discount_sensitivity TEXT DEFAULT 'Medium'; -- 'Low', 'Medium', 'High'

-- 4. PRODUCT INTELLIGENCE (360)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS opportunity_score INTEGER DEFAULT 0, -- 0-100
ADD COLUMN IF NOT EXISTS total_3d_time INTEGER DEFAULT 0, -- in seconds
ADD COLUMN IF NOT EXISTS avg_3d_interaction_time NUMERIC DEFAULT 0;

-- 5. MARKETING COMPLIANCE HUB
CREATE TABLE IF NOT EXISTS public.compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT,
    content_type TEXT,
    platform TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Flagged', 'Approved'
    rule_breached TEXT, -- e.g. 'ALCOHOL_PROMOTION_SUCCESS'
    admin_reviewer UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RLS POLICIES (Idempotent)
ALTER TABLE public.search_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage intelligence" ON public.search_intelligence;
CREATE POLICY "Admins manage intelligence" ON public.search_intelligence FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage segments" ON public.customer_segments;
CREATE POLICY "Admins manage segments" ON public.customer_segments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage compliance" ON public.compliance_logs;
CREATE POLICY "Admins manage compliance" ON public.compliance_logs FOR ALL TO authenticated USING (true);

-- Functions for Search Pulse
CREATE OR REPLACE FUNCTION public.log_search_event(
    p_session_id TEXT,
    p_visitor_id TEXT,
    p_query TEXT,
    p_results_count INTEGER,
    p_is_success BOOLEAN
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.search_intelligence (session_id, visitor_id, query, results_count, is_success)
    VALUES (p_session_id, p_visitor_id, p_query, p_results_count, p_is_success);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IDENTITY BRIDGE: Reconcile guest signals with registered user
CREATE OR REPLACE FUNCTION public.reconcile_identity_bridge(
    p_visitor_id TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Update all user_signals for this visitor that don't have a user_id
    UPDATE public.user_signals
    SET user_id = p_user_id
    WHERE visitor_id = p_visitor_id
    AND user_id IS NULL;

    -- Link in search intelligence too
    UPDATE public.search_intelligence
    SET user_id = p_user_id
    WHERE visitor_id = p_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
