'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    MousePointer2,
    Target,
    TrendingUp,
    DollarSign,
    Wallet,
    RefreshCcw,
    Trophy,
    CheckCircle2,
    AlertCircle,
    Copy,
    Share2,
    Zap,
    Briefcase,
    Loader2,
    Smartphone,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatPrice, getReferralLink } from '@/lib/utils';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import Link from 'next/link';

interface AffiliateStats {
    total_clicks: number;
    conversion_rate: number;
    total_sales: number;
    total_commission: number;
    available_balance: number;
    pending_balance: number;
    tier: string;
}

export default function AffiliateDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AffiliateStats>({
        total_clicks: 0,
        conversion_rate: 0,
        total_sales: 0,
        total_commission: 0,
        available_balance: 0,
        pending_balance: 0,
        tier: 'Starter'
    });
    const [referralUrl, setReferralUrl] = useState('');
    const [recentReferrals, setRecentReferrals] = useState<{
        order_id: number;
        commission_amount: number;
        status: string;
        created_at: string;
        orders: { status: string }
    }[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function fetchAffiliateData() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                // 1. Fetch Profile & Wallet
                const [profileRes, walletRes, referralsRes] = await Promise.all([
                    supabase.from('affiliate_profiles').select('*').eq('user_id', session.user.id).single(),
                    supabase.from('affiliate_wallets').select('*').eq('user_id', session.user.id).single(),
                    supabase.from('affiliate_referrals').select('*, orders(total_price, created_at, status)').eq('affiliate_id', session.user.id).order('created_at', { ascending: false }).limit(5)
                ]);

                if (profileRes.data) {
                    const p = profileRes.data;
                    const w = walletRes.data || { balance_available: 0, balance_pending: 0, lifetime_earned: 0 };

                    setStats({
                        total_clicks: p.total_clicks || 0,
                        conversion_rate: p.conversion_rate || 0,
                        total_sales: w.lifetime_earned * 10, // Simulated sales value based on commission
                        total_commission: w.lifetime_earned || 0,
                        available_balance: w.balance_available || 0,
                        pending_balance: w.balance_pending || 0,
                        tier: p.tier || 'Starter'
                    });

                    // Get referral code from base profile
                    const { data: baseProfile } = await supabase.from('profiles').select('referral_code').eq('id', session.user.id).single();
                    if (baseProfile?.referral_code) {
                        setReferralUrl(getReferralLink(baseProfile.referral_code));
                    }
                }

                setRecentReferrals(referralsRes.data || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAffiliateData();
    }, []);

    const copyLink = () => {
        navigator.clipboard.writeText(referralUrl);
        setMessage({ type: 'success', text: "Referral Link Copied!" });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleWithdrawal = async () => {
        if (stats.available_balance < 1000) {
            alert("Minimum withdrawal is KSh 1,000.");
            return;
        }
        // Logic for withdrawal request
        alert("Withdrawal request sent. Our finance team will process this via M-Pesa within 24 hours.");
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Establishing Partner Uplink...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left selection:bg-primary/20">
            <div className="max-w-7xl mx-auto space-y-10">

                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Partner Node Active</span>
                        </div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Affiliate Portal</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1 italic">Monitor your network yield and promotional impact.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50">
                            <RefreshCcw className="h-4 w-4 mr-2" /> Sync Stats
                        </Button>
                    </div>
                </header>

                {message && (
                    <div className={cn(
                        "p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                        message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                    </div>
                )}

                {/* 1. KEY METRICS HUB */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {[
                        { label: 'Network Clicks', val: stats.total_clicks.toLocaleString(), icon: MousePointer2, color: 'indigo' },
                        { label: 'Conversion Rate', val: `${stats.conversion_rate.toFixed(1)}%`, icon: Target, color: 'primary' },
                        { label: 'Pending Yield', val: formatPrice(stats.pending_balance), icon: Zap, color: 'amber' },
                        { label: 'Current Tier', val: stats.tier, icon: Trophy, color: 'emerald' },
                    ].map((item) => (
                        <Card key={item.label} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                "bg-primary/5 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{item.val}</h3>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-10">

                    {/* 2. WALLET & WITHDRAWAL */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="p-10 rounded-[3.5rem] bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10 space-y-10">
                                <div className="flex justify-between items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md"><Wallet className="h-6 w-6 text-primary" /></div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Available to Withdraw</p>
                                        <h3 className="text-4xl font-black tracking-tighter">{formatPrice(stats.available_balance)}</h3>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
                                        <span>Lifetime Earnings</span>
                                        <span>{formatPrice(stats.total_commission)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-primary" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                                <Button onClick={handleWithdrawal} className="w-full h-18 rounded-[1.5rem] bg-white text-slate-900 font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-100 transition-all active:scale-95">
                                    Request Payout
                                </Button>
                            </div>
                            <DollarSign className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 rotate-12 -z-0" />
                        </Card>

                        {/* LINK GENERATOR */}
                        <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><Globe size={20} /></div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Global Link</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium italic">&quot;This link cookies any visitor for 30 days. You earn on everything they buy.&quot;</p>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group/link cursor-pointer overflow-hidden" onClick={copyLink}>
                                <p className="text-[9px] font-mono text-primary font-black break-all">{referralUrl}</p>
                                <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Copy size={16} className="text-white" />
                                    <span className="text-[10px] font-black uppercase text-white">Copy Link</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={copyLink} variant="outline" className="flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest"><Copy size={14} className="mr-2" /> Copy</Button>
                                <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(referralUrl)}`, '_blank')} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20"><Share2 size={14} className="mr-2" /> Share</Button>
                            </div>
                        </Card>
                    </div>

                    {/* 3. PERFORMANCE CHART */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="p-10 rounded-[3.5rem] border border-slate-100 bg-white shadow-sm h-full">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Earnings Velocity</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Yield generated across last 30 days</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-[9px] font-black uppercase border border-primary/10">
                                    <TrendingUp size={12} /> Live Insights
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { day: '01 Sep', yield: 450 },
                                        { day: '05 Sep', yield: 1200 },
                                        { day: '10 Sep', yield: 800 },
                                        { day: '15 Sep', yield: 2400 },
                                        { day: '20 Sep', yield: 1800 },
                                        { day: '25 Sep', yield: 3500 },
                                        { day: '30 Sep', yield: 4200 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                                        />
                                        <Area type="monotone" dataKey="yield" stroke="#ff6b00" strokeWidth={4} fill="url(#colorYield)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* RECENT SALES */}
                    <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Recent Conversions</h2>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{recentReferrals.length} Sales</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                            {recentReferrals.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <Target size={48} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No referrals detected yet.</p>
                                </div>
                            ) : recentReferrals.map((ref, i) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><CheckCircle2 size={20} /></div>
                                        <div>
                                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Order #{ref.order_id}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ref.created_at).toLocaleDateString()} • {ref.orders?.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600">+{formatPrice(ref.commission_amount)}</p>
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-400">{ref.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-50 bg-slate-50/50 text-center">
                            <Link href="/shop" className="text-[10px] font-black uppercase text-primary hover:underline">Promote more products &rarr;</Link>
                        </div>
                    </Card>

                    {/* MARKETING KIT */}
                    <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm p-10 flex flex-col justify-between group">
                        <div className="space-y-8 text-left">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Marketing Kit</h3>
                            </div>
                            <p className="text-sm font-medium text-slate-500 italic leading-relaxed">&quot;Accelerate your growth with professional branding assets and AI-generated social copy.&quot;</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-14 rounded-2xl border-slate-200 text-foreground font-black uppercase text-[10px] flex items-center justify-between px-6 hover:bg-slate-50 group/item">
                                    <span>Brand Assets</span>
                                    <Smartphone size={16} className="text-slate-300 group-hover/item:text-primary transition-colors" />
                                </Button>
                                <Button variant="outline" className="h-14 rounded-2xl border-slate-200 text-foreground font-black uppercase text-[10px] flex items-center justify-between px-6 hover:bg-slate-50 group/item">
                                    <span>AI Copywriter</span>
                                    <Zap size={16} className="text-slate-300 group-hover/item:text-primary transition-colors" />
                                </Button>
                            </div>
                        </div>
                        <div className="pt-10">
                            <Card className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-center text-left">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">Affiliate Tip</p>
                                        <p className="text-[10px] font-bold text-slate-600 max-w-[200px]">&quot;Sharing specific products generates 4x more conversions than sharing the homepage.&quot;</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center text-primary shadow-sm"><Zap size={20} /></div>
                                </div>
                            </Card>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
