import { supabase } from './supabaseClient';

/**
 * Tactical Achievement Engine
 * Automatically unlocks rewards based on user behavior
 */
export async function unlockAchievement(userId: string, key: string) {
    if (!supabase || !userId) return;

    try {
        // Check if already unlocked
        const { data: existing } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)
            .eq('achievement_key', key)
            .maybeSingle();

        if (existing) return; // Already achieved

        // Unlock
        const { error } = await supabase
            .from('user_achievements')
            .insert([{
                user_id: userId,
                achievement_key: key,
                unlocked_at: new Date().toISOString()
            }]);

        if (error) throw error;

        // 🏆 Intelligence Node: Emit Global Notification Event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('apex-achievement-unlocked', {
                detail: { key, userId }
            }));
        }

        console.log(`Achievement Unlocked: ${key} for ${userId} 🏅`);
        return true;
    } catch (err) {
        console.error("Achievement Unlock Failure:", err);
        return false;
    }
}

/**
 * Post-Checkout Reliability Check
 * Scans user history to grant badges
 */
export async function runPostCheckoutAudit(userId: string, orderTotal: number) {
    if (!supabase || !userId) return;

    try {
        // 1. First Purchase
        await unlockAchievement(userId, 'first-purchase');

        // 2. VIP Shopper (Spent over 50k)
        if (orderTotal >= 50000) {
            await unlockAchievement(userId, 'vip-shopper');
        }

        // 3. Gadget Hunter (Own 5+ unique products)
        // We'll fetch orders by user_id or linked phone
        const { data: profile } = await supabase.from('profiles').select('phone_number').eq('id', userId).single();
        if (profile?.phone_number) {
            const { count: gadgetCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('customer_phone', profile.phone_number)
                .eq('status', 'Delivered');

            if (gadgetCount && gadgetCount >= 5) {
                await unlockAchievement(userId, 'gadget-hunter');
            }
        }
    } catch (err) {
        console.warn("Post-checkout audit interrupted:", err);
    }
}
