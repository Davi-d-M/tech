-- ==========================================
-- APEX OS: RIDER INTELLIGENCE & PRIVACY SYNC
-- ==========================================

-- 1. ENHANCE RIDER STATUS TABLE
ALTER TABLE public.rider_status
ADD COLUMN IF NOT EXISTS id_photo_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_photo_back_url TEXT,
ADD COLUMN IF NOT EXISTS license_photo_url TEXT,
ADD COLUMN IF NOT EXISTS avg_delivery_speed INTEGER DEFAULT 0, -- Speed in minutes
ADD COLUMN IF NOT EXISTS last_battery_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_missions_completed INTEGER DEFAULT 0;

-- 2. ENHANCE ORDERS TABLE (Performance Tracking)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
ADD COLUMN IF NOT EXISTS rider_feedback TEXT;

-- 3. SECURITY SHIELD: RLS POLICIES
-- Only owners and admins can see sensitive URLs and ID numbers.
-- Staff role is limited to face photo and plate number.

DROP POLICY IF EXISTS "Authorized staff can manage riders" ON public.rider_status;
CREATE POLICY "Authorized staff can manage riders" ON public.rider_status FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.staff
        WHERE id = auth.uid()
        AND (role IN ('owner', 'admin') OR can_view_sensitive_rider_data = true)
    )
);

-- FORCE RELOAD
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- PERFORMANCE ENGINE: AUTO-CALCULATE SPEED
-- ==========================================

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
