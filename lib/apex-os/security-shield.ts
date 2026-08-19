import { supabase } from '../supabaseClient';

export interface ThreatReport {
    id: string;
    type: 'Velocity' | 'Phone_Anomaly' | 'Geofence_Violation' | 'Bot_Pattern';
    severity: 'Medium' | 'High' | 'Critical';
    description: string;
    metadata: Record<string, any>;
    status: 'Flagged' | 'Cleared' | 'Blocked';
    created_at: string;
}

/**
 * Apex Autonomous Security Shield
 * Monitors for fraudulent patterns and automated attacks.
 */
export async function runSecurityScan() {
    if (!supabase) return;

    try {
        const threats: Partial<ThreatReport>[] = [];

        // 1. VELOCITY SCAN: Rapid orders from same IP/Session
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, ip_address, created_at')
            .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last 1 hour

        if (recentOrders && recentOrders.length > 5) {
            const ipMap = new Map<string, number>();
            recentOrders.forEach(o => {
                if (o.ip_address) ipMap.set(o.ip_address, (ipMap.get(o.ip_address) || 0) + 1);
            });

            for (const [ip, count] of ipMap.entries()) {
                if (count >= 3) {
                    threats.push({
                        type: 'Velocity',
                        severity: 'High',
                        description: `Detected ${count} order attempts from IP ${ip} within 60 mins.`,
                        metadata: { ip, count },
                        status: 'Flagged'
                    });
                }
            }
        }

        // 2. PHONE ANOMALY: Repeating failed payments for same phone
        const { data: failedLogs } = await supabase
            .from('payment_logs')
            .select('customer_phone, created_at')
            .eq('event_type', 'charge.failed')
            .gte('created_at', new Date(Date.now() - 86400000).toISOString()); // Last 24 hours

        if (failedLogs && failedLogs.length > 3) {
            const phoneMap = new Map<string, number>();
            failedLogs.forEach(l => {
                if (l.customer_phone) phoneMap.set(l.customer_phone, (phoneMap.get(l.customer_phone) || 0) + 1);
            });

            for (const [phone, count] of phoneMap.entries()) {
                if (count >= 3) {
                    threats.push({
                        type: 'Phone_Anomaly',
                        severity: 'Critical',
                        description: `Phone ${phone} has ${count} failed payment attempts. Potential brute force.`,
                        metadata: { phone, count },
                        status: 'Flagged'
                    });
                }
            }
        }

        // Commit Threats to DB for Admin View
        if (threats.length > 0) {
            await supabase.from('security_threats').upsert(threats);
            console.log(`[SHIELD] Security Scan Complete: ${threats.length} threats identified.`);
        }

    } catch (err) {
        console.error("Shield Scan Failed:", err);
    }
}
