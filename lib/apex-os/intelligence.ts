import { supabase } from "@/lib/supabaseClient";
import { calculateInventoryVelocity } from "./velocity";

export type ExceptionType = 'FINANCE' | 'LOGISTICS' | 'INVENTORY' | 'RISK' | 'SUPPLIER';

export interface ApexException {
    id: string;
    code: string;
    type: ExceptionType;
    severity: 'Critical' | 'Warning' | 'Info';
    title: string;
    description: string;
    order_id?: number;
    time?: string;
}

/**
 * Tactical Scanner for Apex OS Anomaly Detection
 * Scans the entire operation for bottlenecks and discrepancies.
 */
export async function scanForExceptions(): Promise<ApexException[]> {
    if (!supabase) return [];

    // Force EAT (Nairobi) Timezone for scans
    const nairobiTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Nairobi"}));
    const exceptions: ApexException[] = [];

    // --- 1. LOGISTICS LATENCY ---

    // 🔴 1. Logistics Latency (Orders stuck in Paid status > 2 hours without dispatch)
    const twoHoursAgo = new Date(nairobiTime.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckOrders } = await supabase
        .from('orders')
        .select('id, customer_name, created_at, status')
        .in('status', ['Paid', 'Stock Reserved', 'Supplier Confirmed'])
        .lt('created_at', twoHoursAgo);

    if (stuckOrders) {
        stuckOrders.forEach(order => {
            let title = 'Fulfillment Failure';
            if (order.status === 'Supplier Confirmed') title = 'Supplier Dispatch Delay';

            exceptions.push({
                id: `stuck-${order.id}`,
                code: 'LD_STUCK',
                type: 'LOGISTICS',
                severity: 'Critical',
                title,
                description: `Order #${order.id} (${order.status}) has been idle for 2+ hours.`,
                order_id: order.id,
                time: '2h+ delay'
            });
        });
    }

    // Scans for Dispatched riders who haven't updated location for 45 mins
    const fortyFiveMinsAgo = new Date(nairobiTime.getTime() - 45 * 60 * 1000).toISOString();
    const { data: stalledRiders } = await supabase
        .from('rider_status')
        .select('rider_name, updated_at')
        .eq('status', 'Delivering')
        .lt('updated_at', fortyFiveMinsAgo);

    stalledRiders?.forEach(rider => {
        exceptions.push({
            id: `rider-${rider.rider_name}`,
            code: 'LD_RIDER_STALL',
            type: 'LOGISTICS',
            severity: 'Warning',
            title: 'Rider Inactivity',
            description: `Unit ${rider.rider_name} is in "Delivering" mode but no pulse for 45m.`,
            time: 'Stalled'
        });
    });

    // --- 2. INVENTORY RISK ---
    const { data: criticalStock } = await supabase
        .from('products')
        .select('name, stock')
        .lte('stock', 2);

    criticalStock?.forEach(p => {
        exceptions.push({
            id: `stock-${p.name}`,
            code: 'INV_EMPTY',
            type: 'INVENTORY',
            severity: 'Critical',
            title: 'Inventory Depletion',
            description: `Asset ${p.name} is below critical threshold (${p.stock} units). Immediate restocking required.`,
            time: 'Immediate'
        });
    });

    // --- 3. FINANCIAL VARIANCE ---
    const { data: phantomPayments } = await supabase
        .from('payment_logs')
        .select('reference, amount, created_at')
        .eq('event_type', 'charge.success')
        .is('order_id', null)
        .gte('created_at', new Date(nairobiTime.getTime() - 24 * 60 * 60 * 1000).toISOString());

    if (phantomPayments) {
        phantomPayments.forEach(p => {
            exceptions.push({
                id: `phantom-${p.reference}`,
                code: 'FIN_PHANTOM',
                type: 'FINANCE',
                severity: 'Critical',
                title: 'Unlinked Payment',
                description: `Received KES ${p.amount} (Ref: ${p.reference}) but no matching order exists. High Risk.`,
                time: 'Anomaly'
            });
        });
    }

    // --- 4. RISK ENGINE ---

    // Detect customers with multiple failed orders in 24h
    const { data: repeatFailures } = await supabase
        .from('orders')
        .select('customer_phone')
        .eq('status', 'Payment Failed')
        .gte('created_at', new Date(nairobiTime.getTime() - 24 * 60 * 60 * 1000).toISOString());

    if (repeatFailures) {
        const counts = repeatFailures.reduce((acc: Record<string, number>, curr) => {
            acc[curr.customer_phone] = (acc[curr.customer_phone] || 0) + 1;
            return acc;
        }, {});

        Object.entries(counts).forEach(([phone, count]) => {
            if (count >= 3) {
                exceptions.push({
                    id: `fraud-${phone}`,
                    code: 'RISK_FAIL_LOOP',
                    type: 'RISK',
                    severity: 'Warning',
                    title: 'Payment Loop Detected',
                    description: `Customer ${phone} has 3+ payment failures in 24h. Potential fraud or gateway friction.`,
                    time: 'High Risk'
                });
            }
        });
    }

    // --- 5. PROCUREMENT DISCREPANCY (Low Stock + No Inbound) ---
    const { data: lowAssets } = await supabase
        .from('products')
        .select('id, name, stock')
        .lte('stock', 5);

    if (lowAssets && lowAssets.length > 0) {
        const { data: inbound } = await supabase.from('shipments').select('description').in('status', ['In Transit', 'Clearing']);
        const inboundNames = (inbound || []).map(i => i.description.toLowerCase());

        lowAssets.forEach(p => {
            const hasInbound = inboundNames.some(desc => desc.includes(p.name.toLowerCase()));
            if (!hasInbound) {
                exceptions.push({
                    id: `procure-${p.id}`,
                    code: 'PROC_ALERT',
                    type: 'SUPPLIER',
                    severity: 'Warning',
                    title: 'Procurement Required',
                    description: `Asset ${p.name} is low (${p.stock}) with no inbound shipments. Recommended: Generate PO.`,
                    time: 'Mission Critical'
                });
            }
        });
    }

    // --- 6. SENTIMENT PULSE (Customer Temperature) ---
    const { data: recentMsgs } = await supabase
        .from('messages')
        .select('message')
        .order('created_at', { ascending: false })
        .limit(10);

    if (recentMsgs && recentMsgs.length > 0) {
        const negativeKeywords = ['broken', 'fail', 'bad', 'disappointed', 'stole', 'fake', 'late'];
        const frustrationCount = recentMsgs.filter(m =>
            negativeKeywords.some(kw => m.message.toLowerCase().includes(kw))
        ).length;

        if (frustrationCount >= 3) {
            exceptions.push({
                id: 'sentiment-critical',
                code: 'SENT_CRITICAL',
                type: 'RISK',
                severity: 'Critical',
                title: 'Negative Sentiment Spike',
                description: `Detected 3+ negative signals in recent support messages. Brand temperature rising.`,
                time: 'Immediate'
            });
        }
    }

    // --- 7. VELOCITY PREDICTION (Days to Depletion) ---
    const velocityData = await calculateInventoryVelocity();
    velocityData.filter(v => v.health_status === 'Critical').forEach(v => {
        exceptions.push({
            id: `velocity-${v.product_id}`,
            code: 'VEL_DEPLETE',
            type: 'INVENTORY',
            severity: 'Critical',
            title: 'Predictive Stock-Out',
            description: `Asset ${v.name} will deplete in ${v.days_to_depletion} days at current velocity. Supply chain gap imminent.`,
            time: 'Predictive'
        });
    });

    return exceptions;
}

/**
 * Phase 10: Demand Prediction Node
 * Logs user geo-activity to the global heatmap.
 */
export async function trackBrowsingZone(payload: {
    page: string,
    lat?: number,
    lon?: number,
    session_id: string
}) {
    if (!supabase) return;
    try {
        await supabase.from('active_visitors').upsert({
            session_id: payload.session_id,
            current_page: payload.page,
            latitude: payload.lat,
            longitude: payload.lon,
            last_active_at: new Date().toISOString(),
            status: 'Browsing'
        }, { onConflict: 'session_id' });
    } catch (err) {
        console.error("Heatmap Sync Failed:", err);
    }
}
