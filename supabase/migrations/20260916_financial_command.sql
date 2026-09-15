-- APEX OS: FINANCIAL COMMAND OS
-- Automated reconciliation, unified payouts, and margin integrity.

-- 1. MERCHANT WALLETS (For Supply Partners)
CREATE TABLE IF NOT EXISTS public.merchant_wallets (
    supplier_id BIGINT PRIMARY KEY REFERENCES public.suppliers(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    total_earned NUMERIC DEFAULT 0,
    pending_clearance NUMERIC DEFAULT 0,
    last_payout_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. CENTRALIZED PAYOUT QUEUE (Rider, Merchant, Affiliate)
CREATE TYPE payout_recipient_role AS ENUM ('RIDER', 'MERCHANT', 'AFFILIATE');

CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    recipient_id TEXT NOT NULL, -- ID or Phone
    recipient_name TEXT, -- Cached name for HUD performance
    recipient_role payout_recipient_role NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Paid, Rejected
    payment_method TEXT DEFAULT 'M-Pesa',
    payment_details TEXT,
    authorized_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FINANCIAL RECONCILIATION LOGIC (RPC)
-- Matches a Transaction ID from payment_logs to an Order ID.
CREATE OR REPLACE FUNCTION public.reconcile_transaction(
    p_log_id UUID,
    p_order_id BIGINT,
    p_staff_email TEXT
)
RETURNS VOID AS $$
DECLARE
    v_amount NUMERIC;
    v_ref TEXT;
BEGIN
    -- 1. Fetch Log Data
    SELECT amount, reference INTO v_amount, v_ref FROM public.payment_logs WHERE id = p_log_id;

    -- 2. Link Log to Order
    UPDATE public.payment_logs
    SET order_id = p_order_id, reconciled_at = NOW()
    WHERE id = p_log_id;

    -- 3. Transition Order State to Paid
    PERFORM public.transition_order_state(
        p_order_id,
        'Paid',
        'Reconciled via Admin: ' || v_ref,
        p_staff_email
    );

    -- 4. Log Audit Trail
    INSERT INTO public.audit_logs (staff_email, action, details)
    VALUES (p_staff_email, 'FINANCE_RECONCILE', jsonb_build_object('order_id', p_order_id, 'ref', v_ref, 'amount', v_amount));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AUTO-PROVISION MERCHANT WALLETS
CREATE OR REPLACE FUNCTION public.handle_new_supplier_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.merchant_wallets (supplier_id)
  VALUES (new.id)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_supplier_created
  AFTER INSERT ON public.suppliers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_supplier_wallet();

-- 5. RLS POLICIES
ALTER TABLE public.merchant_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all wallets" ON public.merchant_wallets
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance')));

CREATE POLICY "Admins manage payout queue" ON public.payout_requests
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance')));
