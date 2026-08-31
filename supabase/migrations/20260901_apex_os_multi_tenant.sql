-- APEX OS: MULTI-TENANT & PROVISIONING FOUNDATION
-- Transform the system into a SaaS Business Operating System.

-- 1. TENANTS (Organizations)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'Starter', -- Starter, Pro, Enterprise
    status TEXT DEFAULT 'Active', -- Active, Suspended, Provisioning
    owner_id UUID REFERENCES auth.users(id),
    settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ONBOARDING APPLICATIONS
CREATE TABLE IF NOT EXISTS public.onboarding_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    business_type TEXT,
    employee_count INTEGER,
    branch_count INTEGER,
    monthly_orders TEXT,
    current_system TEXT,
    risk_score INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'Pending', -- Pending, Verified, Rejected, Approved
    documents JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVITATIONS (Magic Links)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL, -- RIDER, STAFF, MANAGER, SUPPLIER
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Unused', -- Unused, Claimed, Expired, Revoked
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEVICE REGISTRY (Titan Device Management)
CREATE TABLE IF NOT EXISTS public.device_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_id TEXT UNIQUE NOT NULL, -- Hardware ID (e.g., ANDROID_ID)
    model TEXT,
    os_version TEXT,
    battery_level INTEGER,
    last_gps JSONB,
    status TEXT DEFAULT 'Active', -- Active, Locked, Revoked
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPLY TENANT_ID TO CORE TABLES
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.inventory_units ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.rider_status ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.admin_vault ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Create a "Default Tenant" for existing data migration
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    INSERT INTO public.tenants (name, slug, plan)
    VALUES ('Apex Master', 'apex-master', 'Enterprise')
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'apex-master';

    UPDATE public.orders SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.products SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.inventory_units SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.suppliers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.staff SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.rider_status SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.audit_logs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.admin_tasks SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.admin_vault SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- 6. MULTI-TENANT RLS POLICIES
-- We use a custom claim in the JWT for tenant_id (provisioned via auth hook or app logic)

-- Generic Function to get current tenant_id from JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
    SELECT (auth.jwt() ->> 'tenant_id')::UUID;
$$ LANGUAGE sql STABLE;

-- Update Policies for Core Tables
-- ORDERS
DROP POLICY IF EXISTS "Admins see all orders" ON public.orders;
CREATE POLICY "Tenant Isolation: Orders" ON public.orders
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() OR (auth.jwt() ->> 'role' = 'superadmin'));

-- PRODUCTS
DROP POLICY IF EXISTS "Admins have full access" ON public.products;
CREATE POLICY "Tenant Isolation: Products" ON public.products
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() OR (auth.jwt() ->> 'role' = 'superadmin'));

-- STAFF
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation: Staff" ON public.staff;
CREATE POLICY "Tenant Isolation: Staff" ON public.staff
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() OR (auth.jwt() ->> 'role' = 'superadmin'));

-- RIDER STATUS
ALTER TABLE public.rider_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation: Riders" ON public.rider_status;
CREATE POLICY "Tenant Isolation: Riders" ON public.rider_status
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() OR (auth.jwt() ->> 'role' = 'superadmin'));

-- 7. PROVISIONING RPCs
CREATE OR REPLACE FUNCTION public.provision_tenant(app_id UUID)
RETURNS UUID AS $$
DECLARE
    app_record RECORD;
    new_tenant_id UUID;
    slug_val TEXT;
BEGIN
    SELECT * INTO app_record FROM public.onboarding_applications WHERE id = app_id;

    IF app_record.verification_status != 'Approved' THEN
        RAISE EXCEPTION 'Application must be Approved before provisioning.';
    END IF;

    slug_val := lower(regexp_replace(app_record.business_name, '[^a-zA-Z0-9]+', '-', 'g'));

    INSERT INTO public.tenants (name, slug, settings)
    VALUES (app_record.business_name, slug_val, jsonb_build_object('application_id', app_id))
    RETURNING id INTO new_tenant_id;

    UPDATE public.onboarding_applications
    SET verification_status = 'Approved', updated_at = NOW()
    WHERE id = app_id;

    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
