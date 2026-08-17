import { supabase } from "@/lib/supabaseClient";

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

    const now = new Date();
    const exceptions: ApexException[] = [];

    // --- 1. LOGISTICS LATENCY ---

    // Scans for 'Paid' orders not dispatched within 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stuckOrders } = await supabase
        .from('orders')
        .select('id, customer_name, created_at')
        .eq('status', 'Paid')
        .lt('created_at', twoHoursAgo);

    if (stuckOrders) {
        stuckOrders.forEach(order => {
            exceptions.push({
                id: `stuck-${order.id}`,
                code: 'LD_STUCK',
                type: 'LOGISTICS',
                severity: 'Critical',
                title: 'Fulfillment Failure',
                description: `Order #${order.id} has been PAID for 2+ hours but not dispatched. Check supplier connection.`,
                order_id: order.id,
                time: '2h+ delay'
            });
        });
    }

    // Scans for Dispatched riders who haven't updated location for 45 mins
    const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
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
            title: 'Stock Exhaustion',
            description: `Product ${p.name} is nearly empty (${p.stock} left). Sales velocity suggests stockout today.`,
            time: 'Immediate'
        });
    });

    // --- 3. RISK ENGINE ---

    // Detect customers with multiple failed orders in 24h
    const { data: repeatFailures } = await supabase
        .from('orders')
        .select('customer_phone')
        .eq('status', 'Payment Failed')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

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

    return exceptions;
}
