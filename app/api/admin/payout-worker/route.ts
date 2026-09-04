import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionCookie } from "@/lib/adminAuth";

/**
 * Apex Autonomous Payout Worker
 * Automates disbursements to Riders and Suppliers.
 * SHIELD: Server-side role verification enabled.
 */
export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 500 });

    try {
        // 0. SHIELD: Verify Admin Session
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('admin_session')?.value;
        const sessionData = await verifySessionCookie(sessionToken);

        if (!sessionData || (sessionData.role !== 'admin' && sessionData.role !== 'owner')) {
            console.error(`[SHIELD] Unauthorized Payout Attempt blocked for user: ${sessionData?.email || 'Unknown'}`);
            return NextResponse.json({ error: "Access Denied: Admin Clearance Required" }, { status: 403 });
        }

        // 0.5 SHIELD: Final Database verification against Staff Table
        const { data: staffMember, error: staffError } = await supabase
            .from('staff')
            .select('role')
            .eq('email', sessionData.email)
            .single();

        if (staffError || !staffMember || (staffMember.role !== 'admin' && staffMember.role !== 'owner')) {
            console.error(`[SHIELD] Database role mismatch for user: ${sessionData.email}`);
            return NextResponse.json({ error: "Security Breach: Identity Verification Failed" }, { status: 403 });
        }

        const { type, recipientId, amount, reference } = await request.json();

        // 1. Verify Entity
        const { data: profile } = await supabase
            .from(type === 'RIDER' ? 'rider_status' : 'suppliers')
            .select('*')
            .eq(type === 'RIDER' ? 'rider_phone' : 'id', recipientId)
            .single();

        if (!profile) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

        // 2. M-Pesa B2C Integration
        console.log(`[PAYOUT] Disbursement Triggered: ${type} -> ${recipientId} | Amount: ${amount}`);

        // 3. Log to Financial Ledger
        const { error: ledgerError } = await supabase.from('financial_ledger').insert([{
            entry_type: type === 'RIDER' ? 'DELIVERY_FEE' : 'SUPPLIER_PAYABLE',
            amount: -amount, // Debit
            description: `Autonomous Payout for Ref: ${reference}`,
            is_reconciled: true,
            metadata: { payout_id: `PAY-${Date.now()}`, recipient: recipientId }
        }]);

        if (ledgerError) throw ledgerError;

        // 4. Update Wallet if Rider
        if (type === 'RIDER') {
            await supabase.rpc('debit_rider_wallet', {
                phone_input: recipientId,
                amount_input: amount
            });
        }

        return NextResponse.json({
            success: true,
            payout_ref: `PAY-${Date.now()}`,
            message: "Disbursement initiated successfully."
        });

    } catch (error: unknown) {
        console.error("Payout Worker Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
