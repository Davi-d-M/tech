-- APEX OS: CRM INTELLIGENCE SYNC
-- Automatically updates customer LTV and segmentation on order completion.

CREATE OR REPLACE FUNCTION public.sync_customer_crm_stats()
RETURNS trigger AS $$
DECLARE
    cust_id UUID;
    v_total_spend NUMERIC;
    v_order_count INTEGER;
    v_segment TEXT;
    v_days_since_last INTEGER;
BEGIN
    -- 1. Identify Customer (Profile Link)
    SELECT user_id INTO cust_id FROM public.orders WHERE id = NEW.id;

    IF cust_id IS NOT NULL AND NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
        -- 2. Recalculate Stats
        SELECT SUM(total_price), COUNT(id)
        INTO v_total_spend, v_order_count
        FROM public.orders
        WHERE user_id = cust_id AND status = 'Delivered';

        -- 3. Determine Segment
        IF v_total_spend >= 100000 OR v_order_count >= 10 THEN v_segment := 'VIP Elite';
        ELSIF v_total_spend >= 50000 THEN v_segment := 'High Value';
        ELSE v_segment := 'Repeat Buyer';
        END IF;

        -- 4. Update Profile
        UPDATE public.profiles
        SET
            lifetime_value = v_total_spend,
            total_orders = v_order_count,
            segment = v_segment,
            last_purchase_at = NOW()
        WHERE id = cust_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_customer_crm ON public.orders;
CREATE TRIGGER tr_sync_customer_crm
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.sync_customer_crm_stats();
