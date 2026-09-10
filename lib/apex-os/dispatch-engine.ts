import { supabase } from "@/lib/supabaseClient";

export interface DispatchScore {
    rider_phone: string;
    rider_name: string;
    score: number; // 0-100 (Higher is better)
    factors: {
        distance: number;
        eta: number;
        workload: number;
        reliability: number;
        vehicle_match: number;
    };
}

/**
 * Apex OS: Tactical Dispatch Scoring Engine
 * Determines the most efficient "Extraction Unit" for a mission.
 */
export async function calculateDispatchScores(
    orderLat: number,
    orderLng: number,
    warehouseLat?: number,
    warehouseLng?: number
): Promise<DispatchScore[]> {
    if (!supabase) return [];

    try {
        // 1. Fetch Online Riders
        const { data: riders } = await supabase
            .from('rider_status')
            .select('rider_name, rider_phone, status, lat, lng, vehicle_type, reliability_score')
            .neq('status', 'Offline');

        if (!riders || riders.length === 0) return [];

        // 2. Score Each Unit
        const scoredRiders: DispatchScore[] = riders.map(rider => {
            // A. Proximity Score (Base distance to Pickup)
            const pickupLat = warehouseLat || -1.286389; // Default Nairobi CBD if not provided
            const pickupLng = warehouseLng || 36.817223;

            const distToPickup = calculateHaversineDistance(
                rider.lat || pickupLat,
                rider.lng || pickupLng,
                pickupLat,
                pickupLng
            );

            const distanceScore = Math.max(0, 40 - (distToPickup * 5)); // Max 40 points, deduct 5 per KM

            // B. Workload Score
            const workloadScore = rider.status === 'Idle' ? 20 : 5; // Max 20 points

            // C. Reliability Score (from DB)
            const reliabilityScore = (Number(rider.reliability_score) || 100) * 0.2; // Max 20 points (20% of 100)

            // D. ETA Prediction (Simulated for scoring)
            const estimatedEta = (distToPickup / 30) * 60; // Assumed 30km/h average in Nairobi
            const etaScore = Math.max(0, 10 - (estimatedEta / 2)); // Max 10 points

            // E. Vehicle Match
            const vehicleScore = rider.vehicle_type === 'Motorbike' ? 10 : 7; // Bikes faster for tech

            const totalScore = distanceScore + workloadScore + reliabilityScore + etaScore + vehicleScore;

            return {
                rider_phone: rider.rider_phone,
                rider_name: rider.rider_name,
                score: Math.round(totalScore),
                factors: {
                    distance: Math.round(distanceScore),
                    eta: Math.round(etaScore),
                    workload: Math.round(workloadScore),
                    reliability: Math.round(reliabilityScore),
                    vehicle_match: Math.round(vehicleScore)
                }
            };
        });

        // Sort by highest score
        return scoredRiders.sort((a, b) => b.score - a.score);

    } catch (err) {
        console.error("Dispatch Singularity Error:", err);
        return [];
    }
}

/**
 * Haversine formula to calculate distance between two points in KM
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
