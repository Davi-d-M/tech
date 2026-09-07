-- Migration to allow admin-controlled partner onboarding visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_see_partner_offers BOOLEAN DEFAULT false;
