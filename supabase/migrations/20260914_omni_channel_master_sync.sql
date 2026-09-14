-- APEX OS: MASTER OMNI-CHANNEL SYNC
-- Consolidates all social infrastructure, content management, and job queuing.

-- 1. SOCIAL ACCOUNTS (Connected Nodes)
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'youtube', 'x', 'whatsapp'
    account_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    access_token_encrypted TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'connected', -- 'connected', 'expired', 'error'
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(platform, account_id)
);

-- 2. CONTENT LIBRARY (Master Repository)
CREATE TABLE IF NOT EXISTS public.content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL, -- 'product_story', 'brand_video', 'educational', 'announcement'
    master_media_url TEXT,
    media_assets TEXT[] DEFAULT ARRAY[]::TEXT[],
    product_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved', 'archived'
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PUBLISHING JOBS (The Queue)
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.content_library(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'published', 'failed', 'scheduled'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER DEFAULT 0,
    last_error TEXT,
    external_post_id TEXT,
    platform_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. SOCIAL POSTS (Live Result Tracking)
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    external_post_id TEXT,
    content TEXT,
    media_url TEXT,
    campaign_id TEXT,
    status TEXT DEFAULT 'published',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metrics JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0, "clicks": 0}'::JSONB
);

-- 5. JOB ATTEMPTS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.publishing_job_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    error_message TEXT,
    attempt_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. COMPLIANCE RULES & LOGS
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ALCOHOL', 'MINORS', 'MISLEADING'
    pattern TEXT NOT NULL,
    action TEXT DEFAULT 'flag',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.content_library(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.compliance_rules(id),
    status TEXT NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. RLS POLICIES (Idempotent)
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Clean Up Old Policies
DROP POLICY IF EXISTS "Admins manage social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Admins manage content library" ON public.content_library;
DROP POLICY IF EXISTS "Admins manage publishing jobs" ON public.publishing_jobs;
DROP POLICY IF EXISTS "Admins manage social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Admins manage compliance rules" ON public.compliance_rules;

-- Create New Policies
CREATE POLICY "Admins manage social accounts" ON public.social_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage content library" ON public.content_library FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage publishing jobs" ON public.publishing_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage social posts" ON public.social_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins manage compliance rules" ON public.compliance_rules FOR ALL TO authenticated USING (true);

-- 8. INITIAL DATA SEED
INSERT INTO public.compliance_rules (name, category, pattern, action) VALUES
('Direct consumption encouragement', 'ALCOHOL', 'drink more|non-stop|bottoms up', 'flag'),
('Minors target', 'MINORS', 'kids|school|under 18|youth', 'block'),
('Therapeutic claims', 'ALCOHOL', 'healthy|cure|medicine|fitness', 'block'),
('Sexual success', 'ALCOHOL', 'get lucky|sexy|romance|attract', 'flag'),
('Prize incentives', 'ALCOHOL', 'win a prize|contest|competition', 'flag')
ON CONFLICT DO NOTHING;
