-- Apex Enterprise OS Stability Migration

-- 1. Admin Tasks (Kanban)
CREATE TABLE IF NOT EXISTS public.admin_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Todo', -- 'Todo', 'InProgress', 'Review', 'Done'
    priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Admin email
);

-- 2. Marketing Experiments (A/B Testing)
CREATE TABLE IF NOT EXISTS public.marketing_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Running', -- 'Running', 'Paused', 'Ended'
    variant_a JSONB NOT NULL, -- { name, orders, ctr }
    variant_b JSONB NOT NULL, -- { name, orders, ctr }
    winning_variant TEXT, -- 'A' or 'B'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Security Audit (Login Attempts)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    success BOOLEAN DEFAULT FALSE,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Browser/Device info
);

-- 4. Document Vault
CREATE TABLE IF NOT EXISTS public.admin_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Invoice', 'Receipt', 'Report', 'Contract'
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    authorized_by TEXT -- Department or Admin
);

-- 5. Sync RLS Policies
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tasks" ON public.admin_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage experiments" ON public.marketing_experiments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view logs" ON public.login_attempts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Admins can manage vault" ON public.admin_vault
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
