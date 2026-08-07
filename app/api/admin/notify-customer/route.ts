import { NextResponse } from "next/server";
import { Resend } from 'resend';

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

        const { email, orderId, status, name } = await request.json();

        if (!resend || !email) {
            return NextResponse.json({ ok: true, message: "Email skipped (no key or email)" });
        }

        let subject = "";
        let headline = "";
        let body = "";

        if (status === 'Dispatched') {
            subject = `Your Order #${orderId} is on the way!`;
            headline = "Good news, your tech is moving!";
            body = `Hello ${name}, your order #${orderId} has been dispatched and is currently with our rider. You should receive it shortly.`;
        } else if (status === 'Delivered') {
            subject = `Order #${orderId} Delivered - Enjoy your tech!`;
            headline = "Delivery Complete!";
            body = `Hello ${name}, your order #${orderId} has been successfully delivered. We hope you love your new gadgets!`;
        } else if (status === 'Paid') {
            subject = `Payment Confirmed for Order #${orderId} 💳✨`;
            headline = "We've received your payment!";
            body = `Hello ${name}, your payment for order #${orderId} has been successfully confirmed via Paystack. We are now preparing your items for dispatch.`;
        } else {
            return NextResponse.json({ ok: true });
        }

        await resend.emails.send({
            from: 'Apexstores <onboarding@resend.dev>',
            to: email,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #ff6b00;">${headline}</h1>
                    <p>${body}</p>
                    <p>Track your order anytime here: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/track">Track Order</a></p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999;">Apexstores Tech Kenya - Elite Mobile Accessories</p>
                </div>
            `,
        });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("Notification Error:", error);
        return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }
}
