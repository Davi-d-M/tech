-- APEX OS: SEO & DISCOVERABILITY ENGINE
-- Technical infrastructure for search domination.

-- 1. REDIRECT MANAGER
CREATE TABLE IF NOT EXISTS public.seo_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    type INTEGER DEFAULT 301, -- 301, 302
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. SEO AUDITS (Automated Pulse)
CREATE TABLE IF NOT EXISTS public.seo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    score INTEGER NOT NULL, -- 0-100
    details JSONB NOT NULL, -- { broken_links: [], missing_alt: [], ... }
    crawled_urls INTEGER DEFAULT 0
);

-- 3. PRODUCT SEO ENHANCEMENTS
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- 4. RLS POLICIES
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage redirects" ON public.seo_redirects FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins view audits" ON public.seo_audits FOR SELECT TO authenticated USING (true);

-- 5. FUNCTION: Record Audit
CREATE OR REPLACE FUNCTION public.log_seo_audit(
    p_score INTEGER,
    p_details JSONB,
    p_urls INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.seo_audits (score, details, crawled_urls)
    VALUES (p_score, p_details, p_urls);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
