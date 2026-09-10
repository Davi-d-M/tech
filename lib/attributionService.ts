import { supabase } from "./supabaseClient";

/**
 * Apex OS: Attribution Intelligence
 * Links finalized orders to their social/affiliate origins.
 */
export async function logOrderAttribution(orderId: number, totalRevenue: number) {
    if (!supabase) return;

    try {
        const utmsString = sessionStorage.getItem('apex_utms');
        const sessionId = sessionStorage.getItem('apex_signal_session');
        const affiliateIdCookie = document.cookie.match(/apex_affiliate_id=([^;]+)/)?.[1];

        const utms = utmsString ? JSON.parse(utmsString) : {};
        const affiliateId = affiliateIdCookie || utms.ref;

        // 1. Fetch Affiliate Profile for UUID link
        let affiliateUuid = null;
        if (affiliateId) {
            const { data } = await supabase
                .from('affiliate_profiles')
                .select('user_id')
                .eq('promo_name', affiliateId.toLowerCase())
                .maybeSingle();

            affiliateUuid = data?.user_id;
        }

        // 2. Log Attribution Payload
        const { error } = await supabase.rpc('log_order_attribution', {
            p_order_id: orderId,
            p_affiliate_id: affiliateUuid,
            p_session_id: sessionId,
            p_source: utms.utm_source || 'direct',
            p_campaign: utms.utm_campaign || null,
            p_medium: utms.utm_medium || null,
            p_content: utms.utm_content || null,
            p_revenue: totalRevenue,
            p_commission: affiliateUuid ? Math.floor(totalRevenue * 0.1) : 0 // 10% Standard
        });

        if (error) throw error;

        console.log(`[ATTRIBUTION] Successfully linked Order #${orderId} to ${utms.utm_source || 'direct'}`);
    } catch (err) {
        console.warn("[ATTRIBUTION] Data link failed:", err);
    }
}
