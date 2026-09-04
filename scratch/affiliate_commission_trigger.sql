-- Trigger to calculate affiliate commission when an order is delivered
CREATE OR REPLACE FUNCTION public.on_order_delivered_affiliate()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
        -- Call the calculation RPC
        PERFORM public.calculate_affiliate_commission(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_affiliate_commission ON public.orders;
CREATE TRIGGER tr_affiliate_commission
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.on_order_delivered_affiliate();
