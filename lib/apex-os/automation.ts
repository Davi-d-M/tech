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
