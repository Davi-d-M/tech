import { supabase } from "@/lib/supabaseClient";

export interface ProductVelocity {
    product_id: number;
    name: string;
    stock: number;
    sales_velocity: number; // units per day
    days_to_depletion: number;
    health_status: 'Optimal' | 'Warning' | 'Critical';
}

/**
 * Apex OS: Oracle Node (Predictive Velocity)
 * Analyzes sales history to predict future inventory gaps.
 */
export async function calculateInventoryVelocity(): Promise<ProductVelocity[]> {
    if (!supabase) return [];

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateLimit = thirtyDaysAgo.toISOString();

        // 1. Fetch products and sales history (last 30 days)
        const [productsRes, salesRes] = await Promise.all([
            supabase.from('products').select('id, name, stock'),
            supabase.from('orders')
                .select('product_id, quantity')
                .eq('status', 'Delivered')
                .gte('created_at', dateLimit)
        ]);

        if (!productsRes.data || !salesRes.data) return [];

        const products = productsRes.data;
        const sales = salesRes.data;

        // 2. Aggregate sales per product
        const salesMap = new Map<number, number>();
        sales.forEach(s => {
            const current = salesMap.get(s.product_id) || 0;
            salesMap.set(s.product_id, current + (s.quantity || 1));
        });

        // 3. Calculate Velocity & Projections
        return products.map(p => {
            const totalSales = salesMap.get(p.id) || 0;
            const velocity = totalSales / 30; // Average units per day

            // Avoid division by zero: if velocity is 0, we assume stable stock
            let daysToDepletion = 999;
            if (velocity > 0) {
                daysToDepletion = p.stock / velocity;
            }

            let status: 'Optimal' | 'Warning' | 'Critical' = 'Optimal';
            if (daysToDepletion <= 3) status = 'Critical';
            else if (daysToDepletion <= 7) status = 'Warning';

            return {
                product_id: p.id,
                name: p.name,
                stock: p.stock,
                sales_velocity: parseFloat(velocity.toFixed(2)),
                days_to_depletion: Math.round(daysToDepletion),
                health_status: status
            };
        }).sort((a, b) => a.days_to_depletion - b.days_to_depletion);

    } catch (err) {
        console.error("Oracle Node Prediction Failure:", err);
        return [];
    }
}
