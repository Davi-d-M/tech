import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not connected" }, { status: 500 });
        }

        // 1. Save to Supabase (Backup)
        const { error: dbError } = await supabase
            .from('newsletter_subscribers')
            .insert([{ email: email.toLowerCase() }]);

        if (dbError && dbError.code === '23505') {
            return NextResponse.json({ message: "Already subscribed!" }, { status: 200 });
        }

        if (dbError) throw dbError;

        // 2. Add to Resend Contacts
        if (resend) {
            try {
                await resend.contacts.create({
                    email: email.toLowerCase(),
                    audienceId: AUDIENCE_ID,
                });
            } catch (resendError) {
                console.error("Resend Sync Error:", resendError);
                // We don't fail the whole request if Resend fails but DB succeeded
            }
        }

        return NextResponse.json({ message: "Subscribed successfully!" }, { status: 200 });

    } catch (error: unknown) {
        console.error("Newsletter API Error:", (error as Error).message || error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
