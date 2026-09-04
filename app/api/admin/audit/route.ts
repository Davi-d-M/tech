import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/adminAuth";
import { cookies } from "next/headers";

/**
 * Apex Platform: Secure Server-Side Audit Logger
 * Captures real IP and verifies authorization before persistence.
 */
export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 500 });

    try {
        // 1. Verify Admin Session
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('admin_session')?.value;
        const sessionData = await verifySessionCookie(sessionToken);

        if (!sessionData) {
            return NextResponse.json({ error: "Unauthorized: Access Denied" }, { status: 401 });
        }

        const body = await request.json();
        const { email, action, details, deviceInfo } = body;

        // 2. Capture Verified Server-Side IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   'unknown-internal';

        // 3. Persist to Audit Ledger
        const { error } = await supabase
            .from('audit_logs')
            .insert([{
                staff_email: email || sessionData.email,
                action,
                details,
                ip_address: ip,
                device_info: deviceInfo || 'Apex API',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error("Audit API Failure:", error);
        const message = error instanceof Error ? error.message : "Internal Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
