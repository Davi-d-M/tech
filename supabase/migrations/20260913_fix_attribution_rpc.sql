-- FIX: Order Attribution RPC for Multi-Touch
-- Ensures the backend matches the new intelligent tracking payload.

DROP FUNCTION IF EXISTS public.log_order_attribution;

CREATE OR REPLACE FUNCTION public.log_order_attribution(
    p_order_id BIGINT,
    p_affiliate_id UUID,
    p_session_id TEXT,
    p_first_touch_source TEXT,
    p_first_touch_campaign TEXT,
    p_last_touch_source TEXT,
    p_last_touch_campaign TEXT,
    p_medium TEXT,
    p_content TEXT,
    p_revenue NUMERIC,
    p_commission NUMERIC
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.order_attribution (
        order_id, affiliate_id, session_id,
        first_touch_source, first_touch_campaign,
        last_touch_source, last_touch_campaign,
        utm_medium, utm_content, revenue, commission_earned
    ) VALUES (
        p_order_id, p_affiliate_id, p_session_id,
        p_first_touch_source, p_first_touch_campaign,
        p_last_touch_source, p_last_touch_campaign,
        p_medium, p_content, p_revenue, p_commission
    ) ON CONFLICT (order_id) DO UPDATE SET
        affiliate_id = EXCLUDED.affiliate_id,
        last_touch_source = EXCLUDED.last_touch_source,
        last_touch_campaign = EXCLUDED.last_touch_campaign,
        commission_earned = EXCLUDED.commission_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
