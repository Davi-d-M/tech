import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Database not connected" }, { status: 500 });

    try {
        const sessionCookie = request.headers.get('Cookie')?.split('; ')
            .find(row => row.startsWith('admin_session='))?.split('=')[1];

        const sessionData = await verifySessionCookie(sessionCookie);

        if (!sessionData || (sessionData.role !== 'staff' && sessionData.role !== 'admin' && sessionData.role !== 'owner')) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { action, payload } = await request.json();

        if (action === 'change_pin') {
            const { newPin } = payload;
            if (!newPin || !/^\d{4}$/.test(newPin)) {
                return NextResponse.json({ error: "Invalid PIN format. Must be 4 digits." }, { status: 400 });
            }

            const { error } = await supabase
                .from('staff')
                .update({ pin: newPin })
                .eq('email', sessionData.email);

            if (error) throw error;

            return NextResponse.json({ ok: true, message: "Authorization PIN updated successfully." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: unknown) {
        console.error("Admin Security Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
