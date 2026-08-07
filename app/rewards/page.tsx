'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import {
    Zap,
    Gift,
    Ticket,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Clock,
    Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const VOUCHERS = [
    { points: 500, value: 500, code_prefix: 'ELITE500' },
    { points: 1000, value: 1000, code_prefix: 'ELITE1000' },
    { points: 2500, value: 2500, code_prefix: 'ELITE2500' },
    { points: 5000, value: 5000, code_prefix: 'ELITE5000' },
];

export default function RewardsShop() {
    const [user, setUser] = useState<User | null>(null);
    const [points, setPoints] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isExchanging, setIsExchanging] = useState<number | null>(null);
    const [claimedVoucher, setClaimedVoucher] = useState<string | null>(null);
    const [myVouchers, setMyVouchers] = useState<{ code: string; value: string; date: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function loadProfile() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth?mode=signin');
                return;
            }
            setUser(session.user);
            const { data } = await supabase.from('profiles').select('loyalty_points').eq('id', session.user.id).single();
            if (data) setPoints(data.loyalty_points || 0);

            // Fetch My Vouchers from ledger
            const { data: ledger } = await supabase
                .from('loyalty_ledger')
                .select('*')
                .eq('profile_id', session.user.id)
                .ilike('description', '%CODE:%');

            if (ledger) {
                const parsed = ledger.map(l => {
                    const code = l.description.split('CODE: ')[1];
                    const val = l.description.split(' Voucher')[0].split('for ')[1];
                    return { code, value: val, date: l.created_at };
                });
                setMyVouchers(parsed);
            }

            setLoading(false);
        }
        loadProfile();
    }, [router]);

    const handleExchange = async (voucher: typeof VOUCHERS[0]) => {
        if (points < voucher.points || !supabase || !user) return;

        setIsExchanging(voucher.points);
        try {
            const voucherCode = `${voucher.code_prefix}-${Math.random().toString(36).substring(7).toUpperCase()}`;

            // Map points to percent
            const percentMap: Record<number, number> = { 500: 5, 1000: 10, 2500: 15, 5000: 20 };
            const discountPercent = percentMap[voucher.points] || 5;

            // 1. Create the coupon in DB
            const { error: couponError } = await supabase
                .from('coupons')
                .insert([{
                    code: voucherCode,
                    discount_percent: discountPercent,
                    is_active: true,
                }]);

            if (couponError) throw couponError;

            // 2. Deduct points
            const { error: pointsError } = await supabase
                .from('profiles')
                .update({ loyalty_points: points - voucher.points })
                .eq('id', user.id);

            if (pointsError) throw pointsError;

            // 3. Log to ledger
            await supabase.from('loyalty_ledger').insert([{
                profile_id: user.id,
                amount: -voucher.points,
                description: `Exchanged for ${discountPercent}% Apex Voucher. CODE: ${voucherCode}`
            }]);

            setPoints(prev => prev - voucher.points);
            setClaimedVoucher(voucherCode);
            setMyVouchers(prev => [{ code: voucherCode, value: `${discountPercent}% Off`, date: new Date().toISOString() }, ...prev]);

        } catch (err: unknown) {
            const error = err as Error;
            console.error(error);
            alert(`Exchange failed: ${error.message}`);
        } finally {
            setIsExchanging(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Opening the Vault...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-5xl mx-auto">

                <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-12">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>

                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Gift className="h-3 w-3" /> Elite Rewards Shop
                        </div>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">The Apex <br/> <span className="text-primary italic">Exchange</span></h1>
                        <p className="text-slate-500 font-medium max-w-md italic">&quot;Trade your battlefield points for elite gear and store credits. No games, just gains.&quot;</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border-2 border-primary/10 text-foreground relative overflow-hidden shadow-2xl min-w-[280px] group hover:border-primary/30 transition-all">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Your Power Level</p>
                            <h3 className="text-5xl font-black tracking-tighter text-foreground">{points.toLocaleString()}</h3>
                            <p className="text-[9px] font-black text-primary uppercase mt-2 tracking-widest">Available Apex Points</p>
                        </div>
                        <Zap className="absolute -bottom-6 -right-6 h-24 w-24 text-primary/5 rotate-12" />
                    </div>
                </header>

                {claimedVoucher && (
                    <div className="mb-12 bg-emerald-500 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    <CheckCircle2 className="h-3 w-3" /> Claim Successful
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Voucher Unlocked</h2>
                                <p className="text-white/80 font-medium">Use this code at checkout for your discount.</p>
                            </div>
                            <div className="bg-white text-foreground px-10 py-6 rounded-2xl border-4 border-dashed border-emerald-600/30 shadow-xl">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1 text-center">Your Promo Code</p>
                                <p className="text-3xl font-black tracking-widest font-mono select-all cursor-pointer">{claimedVoucher}</p>
                            </div>
                            <Button onClick={() => setClaimedVoucher(null)} variant="ghost" className="text-white/60 hover:text-white uppercase font-black text-[10px]">Dismiss</Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {VOUCHERS.map((v) => {
                        const canAfford = points >= v.points;
                        return (
                            <div key={v.points} className={cn(
                                "bg-white rounded-[2.5rem] border p-8 flex flex-col transition-all group relative overflow-hidden",
                                canAfford ? "border-slate-100 hover:shadow-2xl hover:-translate-y-2" : "border-slate-50 opacity-60"
                            )}>
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-transform group-hover:scale-110",
                                    canAfford ? "bg-primary text-white" : "bg-slate-100 text-slate-300"
                                )}>
                                    <Ticket className="h-7 w-7" />
                                </div>

                                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none mb-2">Ksh {v.value.toLocaleString()} <br/> Voucher</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Store Credit</p>

                                <div className="mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[9px] font-black uppercase text-slate-400">Required</span>
                                        <span className={cn("text-xs font-black", canAfford ? "text-primary" : "text-slate-300")}>{v.points} PTS</span>
                                    </div>
                                    <Button
                                        onClick={() => handleExchange(v)}
                                        disabled={!canAfford || isExchanging !== null}
                                        className={cn(
                                            "w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                                            canAfford ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-300 border-none"
                                        )}
                                    >
                                        {isExchanging === v.points ? <Loader2 className="h-4 w-4 animate-spin" /> : canAfford ? 'Claim Now' : 'Not Enough Points'}
                                    </Button>
                                </div>

                                {!canAfford && (
                                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Clock className="h-3 w-3 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {myVouchers.length > 0 && (
                    <section className="mt-20 space-y-8">
                        <div className="flex items-center gap-3">
                            <Ticket className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">My Active Vouchers</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myVouchers.map((v, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><CheckCircle2 className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-[11px] font-black text-foreground uppercase">{v.value} Voucher</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(v.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <code className="bg-slate-50 px-4 py-2 rounded-lg text-xs font-black tracking-widest text-primary border border-slate-100 select-all cursor-pointer">{v.code}</code>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-16 bg-white rounded-[3rem] p-12 text-center border-2 border-primary/10 text-foreground relative overflow-hidden group hover:border-primary/30 transition-all shadow-2xl">
                    <div className="relative z-10">
                        <Flame className="h-10 w-10 text-primary mx-auto mb-6 animate-pulse fill-current" />
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">The Apex Elite League</h2>
                        <p className="text-slate-500 max-w-xl mx-auto font-medium italic leading-relaxed">&quot;Earn more points by referring friends, writing verified reviews with photos, and completing orders. Higher level members get early access to restocks.&quot;</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-12 border-t border-slate-100">
                            {[
                                { label: 'Order', pts: '5%', desc: 'of total KES' },
                                { label: 'Photo Review', pts: '50', desc: 'verified tech' },
                                { label: 'Friend Join', pts: '100', desc: 'referral' },
                                { label: 'Bag Restore', pts: '50', desc: 'limited time' },
                            ].map(benefit => (
                                <div key={benefit.label} className="space-y-1">
                                    <p className="text-primary font-black text-2xl tracking-tighter">+{benefit.pts}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{benefit.label}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{benefit.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Zap className="absolute -bottom-10 -left-10 h-64 w-64 text-primary/5 -z-0 rotate-12" />
                </div>

            </div>
        </div>
    );
}
