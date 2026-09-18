-- APEX OS: DEVICE INTELLIGENCE & SHIELD TELEMETRY 🛰️🛡️
-- Stores detailed hardware and security profiles for audit and fraud prevention.

CREATE TABLE IF NOT EXISTS public.device_intelligence_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,

    -- Hardware Snapshot
    hardware JSONB NOT NULL, -- {model, manufacturer, total_ram_gb, available_ram_gb, total_storage_gb, ...}

    -- Software Environment
    software JSONB NOT NULL, -- {os_version, api_level, security_patch, language}

    -- Security & Shield Status
    security JSONB NOT NULL, -- {is_rooted, developer_options, mock_location, adb_enabled}

    -- Network Context
    network JSONB NOT NULL, -- {type, vpn_active}

    collected_at TIMESTAMPTZ DEFAULT NOW(),

    -- Enable indexing for fraud analysis
    UNIQUE(device_id, collected_at)
);

-- RLS: Only admins can view profiles
ALTER TABLE public.device_intelligence_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view intelligence" ON public.device_intelligence_profiles
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid())
);

-- Devices can insert their own profiles (Anon/Public for initial provisioning)
CREATE POLICY "Public profile submission" ON public.device_intelligence_profiles
FOR INSERT WITH CHECK (true);
