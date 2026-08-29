-- APEX OS: ENHANCED PROFIT AUTOMATION
-- Dynamically extracts item-level costs into the ledger.

CREATE OR REPLACE FUNCTION public.calculate_contribution_profit_v2()
RETURNS trigger AS $$
DECLARE
    total_item_cost NUMERIC;
BEGIN
    IF NEW.status = 'Paid' AND OLD.status != 'Paid' THEN
        -- 1. Calculate Total Inventory Cost for this Order
        SELECT SUM(unit_cost * quantity) INTO total_item_cost
        FROM public.order_items
        WHERE order_id = NEW.id;

        -- 2. Create Revenue Entry
        INSERT INTO public.financial_ledger (order_id, entry_type, amount, description)
        VALUES (NEW.id, 'REVENUE', NEW.total_price, 'Customer Payment (Gross)');

        -- 3. Create Inventory Cost Entry (Negative)
        INSERT INTO public.financial_ledger (order_id, entry_type, amount, description)
        VALUES (NEW.id, 'SUPPLIER_PAYABLE', -COALESCE(total_item_cost, 0), 'Total Payload Cost');

        -- 4. Create Payment Fee Entry (3% Estimate)
        INSERT INTO public.financial_ledger (order_id, entry_type, amount, description)
        VALUES (NEW.id, 'PAYMENT_FEE', -(NEW.total_price * 0.03), 'Gateway Processing Fee');

        -- 5. Create Delivery Cost Entry
        INSERT INTO public.financial_ledger (order_id, entry_type, amount, description)
        VALUES (NEW.id, 'DELIVERY_FEE', -COALESCE(NEW.delivery_cost, 0), 'Rider Logistics Allocation');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace old trigger
DROP TRIGGER IF EXISTS tr_contribution_profit ON public.orders;
CREATE TRIGGER tr_contribution_profit
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.calculate_contribution_profit_v2();
