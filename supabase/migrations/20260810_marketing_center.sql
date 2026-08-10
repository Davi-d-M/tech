-- Apex Marketing Command Center Migration

-- 1. Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Product Launch', 'Sale', 'Restock', 'Flash Sale'
    product_id BIGINT REFERENCES public.products(id),
    status TEXT DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Publishing', 'Published', 'Archived'
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Admin email
);

-- 2. Campaign Channels
CREATE TABLE IF NOT EXISTS public.campaign_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'Instagram', 'Facebook', 'WhatsApp', 'Email'
    status TEXT DEFAULT 'Ready', -- 'Ready', 'Sent', 'Failed'
    content JSONB, -- Stores per-channel copy and images
    external_id TEXT, -- Post ID or Message ID
    error_message TEXT,
    published_at TIMESTAMPTZ
);

-- 3. Customer Segments
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rules JSONB NOT NULL, -- Filters for spend, last active, etc.
    estimated_reach INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- 5. Basic Policies (Admin Only)
CREATE POLICY "Admins can manage marketing" ON public.marketing_campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage channels" ON public.campaign_channels
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage segments" ON public.customer_segments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
