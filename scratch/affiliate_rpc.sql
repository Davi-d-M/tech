-- RPC to increment affiliate clicks safely
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(code_input TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.affiliate_profiles
    SET total_clicks = total_clicks + 1
    WHERE user_id IN (
        SELECT id FROM public.profiles WHERE referral_code = code_input
    );

    -- Also increment the base profile clicks for consistency
    UPDATE public.profiles
    SET referral_clicks = referral_clicks + 1
    WHERE referral_code = code_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
