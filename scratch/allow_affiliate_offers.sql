-- Migration to allow admin-controlled affiliate dashboard visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_see_affiliate_offers BOOLEAN DEFAULT false;
