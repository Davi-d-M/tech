import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }
    try {
        const body = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        // 1. Verify Signature
        const hash = createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex');

        if (hash !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(body);

        // 2. Handle Event
        if (event.event === 'charge.success') {
            const data = event.data;
            const reference = data.reference;
            const status = data.status;

            if (status === 'success') {
                // Fetch the order first to see if it's already processed
                const { data: existingOrders } = await supabase
                    .from('orders')
                    .select('status')
                    .eq('checkout_request_id', reference);

                if (existingOrders && existingOrders.some(o => o.status === 'Paid')) {
                    return NextResponse.json({ received: true, message: "Already processed" });
                }

                // Update Order in Supabase
                const updatePayload: { status: string; payment_verified_at: string; note?: string } = {
                    status: 'Paid',
                    payment_verified_at: new Date().toISOString(),
                    note: `Payment Verified via Webhook. Ref: ${reference}`
                };

                const { data: orderItems, error: updateError } = await supabase
                    .from('orders')
                    .update(updatePayload)
                    .eq('checkout_request_id', reference)
                    .select('*');

                if (updateError) {
                    const errorMessage = updateError.message.toLowerCase();
                    if (errorMessage.includes("note") || errorMessage.includes("schema")) {
                        // Retry without note
                        delete updatePayload.note;
                        const { error: retryError } = await supabase
                            .from('orders')
                            .update(updatePayload)
                            .eq('checkout_request_id', reference)
                            .select('*');

                        if (retryError) {
                            console.error("Webhook Order Update Retry Error:", retryError);
                            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                        }
                    } else {
                        console.error("Webhook Order Update Error:", updateError);
                        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                    }
                }

                // Post-Success Fulfillment Logic
                if (orderItems && orderItems.length > 0) {
                    const firstItem = orderItems[0];
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

                    // 1. Deduct Stock for each item in the order
                    for (const item of orderItems) {
                        if (item.product_id) {
                            const { data: product } = await supabase
                                .from('products')
                                .select('stock')
                                .eq('id', item.product_id)
                                .single();

                            if (product) {
                                await supabase
                                    .from('products')
                                    .update({ stock: Math.max(0, (product.stock || 0) - (item.quantity || 1)) })
                                    .eq('id', item.product_id);
                            }
                        }
                    }

                    // 2. Notify Admin
                    fetch(`${baseUrl}/api/admin/notify-admin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
                        },
                        body: JSON.stringify({
                            type: 'NEW_ORDER',
                            details: {
                                orderId: firstItem.id,
                                customerName: firstItem.customer_name,
                                amount: orderItems.reduce((acc, curr) => acc + (curr.total_price || 0), 0),
                                paymentMethod: 'Paystack (M-Pesa/Card)'
                            }
                        })
                    }).catch(e => console.error("Admin Notify Error:", e));

                    // 3. Notify Customer
                    if (firstItem.customer_email) {
                        fetch(`${baseUrl}/api/admin/notify-customer`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
                            },
                            body: JSON.stringify({
                                email: firstItem.customer_email,
                                orderId: firstItem.id,
                                status: 'Paid',
                                name: firstItem.customer_name
                            })
                        }).catch(e => console.error("Customer Notify Error:", e));
                    }
                }
            }
        }

        if (event.event === 'charge.failed') {
            const data = event.data;
            const reference = data.reference;

            if (supabase) {
                await supabase
                    .from('orders')
                    .update({
                        status: 'Payment Failed',
                        note: `Payment failed: ${data.gateway_response || 'Unknown Error'}`
                    })
                    .eq('checkout_request_id', reference);
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: unknown) {
        console.error("Paystack Webhook Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
