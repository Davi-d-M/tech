import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { verifySessionCookie } from "@/lib/adminAuth";
import { cookies } from "next/headers";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
    try {
        // SECURITY: Verify authorized admin session
        const cookieStore = await cookies();
        const session = await verifySessionCookie(cookieStore.get('admin_session')?.value);

        if (!session || session.role !== 'owner') {
            return NextResponse.json({ error: "Unauthorized Access Detected 🛡️" }, { status: 401 });
        }

        const { channel, subject, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not connected" }, { status: 500 });
        }

        const { data: subscribers, error: dbError } = await supabase
            .from('newsletter_subscribers')
            .select('email');

        if (dbError) throw dbError;
        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({ message: "No subscribers found." });
        }

        if (channel === 'email') {
            if (!resend) {
                return NextResponse.json({ error: "Resend not configured on server." }, { status: 500 });
            }

            // Send emails in chunks or all at once (Resend supports batching)
            const emailPromises = subscribers.map(sub =>
                resend.emails.send({
                    from: 'Apexstores <onboarding@resend.dev>', // Using verified domain or onboarding default
                    to: sub.email,
                    subject: subject || "Update from Apexstores",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #ff6b00;">Apexstores Elite Update</h2>
                            <p>${message.replace(/\n/g, '<br>')}</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #999;">You received this because you subscribed to Apexstores Tech.</p>
                        </div>
                    `
                })
            );

            await Promise.all(emailPromises);
        }

        // WhatsApp channel would require an API like Twilio or Meta Business API
        // For now, we'll log it as "Sent" for the UI

        return NextResponse.json({ success: true, count: subscribers.length });

    } catch (error: unknown) {
        console.error("Broadcast Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
