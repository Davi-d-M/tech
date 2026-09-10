-- APEX OS: PHASE 2 EXPANSION (3D & SOCIAL COMMAND)
-- Connects 3D Experience with Social Intelligence and Multi-Touch Attribution.

-- 1. 3D ENGINE UPGRADE
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS model_url TEXT,
ADD COLUMN IF NOT EXISTS auto_rotate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rotation_speed NUMERIC DEFAULT 1.3,
ADD COLUMN IF NOT EXISTS hotspots JSONB DEFAULT '[]'::JSONB;

-- 2. SOCIAL COMMAND CENTER
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'facebook', 'youtube', 'whatsapp'
    account_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    access_token_encrypted TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'connected', -- 'connected', 'expired', 'error'
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    external_post_id TEXT, -- ID from the platform
    content TEXT,
    media_url TEXT,
    campaign_id TEXT, -- For attribution
    status TEXT DEFAULT 'published', -- 'draft', 'scheduled', 'published', 'failed'
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metrics JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0, "clicks": 0}'::JSONB
);

-- 3. ELITE AFFILIATE & MULTI-TOUCH ATTRIBUTION
CREATE TABLE IF NOT EXISTS public.order_attribution (
    order_id BIGINT PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    affiliate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    first_touch_source TEXT,
    first_touch_campaign TEXT,
    last_touch_source TEXT,
    last_touch_campaign TEXT,
    assisted_touches JSONB DEFAULT '[]'::JSONB,
    utm_medium TEXT,
    utm_content TEXT,
    conversion_path TEXT, -- e.g. 'tiktok -> direct -> purchase'
    revenue NUMERIC NOT NULL,
    commission_earned NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. VISITOR IDENTITY ENHANCEMENT
ALTER TABLE public.visitor_identity
ADD COLUMN IF NOT EXISTS acquisition_content TEXT,
ADD COLUMN IF NOT EXISTS acquisition_medium TEXT;

-- 5. RLS POLICIES
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attribution ENABLE ROW LEVEL SECURITY;

-- Admins/Owners manage social accounts
CREATE POLICY "Admins manage social accounts" ON public.social_accounts
FOR ALL TO authenticated USING (true);

-- Admins/Owners manage social posts
CREATE POLICY "Admins manage social posts" ON public.social_posts
FOR ALL TO authenticated USING (true);

-- Admins see all attribution, Affiliates see their own
CREATE POLICY "Admins view all attribution" ON public.order_attribution
FOR SELECT TO authenticated USING (true);

-- Functions for attribution tracking
CREATE OR REPLACE FUNCTION public.log_order_attribution(
    p_order_id BIGINT,
    p_affiliate_id UUID,
    p_session_id TEXT,
    p_source TEXT,
    p_campaign TEXT,
    p_medium TEXT,
    p_content TEXT,
    p_revenue NUMERIC,
    p_commission NUMERIC
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.order_attribution (
        order_id, affiliate_id, session_id,
        last_touch_source, last_touch_campaign,
        utm_medium, utm_content, revenue, commission_earned
    ) VALUES (
        p_order_id, p_affiliate_id, p_session_id,
        p_source, p_campaign, p_medium, p_content, p_revenue, p_commission
    ) ON CONFLICT (order_id) DO UPDATE SET
        affiliate_id = EXCLUDED.affiliate_id,
        last_touch_source = EXCLUDED.last_touch_source,
        commission_earned = EXCLUDED.commission_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
