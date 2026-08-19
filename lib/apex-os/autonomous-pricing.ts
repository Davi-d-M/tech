import { supabase } from '../supabaseClient';

/**
 * Apex Autonomous Pricing Protocol
 * Fluctuates price based on stock velocity and inventory aging.
 */
export async function runAutonomousPricingSync() {
    if (!supabase) return;

    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, price, price_min, price_max, stock, is_dynamic_pricing')
            .eq('is_dynamic_pricing', true);

        if (error || !products) return;

        for (const product of products) {
            const currentPrice = Number(product.price);
            const min = Number(product.price_min);
            const max = Number(product.price_max);
            const stock = Number(product.stock);

            if (!min || !max) continue;

            let nextPrice = currentPrice;

            // 1. SCARCITY LOGIC: Low stock -> Higher price
            if (stock <= 3) {
                nextPrice = Math.min(max, currentPrice * 1.05);
            }
            // 2. OVERSTOCK LOGIC: High stock -> Lower price to move inventory
            else if (stock >= 20) {
                nextPrice = Math.max(min, currentPrice * 0.95);
            }
            // 3. EQUILIBRIUM: Random micro-fluctuation to test price elasticity
            else {
                const flux = (Math.random() * 0.02) - 0.01; // +/- 1%
                nextPrice = Math.min(max, Math.max(min, currentPrice * (1 + flux)));
            }

            if (Math.round(nextPrice) !== Math.round(currentPrice)) {
                await supabase
                    .from('products')
                    .update({
                        price: Math.round(nextPrice),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', product.id);

                console.log(`[SINGULARITY] Autonomous Price Adjusted: ${product.name} -> ${nextPrice}`);
            }
        }
    } catch (err) {
        console.error("Pricing Sync Failed:", err);
    }
}
