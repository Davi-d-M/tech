import { supabase } from "@/lib/supabaseClient";

/**
 * Apex OS: Operational Singularity
 * Automates the flow from Payment to Dispatch.
 */
export async function runSingularityAutomation() {
    if (!supabase) return;

    try {
        // 1. Fetch Paid Orders awaiting dispatch
        const { data: paidOrders } = await supabase
            .from('orders')
            .select('id, customer_name, customer_phone')
            .eq('status', 'Paid');

        if (!paidOrders || paidOrders.length === 0) return;

        // 2. Fetch Idle Riders
        const { data: idleRiders } = await supabase
            .from('rider_status')
            .select('*')
            .eq('status', 'Idle')
            .eq('verification_status', 'Verified');

        if (!idleRiders || idleRiders.length === 0) {
            console.warn("[SINGULARITY] Paid orders detected but no idle riders available.");
            return;
        }

        for (const order of paidOrders) {
            // Smart Match: Highest Health Score first
            const bestRider = idleRiders.sort((a, b) => (b.health_score || 0) - (a.health_score || 0))[0];

            if (bestRider) {
                console.log(`[SINGULARITY] Auto-Dispatching Order #${order.id} to Unit ${bestRider.rider_name}`);

                // Assign and Dispatch
                const { error } = await supabase
                    .from('orders')
                    .update({
                        rider_name: bestRider.rider_name,
                        rider_phone: bestRider.rider_phone,
                        status: 'Dispatched',
                        dispatched_at: new Date().toISOString()
                    })
                    .eq('id', order.id);

                if (!error) {
                    // Mark rider as delivering
                    await supabase
                        .from('rider_status')
                        .update({ status: 'Delivering' })
                        .eq('rider_phone', bestRider.rider_phone);

                    // Optional: Trigger WhatsApp Notification via Social API Node
                    // (Implementation depends on WhatsApp API setup)
                }

                // Remove rider from idle list for next iteration
                idleRiders.shift();
            }
        }

    } catch (err) {
        console.error("Singularity Automation Failure:", err);
    }
}

/**
 * Apex OS: Revenue Leakage Detection
 * Scans for abandoned high-value carts and alerts the admin.
 */
export async function runRevenueRecoverySync() {
    if (!supabase) return;

    try {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        // 1. Identify idle high-value visitors
        const { data: leaks } = await supabase
            .from('active_visitors')
            .select('*')
            .gt('cart_value', 4999) // High value target
            .lt('last_active_at', thirtyMinsAgo);

        if (!leaks || leaks.length === 0) return;

        for (const visitor of leaks) {
            // Check if we already flagged this session
            const { data: existing } = await supabase
                .from('system_signals')
                .select('id')
                .eq('meta', `Session ${visitor.session_id} remains idle.`)
                .maybeSingle();

            if (!existing) {
                await supabase.from('system_signals').insert([{
                    type: 'critical',
                    label: 'Revenue Leakage Detected',
                    meta: `Session ${visitor.session_id} remains idle. Value: KES ${visitor.cart_value}. Engage Nudge Protocol.`,
                    url: '/admin/marketing/abandoned'
                }]);
            }
        }
    } catch (err) {
        console.error("Leakage Sync Failure:", err);
    }
}

/**
 * Apex OS: Agentic Procurement (Self-Healing Loop)
 * Autonomously identifies replenishment targets based on ROI and Stock.
 */
export async function runAgenticProcurementSync() {
    if (!supabase) return;

    try {
        // 1. Fetch products with high-ROI potential and low stock
        // Note: For this to work, ad_campaigns should be linked to products
        const { data: ads } = await supabase.from('ad_campaigns').select('product_name, roas').gt('roas', 3.0);

        if (!ads || ads.length === 0) return;

        const { data: products } = await supabase.from('products').select('id, name, stock').lte('stock', 3);

        if (!products || products.length === 0) return;

        for (const product of products) {
            const highPerformingAd = ads.find(a => a.product_name.toLowerCase().includes(product.name.toLowerCase()));

            if (highPerformingAd) {
                // Check if a signal already exists for this procurement
                const { data: existing } = await supabase
                    .from('system_signals')
                    .select('id')
                    .eq('label', `Agentic PO: ${product.name}`)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('system_signals').insert([{
                        type: 'warning',
                        label: `Agentic PO: ${product.name}`,
                        meta: `High-ROI item (${highPerformingAd.roas}x ROAS) is depleting. Automated WhatsApp PO draft ready for supplier.`,
                        url: '/admin/operations/suppliers'
                    }]);
                }
            }
        }

    } catch (err) {
        console.error("Agentic Procurement Failure:", err);
    }
}
