import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { verifySessionCookie } from "@/lib/adminAuth";
import { cookies } from "next/headers";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Ghost Worker 2.0: Advanced Recovery Engine
 * This route detects inactivity (15m+) and triggers recovery campaigns.
 */
export async function GET() {
    // SECURITY: Only allow manual trigger by authorized admin
    const cookieStore = await cookies();
    const session = verifySessionCookie(cookieStore.get('admin_session')?.value);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized Access Detected 🛡️" }, { status: 401 });
    }

    if (!supabase) return NextResponse.json({ error: "DB not connected" }, { status: 500 });

    try {
        // 1. Inactivity Threshold: 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 2. Fetch carts that are 'Waiting' and older than 15 mins
        const { data: carts, error: fetchError } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('recovery_status', 'Waiting')
            .lt('updated_at', fifteenMinsAgo)
            .gt('updated_at', oneDayAgo);

        if (fetchError) throw fetchError;
        if (!carts || carts.length === 0) return NextResponse.json({ message: "Ghost Worker: No idle bags found in pipeline." });

        let processed = 0;

        // Fetch Owner Name for email
        let ownerName = 'David';
        if (supabase) {
            const { data } = await supabase.from('settings').select('value').eq('key', 'branding').eq('is_published', true).maybeSingle();
            if (data?.value?.owner_name) {
                ownerName = data.value.owner_name.split(' ')[0];
            }
        }

        for (const cart of carts) {
            const itemsList = cart.cart_items.map((i: { name: string }) => i.name).join(', ');

            // Channel Selection Logic
            // Default to WhatsApp for Kenya-based high conversion, fallback to email if available
            const selectedChannel = 'WhatsApp';

            // 3. Log Step to Journey
            const newLogEntry = {
                t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                m: `Ghost Worker: Automatic ${selectedChannel} Campaign Triggered`,
                c: 'emerald'
            };

            const updatedJourney = [...(cart.journey_log || []), newLogEntry];

            // 4. Update Cart Status
            await supabase
                .from('abandoned_carts')
                .update({
                    recovery_status: 'Contacted',
                    recovery_channel: selectedChannel,
                    last_contacted_at: new Date().toISOString(),
                    journey_log: updatedJourney
                })
                .eq('id', cart.id);

            // 5. Email Trigger (If configured)
            if (resend && cart.customer_email) {
                try {
                    await resend.emails.send({
                        from: 'Apexstores <onboarding@resend.dev>',
                        to: cart.customer_email,
                        subject: "Your bag is expiring! ⏳",
                        html: `<div style="font-family:sans-serif;padding:20px;">
                            <h2 style="color:#ff6b00;">Wait, ${cart.customer_name.split(' ')[0] || ownerName}!</h2>
                            <p>You left <b>${itemsList}</b> in your bag.</p>
                            <p>Finish your order in the next 6 hours to secure priority dispatch.</p>
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/cart" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">RETURN TO BAG</a>
                        </div>`
                    });
                } catch {
                    // Ignore email errors
                }
            }

            processed++;
        }

        return NextResponse.json({
            success: true,
            processed,
            message: `Ghost Worker successfully processed ${processed} abandoned bags.`
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
