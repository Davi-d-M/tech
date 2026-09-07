-- APEX STORES: FIX AFFILIATE POLICIES (IDEMPOTENT SCRIPT)

-- 1. affiliate_profiles
DROP POLICY IF EXISTS "Users see own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users see own affiliate profile" ON public.affiliate_profiles FOR SELECT USING (auth.uid() = user_id);

-- 2. affiliate_wallets
DROP POLICY IF EXISTS "Users see own wallet" ON public.affiliate_wallets;
CREATE POLICY "Users see own wallet" ON public.affiliate_wallets FOR SELECT USING (auth.uid() = user_id);

-- 3. affiliate_withdrawals
DROP POLICY IF EXISTS "Users manage own withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Users manage own withdrawals" ON public.affiliate_withdrawals FOR ALL USING (auth.uid() = user_id);

-- 4. affiliate_leads
DROP POLICY IF EXISTS "Affiliates see own leads" ON public.affiliate_leads;
CREATE POLICY "Affiliates see own leads" ON public.affiliate_leads FOR SELECT USING (auth.uid() = affiliate_id);

DROP POLICY IF EXISTS "Affiliates create leads" ON public.affiliate_leads;
CREATE POLICY "Affiliates create leads" ON public.affiliate_leads FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

-- 5. affiliate_assets
DROP POLICY IF EXISTS "Public see affiliate assets" ON public.affiliate_assets;
CREATE POLICY "Public see affiliate assets" ON public.affiliate_assets FOR SELECT USING (true);

-- 6. affiliate_announcements
DROP POLICY IF EXISTS "Public see affiliate announcements" ON public.affiliate_announcements;
CREATE POLICY "Public see affiliate announcements" ON public.affiliate_announcements FOR SELECT USING (true);
