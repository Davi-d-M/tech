-- APEX OS: USER INTELLIGENCE & BEHAVIORAL DNA 🛡️🛰️🔬
-- Transforms raw signals into living user identities.

-- 1. ENHANCED USER SESSIONS (The Journey Ledger)
CREATE TABLE IF NOT EXISTS public.user_sessions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Entry/Exit Telemetry
    entry_url TEXT,
    exit_url TEXT,
    acquisition_source TEXT, -- UTM Source
    acquisition_campaign TEXT,

    -- Behavior Aggregates
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    product_views INTEGER DEFAULT 0,
    cart_additions INTEGER DEFAULT 0,
    checkout_started BOOLEAN DEFAULT false,
    purchase_completed BOOLEAN DEFAULT false,

    -- Tech Context
    device_type TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    location_hint JSONB,

    -- Temporal Data
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 2. BEHAVIORAL DNA ENGINE (Inferred Traits)
CREATE TABLE IF NOT EXISTS public.user_behavioral_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- The DNA Helix (0-100 Scores)
    engagement_score INTEGER DEFAULT 0, -- Time spent + Interaction density
    shopping_frequency INTEGER DEFAULT 0, -- Sessions per week
    feature_adoption INTEGER DEFAULT 0, -- % of elite features used (3D, Compare, etc.)
    returning_probability INTEGER DEFAULT 0, -- Logistic regression hint

    -- Preference Mapping
    top_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_price_range NUMERIC[] DEFAULT ARRAY[0, 10000]::NUMERIC[],
    preferred_channel TEXT DEFAULT 'Direct',

    last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. AUTOMATED ANALYTICS FUNCTIONS

-- Function to sync a signal into a session aggregate
CREATE OR REPLACE FUNCTION public.sync_signal_to_session()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_sessions_v2 (session_id, visitor_id, user_id, entry_url, last_activity_at)
    VALUES (NEW.session_id, NEW.visitor_id, NEW.user_id, NEW.url, NEW.created_at)
    ON CONFLICT (session_id) DO UPDATE SET
        user_id = COALESCE(public.user_sessions_v2.user_id, EXCLUDED.user_id),
        last_activity_at = EXCLUDED.last_activity_at,
        exit_url = NEW.url,
        view_count = public.user_sessions_v2.view_count + (CASE WHEN NEW.event_type = 'VIEW' THEN 1 ELSE 0 END),
        click_count = public.user_sessions_v2.click_count + (CASE WHEN NEW.event_type = 'CLICK' THEN 1 ELSE 0 END),
        product_views = public.user_sessions_v2.product_views + (CASE WHEN NEW.event_type = 'PRODUCT_VIEW' THEN 1 ELSE 0 END),
        cart_additions = public.user_sessions_v2.cart_additions + (CASE WHEN NEW.event_type = 'ADD_TO_BAG' THEN 1 ELSE 0 END),
        checkout_started = CASE WHEN NEW.event_type = 'CHECKOUT_START' THEN true ELSE public.user_sessions_v2.checkout_started END,
        purchase_completed = CASE WHEN NEW.event_type = 'PAYMENT_SUCCESS' THEN true ELSE public.user_sessions_v2.purchase_completed END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process signals in real-time
DROP TRIGGER IF EXISTS tr_sync_signal_to_session ON public.user_signals;
CREATE TRIGGER tr_sync_signal_to_session
    AFTER INSERT ON public.user_signals
    FOR EACH ROW EXECUTE PROCEDURE public.sync_signal_to_session();

-- 4. DNA CALCULATION LOGIC
CREATE OR REPLACE FUNCTION public.compute_visitor_dna(p_visitor_id TEXT)
RETURNS VOID AS $$
DECLARE
    v_engagement INTEGER;
    v_freq INTEGER;
    v_adoption INTEGER;
    v_user_id UUID;
BEGIN
    -- 1. Calculate Engagement (Interaction Density)
    SELECT LEAST(100, COUNT(*) * 5) INTO v_engagement
    FROM public.user_signals
    WHERE visitor_id = p_visitor_id
    AND created_at > now() - interval '30 days';

    -- 2. Calculate Frequency (Session Density)
    SELECT LEAST(100, COUNT(*) * 10) INTO v_freq
    FROM public.user_sessions_v2
    WHERE visitor_id = p_visitor_id
    AND started_at > now() - interval '30 days';

    -- 3. Feature Adoption (% of specific technical signals)
    SELECT LEAST(100, COUNT(DISTINCT event_type) * 15) INTO v_adoption
    FROM public.user_signals
    WHERE visitor_id = p_visitor_id
    AND event_type IN ('PRODUCT_ZOOM', '3D_INTERACT', 'FILTER_APPLY', 'SORT_APPLY', 'WISHLIST_ADD');

    -- Get User ID if available
    SELECT user_id INTO v_user_id FROM public.user_sessions_v2 WHERE visitor_id = p_visitor_id LIMIT 1;

    -- Upsert DNA
    INSERT INTO public.user_behavioral_dna (visitor_id, user_id, engagement_score, shopping_frequency, feature_adoption, last_computed_at)
    VALUES (p_visitor_id, v_user_id, v_engagement, v_freq, v_adoption, now())
    ON CONFLICT (visitor_id) DO UPDATE SET
        engagement_score = EXCLUDED.engagement_score,
        shopping_frequency = EXCLUDED.shopping_frequency,
        feature_adoption = EXCLUDED.feature_adoption,
        last_computed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. IDENTITY RECONCILIATION BRIDGE
CREATE OR REPLACE FUNCTION public.bridge_guest_dna_to_user()
RETURNS trigger AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND OLD.user_id IS NULL THEN
        UPDATE public.user_behavioral_dna
        SET user_id = NEW.user_id
        WHERE visitor_id = NEW.visitor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_bridge_guest_dna ON public.user_sessions_v2;
CREATE TRIGGER tr_bridge_guest_dna
    AFTER UPDATE ON public.user_sessions_v2
    FOR EACH ROW EXECUTE PROCEDURE public.bridge_guest_dna_to_user();
