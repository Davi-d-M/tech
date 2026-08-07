import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "DB not connected" }, { status: 500 });

    try {
        const { userId, hasPhoto, productName } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPhoto) {
            return NextResponse.json({ message: "No photo, no reward. But thanks for the review!" });
        }

        // 1. Get current points
        const { data: profile } = await supabase
            .from('profiles')
            .select('loyalty_points')
            .eq('id', userId)
            .single();

        const currentPoints = profile?.loyalty_points || 0;
        const rewardPoints = 50;

        // 2. Update points
        await supabase
            .from('profiles')
            .update({ loyalty_points: currentPoints + rewardPoints })
            .eq('id', userId);

        // 3. Log to ledger
        await supabase
            .from('loyalty_ledger')
            .insert([{
                profile_id: userId,
                amount: rewardPoints,
                description: `Reward for photo review of ${productName}`
            }]);

        return NextResponse.json({ success: true, pointsAwarded: rewardPoints });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
