-- Apex OS: Master Schema & Tactical Repair Script v2
-- RUN THIS IN SUPABASE SQL EDITOR TO ENSURE ALL COLUMNS ARE PRESENT

-- 1. HARDEN AUDIT LOGS
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS device_info TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. HARDEN RIDER STATUS (Ensuring sync for mobile nodes)
ALTER TABLE public.rider_status
ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_battery_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS biometric_key TEXT,
ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'Bronze',
ADD COLUMN IF NOT EXISTS acceptance_rate NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS avg_delivery_speed NUMERIC DEFAULT 12;

-- 3. HARDEN SETTINGS (For Social API Node)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. REFRESH SCHEMA CACHE (PostgREST)
-- Run this if the "column not found" error persists after applying the above.
NOTIFY pgrst, 'reload schema';
