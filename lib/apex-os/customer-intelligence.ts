import { supabase } from "@/lib/supabaseClient";

/**
 * Apex OS: Customer Intelligence Node
 * Calculates predictive scores (Propensity, Churn, CLV) based on behavioral signals and order history.
 */
export async function refreshCustomerIntelligence(userId: string) {
    if (!supabase) return null;

    try {
        // 1. Fetch historical data
        const [ordersRes, signalsRes] = await Promise.all([
            supabase.from('orders').select('total_price, status, created_at').eq('user_id', userId),
            supabase.from('user_signals').select('event_type, created_at').eq('user_id', userId)
        ]);

        const orders = ordersRes.data || [];
        const signals = signalsRes.data || [];

        // --- A. PURCHASE PROPENSITY (0-100) ---
        // Logic: High frequency of views + Add to Bag - Recent Purchase = High Propensity
        const recentViews = signals.filter(s => (s.event_type === 'VIEW' || s.event_type === 'PRODUCT_VIEW') &&
            new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        const recentAdds = signals.filter(s => s.event_type === 'ADD_TO_BAG' &&
            new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

        let propensity = Math.min(100, (recentViews * 5) + (recentAdds * 20));

        // Deduct if they just purchased
        const lastOrder = orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (lastOrder && new Date(lastOrder.created_at) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
            propensity = Math.max(10, propensity - 50);
        }

        // --- B. CHURN RISK (0-100) ---
        // Logic: Days since last purchase vs historical average
        let churnRisk = 15; // Base risk
        if (lastOrder) {
            const daysSinceLast = (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLast > 30) churnRisk += 20;
            if (daysSinceLast > 60) churnRisk += 40;
        } else {
            churnRisk = 50; // New users have higher churn risk until first purchase
        }

        // --- C. PREDICTED CLV ---
        // Logic: (Average Order Value * Frequency) * Margin
        const delivered = orders.filter(o => o.status === 'Delivered');
        const totalRevenue = delivered.reduce((s, o) => s + (o.total_price || 0), 0);
        const aov = delivered.length > 0 ? totalRevenue / delivered.length : 0;
        const predictedCLV = totalRevenue + (aov * 2.5); // Simple projection

        // 2. Update Profile
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
                purchase_propensity: Math.round(propensity),
                churn_risk: Math.round(churnRisk),
                predicted_clv: Math.round(predictedCLV),
                last_streak_update: new Date().toISOString() // Using this as a "last intelligent sync" marker
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return updatedProfile;

    } catch (err) {
        console.error("Customer Intelligence Calculation Failure:", err);
        return null;
    }
}
