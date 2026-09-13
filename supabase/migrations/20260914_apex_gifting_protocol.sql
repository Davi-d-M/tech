-- APEX OS: GIFTING PROTOCOL
-- Adds metadata for premium wrapping and personal messages.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_message TEXT,
ADD COLUMN IF NOT EXISTS gift_wrapping_type TEXT, -- 'Standard', 'Premium', 'Elite'
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Update ledger automation to include wrapping fees if necessary
-- For now, we'll handle the fee as part of the total_price from the frontend.
