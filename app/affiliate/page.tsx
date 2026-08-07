'use client';

import { useState, useEffect } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    DollarSign,
    MousePointer2,
    Target,
    Zap,
    ShieldCheck,
    Loader2,
    Copy,
    CheckCircle2,
    History,
    MessageSquare,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import { useSettings } from '@/lib/useSettings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AffiliateDashboard() {
    const { settings } = useSettings();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
    const [stats, setStats] = useState({ clicks: 0, conversions: 0, earnings: 0 });
    // const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setSent] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/auth?mode=signin&redirect=/affiliate');
                return;
            }

            setUser(session.user);

            // 1. Get Profile Stats
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);

                // 2. Fetch Conversions from Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_price')
                    .eq('referred_by_code', profileData.referral_code);

                const conversions = orders?.length || 0;
                const totalSalesValue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
                const earnings = totalSalesValue * 0.05; // 5% Standard Commission

                setStats({
                    clicks: profileData.referral_clicks || 0,
                    conversions,
                    earnings
                });
            }

            setLoading(false);
        }
        loadData();
    }, [router]);

    const referralUrl = profile ? `${window.location.origin}/shop?ref=${profile.referral_code}` : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralUrl);
        setSent(true);
        setTimeout(() => setSent(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Accessing Affiliate Hub...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-6xl mx-auto">

                <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-12">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>

                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 mb-4">
                            <Target className="h-3 w-3" /> Growth Partner
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">Affiliate <br/> <span className="text-primary italic">Command Center</span></h1>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Marketer</p>
                            <p className="text-xs font-bold text-foreground uppercase truncate max-w-[120px]">{(profile?.full_name as string) || user?.email?.split('@')[0]}</p>
                        </div>
                    </div>
                </header>

                {/* Main Link Section (Light Rebrand) */}
                <section className="mb-12 bg-white rounded-[3rem] p-8 sm:p-16 text-foreground relative overflow-hidden shadow-sm border-2 border-primary/5">
                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center text-left">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Your Unique <br/> <span className="text-primary italic">Rocket Link</span></h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed italic">
                                Share this link with your audience. Every purchase they make earns you <span className="text-primary font-black text-2xl ml-1">5% Commission</span> instantly.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-mono text-sm text-primary truncate select-all shadow-inner">
                                    {referralUrl}
                                </div>
                                <Button
                                    onClick={handleCopyLink}
                                    className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/90 transition-all shrink-0 active:scale-95 shadow-primary/20"
                                >
                                    {copied ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Link</>}
                                </Button>
                            </div>
                        </div>
                        <div className="hidden lg:flex justify-center">
                            <div className="h-48 w-48 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                                <Zap className="h-20 w-20 text-primary fill-current" />
                            </div>
                        </div>
                    </div>
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: 'Live Clicks', val: stats.clicks.toLocaleString(), icon: MousePointer2, color: 'indigo', meta: 'Total Traffic' },
                        { label: 'Conversions', val: stats.conversions, icon: Target, color: 'emerald', meta: 'Success Rate' },
                        { label: 'Earnings', val: formatPrice(stats.earnings), icon: DollarSign, color: 'primary', meta: 'Wallet Balance' },
                    ].map((item) => (
                        <div key={item.label} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110",
                                item.color === 'primary' ? 'bg-primary/10 text-primary' : `bg-${item.color}-50 text-${item.color}-600`
                            )}>
                                <item.icon className="h-7 w-7" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                            <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                            <p className="text-[9px] font-black text-slate-300 uppercase mt-4 tracking-widest">{item.meta}</p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Recent Payouts */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
                            <History className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Payout History</h2>
                        </div>
                        <div className="p-12 text-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                                <DollarSign className="h-8 w-8" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No payouts processed yet.</p>
                            <p className="text-[9px] text-slate-300 uppercase mt-2">Minimum payout: Ksh 1,000</p>
                        </div>
                    </div>

                    {/* Partner Support */}
                    <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-10 text-foreground relative overflow-hidden shadow-inner">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Partner Support</h2>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed italic">&quot;Need custom creative assets or have a large-scale collaboration proposal? Let&apos;s talk strategy.&quot;</p>

                            <Button
                                onClick={() => window.open(`https://wa.me/${settings.contact.whatsapp}`, '_blank')}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp {settings.branding.owner_name.split(' ')[0]} Direct
                            </Button>
                        </div>
                        <ShieldCheck className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 rotate-12" />
                    </div>
                </div>

            </div>
        </div>
    );
}
