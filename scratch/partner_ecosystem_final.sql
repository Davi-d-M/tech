-- ==========================================
-- APEX OS: PARTNER ECOSYSTEM MASTER SETUP 🤝📦🏍️
-- ==========================================

-- 1. ENHANCED SUPPLIERS TABLE
-- Added fields for self-onboarding and professional tracking
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS business_registration_no TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS capacity TEXT, -- e.g. "Low", "Medium", "High"
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
ADD COLUMN IF NOT EXISTS mpesa_paybill TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'UnderReview'; -- UnderReview, Verified, Suspended

-- 2. ENHANCED RIDER STATUS TABLE
-- Ensure all performance metrics are present
ALTER TABLE public.rider_status
ADD COLUMN IF NOT EXISTS avg_delivery_speed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_missions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_battery_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS plate_number TEXT,
ADD COLUMN IF NOT EXISTS biometric_key TEXT,
ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';

-- 3. STAFF TABLE (Bridge for Dashboard Access)
-- This table links Supabase Auth users to their roles (Owner, Admin, Supplier, Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff', -- owner, admin, supplier, staff
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    can_view_revenue BOOLEAN DEFAULT false,
    can_manage_inventory BOOLEAN DEFAULT false,
    can_manage_orders BOOLEAN DEFAULT false,
    can_delete_items BOOLEAN DEFAULT false,
    can_manage_blog BOOLEAN DEFAULT false,
    can_manage_affiliates BOOLEAN DEFAULT false,
    can_manage_customer_care BOOLEAN DEFAULT false,
    can_manage_broadcast BOOLEAN DEFAULT false,
    can_manage_settings BOOLEAN DEFAULT false,
    can_manage_media BOOLEAN DEFAULT false,
    pin TEXT, -- For quick terminal login
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owner full access" ON public.staff
FOR ALL USING (
    auth.jwt() ->> 'email' = 'owner@apexstores.com' -- Update this to your master email
);

-- Users can see their own staff record
CREATE POLICY "Staff can view self" ON public.staff
FOR SELECT USING (auth.uid() = id);

-- 4. TACTICAL PERFORMANCE TRIGGER (Rider Speed)
CREATE OR REPLACE FUNCTION calculate_rider_speed()
RETURNS TRIGGER AS $$
DECLARE
    order_speed INTEGER;
    current_avg INTEGER;
    total_count INTEGER;
BEGIN
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' AND NEW.dispatched_at IS NOT NULL AND NEW.delivered_at IS NOT NULL THEN
        -- Calculate minutes for this delivery
        order_speed := EXTRACT(EPOCH FROM (NEW.delivered_at - NEW.dispatched_at)) / 60;

        -- Update rider stats
        SELECT avg_delivery_speed, total_missions_completed
        INTO current_avg, total_count
        FROM public.rider_status
        WHERE rider_phone = NEW.rider_phone;

        IF total_count IS NULL THEN total_count := 0; END IF;
        IF current_avg IS NULL THEN current_avg := 0; END IF;

        -- New Average
        UPDATE public.rider_status
        SET
            avg_delivery_speed = ((current_avg * total_count) + order_speed) / (total_count + 1),
            total_missions_completed = total_count + 1,
            updated_at = NOW()
        WHERE rider_phone = NEW.rider_phone;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_rider_speed ON public.orders;
CREATE TRIGGER trigger_calculate_rider_speed
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION calculate_rider_speed();

-- FORCE RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
