-- ==========================================
-- APEX OS: OVERCLOCK INDEXING ⚡🚀
-- ==========================================

-- 1. ORDER DASHBOARD SPEED
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_rider_phone ON public.orders(rider_phone);

-- 2. PRODUCT CATALOG SPEED
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 3. RIDER ONBOARDING & GRID SPEED
CREATE INDEX IF NOT EXISTS idx_rider_status_phone ON public.rider_status(rider_phone);
CREATE INDEX IF NOT EXISTS idx_rider_status_verification ON public.rider_status(verification_status);

-- 4. ORDER ITEMS LOOKUP
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- FORCE RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
