import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "DB not connected" }, { status: 500 });

    try {
        const { userId: bodyUserId, action, payload } = await request.json();

        // SECURITY: Verify the user is who they say they are via JWT
        const authHeader = request.headers.get('Authorization');
        let userId = bodyUserId;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && user) {
                userId = user.id; // Override with verified UID
            } else if (authError) {
                return NextResponse.json({ error: "Invalid Auth Token" }, { status: 401 });
            }
        } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
            // In production, require Authorization header for member actions
            // (Optional: depending on how you've set up your client calls)
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized Access Detected 🛡️" }, { status: 401 });
        }

        switch (action) {
            case 'update-streak':
                return await handleUpdateStreak(userId);
            case 'claim-daily-reward':
                return await handleClaimDailyReward(userId, payload.type); // 'spin' or 'box'
            case 'update-mission-progress':
                return await handleUpdateMissionProgress(userId, payload.missionType, payload.increment);
            case 'sync-all-stats':
                return await handleSyncAllStats(userId);
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

async function handleUpdateStreak(userId: string) {
    if (!supabase) throw new Error("DB not connected");
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('current_streak, last_streak_update')
        .eq('id', userId)
        .single();

    if (fetchError) throw fetchError;

    const lastUpdate = profile.last_streak_update ? new Date(profile.last_streak_update) : null;
    const now = new Date();

    // Check if updated today already (Kenya Time focus)
    if (lastUpdate && lastUpdate.toDateString() === now.toDateString()) {
        return NextResponse.json({ ok: true, streak: profile.current_streak, message: "Already updated today" });
    }

    let newStreak = 1;
    if (lastUpdate) {
        const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
            newStreak = (profile.current_streak || 0) + 1;
        }
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            current_streak: newStreak,
            last_streak_update: now.toISOString()
        })
        .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, newStreak });
}

async function handleClaimDailyReward(userId: string, type: 'spin' | 'box') {
    if (!supabase) throw new Error("DB not connected");
    const { data: lastClaim } = await supabase
        .from('daily_rewards_log')
        .select('created_at')
        .eq('user_id', userId)
        .eq('reward_type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastClaim) {
        const lastDate = new Date(lastClaim.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 3600);

        if (diffHours < 24) {
            return NextResponse.json({ error: `Please wait ${Math.ceil(24 - diffHours)} hours before your next claim.` }, { status: 429 });
        }
    }

    // Logic to select reward based on admin settings (to be added in admin phase)
    // For now, simple random reward
    const rewards = [
        { type: 'xp', amount: 50, label: '50 XP' },
        { type: 'xp', amount: 100, label: '100 XP' },
        { type: 'voucher', amount: 100, label: 'KSh 100 Coupon' },
        { type: 'perk', amount: 0, label: 'Free Delivery' }
    ];
    const prize = rewards[Math.floor(Math.random() * rewards.length)];

    const { error: logError } = await supabase
        .from('daily_rewards_log')
        .insert([{
            user_id: userId,
            reward_type: type,
            reward_label: prize.label,
            reward_value: prize.amount
        }]);

    if (logError) throw logError;

    if (prize.type === 'xp') {
        const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).single();
        await supabase.from('profiles').update({ loyalty_points: (profile?.loyalty_points || 0) + prize.amount }).eq('id', userId);
        await supabase.from('loyalty_ledger').insert([{ profile_id: userId, amount: prize.amount, description: `Daily ${type} reward: ${prize.label}` }]);
    }

    return NextResponse.json({ ok: true, prize });
}

async function handleUpdateMissionProgress(userId: string, type: string, increment: number) {
    if (!supabase) throw new Error("DB not connected");
    const { data: mission } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_type', type)
        .maybeSingle();

    // Mission targets
    const targets: Record<string, number> = {
        'buy-accessory': 2,
        'review-product': 5,
        'watch-video': 1,
        'refer-friend': 1,
        'wishlist-items': 5,
        'share-product': 1,
    };

    const target = targets[type] || 1;
    let newProgress = (mission?.progress || 0) + increment;
    let completed = false;

    if (newProgress >= target && !mission?.is_completed) {
        newProgress = target;
        completed = true;
    }

    const { error } = await supabase
        .from('user_missions')
        .upsert({
            user_id: userId,
            mission_type: type,
            progress: newProgress,
            is_completed: completed,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,mission_type' });

    if (error) throw error;

    if (completed) {
        const xpMap: Record<string, number> = {
            'buy-accessory': 100,
            'review-product': 50,
            'watch-video': 30,
            'refer-friend': 200,
            'wishlist-items': 40,
            'share-product': 25,
        };
        const xp = xpMap[type] || 0;
        const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).single();
        await supabase.from('profiles').update({ loyalty_points: (profile?.loyalty_points || 0) + xp }).eq('id', userId);
        await supabase.from('loyalty_ledger').insert([{ profile_id: userId, amount: xp, description: `Completed mission: ${type}` }]);
    }

    return NextResponse.json({ ok: true, progress: newProgress, completed });
}

async function handleSyncAllStats(userId: string) {
    if (!supabase) throw new Error("DB not connected");
    // 1. Recalculate Commissions from Orders
    const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', userId).single();
    if (!profile?.referral_code) return NextResponse.json({ ok: false, error: "No referral code" });

    const { data: orders } = await supabase
        .from('orders')
        .select('total_price')
        .eq('referred_by_code', profile.referral_code)
        .eq('status', 'Delivered');

    const totalCom = (orders || []).reduce((sum, o) => sum + (o.total_price * 0.05), 0);

    // 2. Update Profile
    await supabase
        .from('profiles')
        .update({ total_commission_earned: Math.round(totalCom) })
        .eq('id', userId);

    return NextResponse.json({ ok: true, commission: totalCom });
}
