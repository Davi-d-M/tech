-- TechPax Rider Evolution Migration
-- Adds support for Wallets, Quests, and Enhanced Status

-- 1. Enhanced Rider Status
ALTER TABLE IF EXISTS public.rider_status
ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'Bronze',
ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS acceptance_rate INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS biometric_key JSONB,
ADD COLUMN IF NOT EXISTS online_since TIMESTAMPTZ;

-- 2. Rider Wallets
CREATE TABLE IF NOT EXISTS public.rider_wallets (
    rider_phone TEXT PRIMARY KEY REFERENCES public.rider_status(rider_phone) ON DELETE CASCADE,
    balance DECIMAL DEFAULT 0,
    total_earned DECIMAL DEFAULT 0,
    last_payout TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rider Quests
CREATE TABLE IF NOT EXISTS public.rider_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    reward DECIMAL NOT NULL,
    target_count INTEGER NOT NULL,
    current_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS (Row Level Security) - Basic setup
ALTER TABLE public.rider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders can view own wallet" ON public.rider_wallets
    FOR SELECT USING (auth.uid()::text = rider_phone);

CREATE POLICY "Everyone can view active quests" ON public.rider_quests
    FOR SELECT USING (expires_at > NOW() OR expires_at IS NULL);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rider_wallets_updated_at
    BEFORE UPDATE ON public.rider_wallets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
