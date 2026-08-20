import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

/**
 * Apex Autonomous Payout Worker
 * Automates disbursements to Riders and Suppliers.
 */
export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 500 });

    try {
        const { type, recipientId, amount, reference } = await request.json();

        // 1. Verify Entity
        const { data: profile } = await supabase
            .from(type === 'RIDER' ? 'rider_status' : 'suppliers')
            .select('*')
            .eq(type === 'RIDER' ? 'rider_phone' : 'id', recipientId)
            .single();

        if (!profile) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

        // 2. M-Pesa B2C Mock/Integration
        console.log(`[PAYOUT] Autonomous Disbursement Triggered: ${type} -> ${recipientId} | Amount: ${amount}`);

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
            message: "Disbursement Protocol Engaged."
        });

    } catch (error: any) {
        console.error("Payout Worker Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
