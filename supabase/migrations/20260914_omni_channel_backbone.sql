-- APEX OS: OMNI-CHANNEL CONTENT & PUBLISHING BACKBONE
-- Infrastructure for centralized content management and background publishing.

-- 1. CONTENT LIBRARY (Master Repository)
CREATE TABLE IF NOT EXISTS public.content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL, -- 'product_story', 'brand_video', 'educational', 'announcement'
    master_media_url TEXT, -- Primary high-res asset
    media_assets TEXT[] DEFAULT ARRAY[]::TEXT[], -- Additional variants
    product_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[], -- Linked SKUs for tagging/UTMs
    status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved', 'archived'
    metadata JSONB DEFAULT '{}'::JSONB, -- Aspect ratios, focal points, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. PUBLISHING JOBS (The Queue)
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.content_library(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin'
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'published', 'failed', 'scheduled'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER DEFAULT 0,
    last_error TEXT,
    external_post_id TEXT, -- ID from the provider
    platform_payload JSONB NOT NULL, -- Customized caption, hashtags, and media for this specific platform
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. JOB ATTEMPTS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.publishing_job_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    error_message TEXT,
    attempt_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. COMPLIANCE RULES & LOGS
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ALCOHOL', 'MINORS', 'MISLEADING'
    pattern TEXT NOT NULL, -- Regex or keyword to flag
    action TEXT DEFAULT 'flag', -- 'flag', 'block'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.content_library(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.compliance_rules(id),
    status TEXT NOT NULL, -- 'flagged', 'approved', 'rejected'
    reviewer_id UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. SOCIAL METRICS HISTORY (Time-series)
CREATE TABLE IF NOT EXISTS public.social_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RLS & POLICIES
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics_history ENABLE ROW LEVEL SECURITY;

-- Admins manage all content
CREATE POLICY "Admins manage content library" ON public.content_library FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage publishing jobs" ON public.publishing_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage compliance" ON public.compliance_rules FOR ALL TO authenticated USING (true);

-- 7. INITIAL COMPLIANCE SEED (Kenyan Alcohol Protocol)
INSERT INTO public.compliance_rules (name, category, pattern, action) VALUES
('Direct consumption encouragement', 'ALCOHOL', 'drink more|non-stop|bottoms up', 'flag'),
('Minors target', 'MINORS', 'kids|school|under 18|youth', 'block'),
('Therapeutic claims', 'ALCOHOL', 'healthy|cure|medicine|fitness', 'block'),
('Sexual success', 'ALCOHOL', 'get lucky|sexy|romance|attract', 'flag'),
('Prize incentives', 'ALCOHOL', 'win a prize|contest|competition', 'flag');
