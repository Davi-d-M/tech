import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { supabase } from "@/lib/supabaseClient";

import { verifySessionCookie } from "@/lib/adminAuth";
import { cookies } from "next/headers";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
    try {
        // SECURITY: Allow only internal server calls or authorized admin sessions
        const authHeader = request.headers.get('Authorization');
        const isInternal = authHeader === `Bearer ${process.env.PAYSTACK_SECRET_KEY || process.env.ADMIN_PASSWORD}`;

        const cookieStore = await cookies();
        const session = verifySessionCookie(cookieStore.get('admin_session')?.value);

        if (!isInternal && !session) {
            return NextResponse.json({ error: "Unauthorized Access Detected 🛡️" }, { status: 401 });
        }

        const { type, details } = await request.json();

        if (!resend) {
            return NextResponse.json({ ok: true, message: "Email skipped (no key)" });
        }

        // Fetch Admin Email from Env
        let adminEmail = process.env.ADMIN_EMAIL;
        if (supabase) {
            const { data } = await supabase.from('settings').select('value').eq('key', 'contact').eq('is_published', true).maybeSingle();
            if (data?.value?.email) {
                adminEmail = data.value.email;
            }
        }

        if (!adminEmail) {
            return NextResponse.json({ ok: true, message: "Email skipped (no recipient)" });
        }

        let subject = "";
        let html = "";

        switch (type) {
            case 'NEW_ORDER':
                subject = `🚨 NEW ORDER RECEIVED: #${details.orderId}`;
                html = `
                    <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ff6b00; border-radius: 15px;">
                        <h2 style="color: #ff6b00; text-transform: uppercase;">New Order Alert!</h2>
                        <p><b>Order ID:</b> #${details.orderId}</p>
                        <p><b>Customer:</b> ${details.customerName}</p>
                        <p><b>Total:</b> Ksh ${details.amount}</p>
                        <p><b>Payment:</b> ${details.paymentMethod}</p>
                        <hr />
                        <p>Check the dashboard to manage dispatch.</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/admin/orders" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">VIEW ORDERS</a>
                    </div>
                `;
                break;

            case 'LOW_STOCK':
                subject = `⚠️ LOW STOCK ALERT: ${details.productName}`;
                html = `
                    <div style="font-family: sans-serif; padding: 20px; border: 2px solid #e11d48; border-radius: 15px;">
                        <h2 style="color: #e11d48; text-transform: uppercase;">Stock Warning</h2>
                        <p>The following item is running low:</p>
                        <p><b>Product:</b> ${details.productName}</p>
                        <p><b>Remaining:</b> <span style="color: #e11d48; font-weight: bold;">${details.currentStock} units</span></p>
                        <hr />
                        <p>Restock soon to avoid losing sales!</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/admin/upload" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">MANAGE INVENTORY</a>
                    </div>
                `;
                break;

            default:
                subject = "System Notification - Apexstores";
                html = `<p>${JSON.stringify(details)}</p>`;
        }

        await resend.emails.send({
            from: 'Apexstores Alerts <system@apexstores.co.ke>',
            to: adminEmail,
            subject: subject,
            html: html,
        });

        return NextResponse.json({ ok: true });

    } catch (error: unknown) {
        console.error("Admin Notification Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
