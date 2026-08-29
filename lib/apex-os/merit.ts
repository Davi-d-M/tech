import { supabase } from "@/lib/supabaseClient";

/**
 * Apex OS: Merit & Performance Node
 * Automatically synchronizes rider ratings and mission counts.
 */
export async function syncRiderMerit(riderPhone: string) {
    if (!supabase || !riderPhone) return;

    try {
        // 1. Fetch all delivered missions for this rider
        const { data: missions, error } = await supabase
            .from('orders')
            .select('rider_rating, dispatched_at, delivered_at')
            .eq('rider_phone', riderPhone)
            .eq('status', 'Delivered');

        if (error || !missions || missions.length === 0) return;

        // 2. Calculate Average Rating
        const ratedMissions = missions.filter(m => m.rider_rating);
        const avgRating = ratedMissions.length > 0
            ? ratedMissions.reduce((s, m) => s + (m.rider_rating || 0), 0) / ratedMissions.length
            : 5.0;

        // 3. Calculate Average Speed (in minutes)
        const speedMissions = missions.filter(m => m.dispatched_at && m.delivered_at);
        const avgSpeed = speedMissions.length > 0
            ? speedMissions.reduce((s, m) => {
                const start = new Date(m.dispatched_at!).getTime();
                const end = new Date(m.delivered_at!).getTime();
                return s + (end - start) / (1000 * 60);
              }, 0) / speedMissions.length
            : 12;

        // 4. Update Rider Status
        await supabase
            .from('rider_status')
            .update({
                rating: parseFloat(avgRating.toFixed(1)),
                avg_delivery_speed: Math.round(avgSpeed),
                total_deliveries: missions.length,
                updated_at: new Date().toISOString()
            })
            .eq('rider_phone', riderPhone);

        console.log(`[MERIT] Unit ${riderPhone} performance synced: Rating ${avgRating.toFixed(1)}, Speed ${Math.round(avgSpeed)}m`);

    } catch (err) {
        console.error("Merit Sync Failure:", err);
    }
}
