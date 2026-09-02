import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Database not connected" }, { status: 500 });

    try {
        const sessionCookie = request.headers.get('Cookie')?.split('; ')
            .find(row => row.startsWith('admin_session='))?.split('=')[1];

        const sessionData = await verifySessionCookie(sessionCookie);

        if (!sessionData || sessionData.role !== 'rider') {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { action, newPin } = await request.json();

        if (action === 'change_pin') {
            if (!newPin || !/^\d{4}$/.test(newPin)) {
                return NextResponse.json({ error: "Invalid PIN format. Must be 4 digits." }, { status: 400 });
            }

            const { error } = await supabase
                .from('rider_status')
                .update({ pin: newPin })
                .eq('rider_phone', sessionData.email); // Session email stores rider phone for riders

            if (error) throw error;

            return NextResponse.json({ ok: true, message: "PIN updated successfully." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: unknown) {
        console.error("Rider Security Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
