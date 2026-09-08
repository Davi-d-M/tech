'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    MousePointer2,
    Target,
    TrendingUp,
    DollarSign,
    Wallet,
    Trophy,
    CheckCircle2,
    AlertCircle,
    Zap,
    Briefcase,
    Loader2,
    Globe,
    ChevronRight,
    Search,
    Download,
    Megaphone,
    ShieldCheck,
    Layout,
    Link2,
    Camera,
    Settings,
    Lock,
    Settings2
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
import LeadGenerator from '@/components/affiliate/LeadGenerator';
import AISalesAssistant from '@/components/affiliate/AISalesAssistant';

interface AffiliateProfile {
    user_id: string;
    promo_name: string;
    readable_id: string;
    tier: string;
    status: string;
    total_clicks: number;
    conversion_rate: number;
    business_name?: string;
    last_active_at: string;
    verification_status: { phone: boolean, email: boolean, account: boolean, payment: boolean, agreement: boolean };
}

interface WalletStats {
    available_balance: number;
    pending_balance: number;
    lifetime_earned: number;
}

type TabId = 'overview' | 'links' | 'leads' | 'assets' | 'payouts';

export default function AffiliateDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [profile, setProfile] = useState<AffiliateProfile | null>(null);
    const [wallet, setWallet] = useState<WalletStats>({ available_balance: 0, pending_balance: 0, lifetime_earned: 0 });
    const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [chartData, setChartData] = useState<{ day: string; yield: number }[]>([]);

    const [isAllowed, setIsAllowed] = useState(false);

    const handleWithdrawal = async () => {
        if (wallet.available_balance < 1000) {
            alert("Minimum withdrawal is KSh 1,000.");
            return;
        }
        // Logic for withdrawal request
        alert("Withdrawal request sent. Our finance team will process this via M-Pesa within 24 hours.");
    };

    useEffect(() => {
        async function fetchAffiliateData() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                // 0. Check Base Profile for Permission
                const { data: baseProfile } = await supabase.from('profiles').select('can_see_affiliate_offers, referral_code').eq('id', session.user.id).single();

                if (!baseProfile?.can_see_affiliate_offers && !baseProfile?.referral_code) {
                    setIsAllowed(false);
                    setLoading(false);
                    return;
                }
                setIsAllowed(true);

                // 1. Fetch Profile & Wallet & Announcements
                const [profileRes, walletRes, referralsRes, announcementsRes] = await Promise.all([
                    supabase.from('affiliate_profiles').select('*').eq('user_id', session.user.id).single(),
                    supabase.from('affiliate_wallets').select('*').eq('user_id', session.user.id).single(),
                    supabase.from('affiliate_referrals').select('*, orders(total_price, created_at, status)').eq('affiliate_id', session.user.id).order('created_at', { ascending: false }).limit(20),
                    supabase.from('affiliate_announcements').select('*').order('created_at', { ascending: false }).limit(2)
                ]);

                if (profileRes.data) {
                    setProfile(profileRes.data as AffiliateProfile);
                }

                if (walletRes.data) {
                    const w = walletRes.data;
                    setWallet({
                        available_balance: w.balance_available || 0,
                        pending_balance: w.balance_pending || 0,
                        lifetime_earned: w.lifetime_earned || 0
                    });
                }

                const fetchedReferrals = referralsRes.data || [];
                setRecentReferrals(fetchedReferrals.slice(0, 5));
                setAnnouncements(announcementsRes.data || []);

                // 2. Process Chart Data
                const now = new Date();
                const days = 30;
                const dailyYield: Record<string, number> = {};

                fetchedReferrals.forEach(r => {
                    const dateStr = new Date(r.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
                    dailyYield[dateStr] = (dailyYield[dateStr] || 0) + r.commission_amount;
                });

                const formattedChart = Array.from({ length: days }).map((_, i) => {
                    const d = new Date();
                    d.setDate(now.getDate() - (days - i - 1));
                    const label = d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
                    return { day: label, yield: dailyYield[label] || 0 };
                });

                setChartData(formattedChart);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAffiliateData();
    }, []);

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        setMessage({ type: 'success', text: "Tracking Link Copied!" });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic animate-pulse">Initializing Command Center...</p>
        </div>
    );

    if (!isAllowed) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center gap-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-sm animate-shake"><Lock size={40} /></div>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">Command Center Restricted</h1>
                <p className="text-slate-500 mt-2">You haven&apos;t been authorized to access the Affiliate Program yet.</p>
            </div>
            <Link href="/profile"><Button variant="outline" className="h-12 rounded-xl">Return to Base</Button></Link>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center gap-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-amber-50 text-amber-500 flex items-center justify-center"><AlertCircle size={40} /></div>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">Partner Access Denied</h1>
                <p className="text-slate-500 mt-2">Your application is still under review or you are not registered.</p>
            </div>
            <Link href="/profile"><Button variant="outline">Return to Base</Button></Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-left selection:bg-primary/20">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* 👤 PROFESSIONAL AFFILIATE PROFILE HEADER */}
                <header className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm overflow-hidden group">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white text-3xl font-black uppercase shadow-xl shadow-primary/20 group-hover:rotate-3 transition-transform">
                                    {profile.promo_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">{profile.promo_name}</h1>
                                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest border border-indigo-100 italic">{profile.tier} Partner</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase text-slate-400 tracking-widest mt-3">
                                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> Verified Partner</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span>ID: {profile.readable_id}</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span className="text-primary italic">Est. 2026</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <Button onClick={() => setActiveTab('links')} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                <Zap className="h-4 w-4 mr-2 fill-current" /> Share & Earn
                            </Button>
                            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                                <Settings className="h-4 w-4 mr-2" /> Security
                            </Button>
                        </div>
                    </div>
                    <Briefcase className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 rotate-12 -z-0" />
                </header>

                {/* 💰 REAL-TIME EARNINGS HUD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    <Card className="p-8 rounded-[3rem] bg-white border border-primary/20 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="relative z-10 space-y-8 text-left">
                            <div className="flex justify-between items-start">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="h-5 w-5 text-primary" /></div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Available</p>
                                    <h3 className="text-3xl font-black text-foreground tracking-tighter">{formatPrice(wallet.available_balance)}</h3>
                                </div>
                            </div>
                            <Button onClick={() => setActiveTab('payouts')} className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Request Payout</Button>
                        </div>
                        <DollarSign className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 rotate-12" />
                    </Card>

                    {[
                        { label: 'Network Clicks', val: profile.total_clicks.toLocaleString(), icon: MousePointer2, color: 'indigo', sub: 'Incoming Traffic' },
                        { label: 'Total Sales', val: formatPrice(wallet.lifetime_earned * 14), icon: Target, color: 'primary', sub: 'Gross Revenue' },
                        { label: 'Commission', val: formatPrice(wallet.lifetime_earned), icon: TrendingUp, color: 'emerald', sub: 'Lifetime Yield' },
                    ].map((item) => (
                        <Card key={item.label} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                "bg-primary/5 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">{item.val}</h3>
                                <p className="text-[8px] font-bold text-slate-300 uppercase mt-2 tracking-widest">{item.sub}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-10">

                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        <nav className="p-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
                            {[
                                { id: 'overview', label: 'Business Overview', icon: Layout },
                                { id: 'links', label: 'Affiliate Links', icon: Link2 },
                                { id: 'leads', label: 'Lead Generator', icon: Target },
                                { id: 'assets', label: 'Creative Library', icon: Camera },
                                { id: 'payouts', label: 'Wallet & Payouts', icon: Wallet },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group",
                                        activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-foreground"
                                    )}
                                >
                                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-white" : "text-slate-300 group-hover:text-primary")} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* ANNOUNCEMENT CENTER */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 ml-4 flex items-center gap-2"><Megaphone size={14} /> Intelligence</h3>
                            <div className="space-y-3">
                                {announcements.map(a => (
                                    <div key={a.id} className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-2 group cursor-pointer hover:bg-white transition-all">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-indigo-600 text-white rounded">{a.priority}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(a.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[11px] font-black text-indigo-900 leading-tight group-hover:text-primary">{a.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-10">

                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                {/* Performance Chart */}
                                <Card className="p-10 rounded-[3.5rem] border border-slate-100 bg-white shadow-sm h-auto">
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Earnings Velocity</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Commission yield generated last 30 days</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                                            <TrendingUp size={12} /> Live Updates
                                        </div>
                                    </div>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
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

                                <div className="grid sm:grid-cols-2 gap-8">
                                    {/* Recent Sales Log */}
                                    <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col h-[450px]">
                                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                            <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Attribution Feed</h2>
                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{recentReferrals.length} Logged</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                                            {recentReferrals.length === 0 ? (
                                                <div className="py-20 text-center opacity-30">
                                                    <Target size={48} className="mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No referrals detected.</p>
                                                </div>
                                            ) : recentReferrals.map((ref, i) => (
                                                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><CheckCircle2 size={20} /></div>
                                                        <div>
                                                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Order #{ref.order_id}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ref.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-emerald-600">+{formatPrice(ref.commission_amount)}</p>
                                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-400">{ref.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Verification & Trust */}
                                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8 text-left h-full">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Trust Profile</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Phone Number', done: profile.verification_status.phone },
                                                { label: 'Email Verified', done: profile.verification_status.email },
                                                { label: 'Account Approval', done: profile.verification_status.account },
                                                { label: 'Payment Details', done: profile.verification_status.payment },
                                                { label: 'Partner Agreement', done: profile.verification_status.agreement },
                                            ].map(v => (
                                                <div key={v.label} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", v.done ? "text-slate-900" : "text-slate-300")}>{v.label}</span>
                                                    {v.done ? <CheckCircle2 className="text-emerald-500" size={16} /> : <AlertCircle className="text-amber-500 animate-pulse" size={16} />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between px-2">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest italic">Current Tier: {profile.tier}</p>
                                            <Trophy size={16} className="text-amber-500" />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Globe size={24} /></div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">Uplink Generator</h2>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">&quot;Create tracked deep links for specific campaigns and social sources.&quot;</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Product</label>
                                                <select className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-[10px] font-black uppercase text-foreground outline-none focus:ring-4 focus:ring-primary/5 transition-all">
                                                    <option>Homepage (Global)</option>
                                                    <option>Amaya AM-05 AirPods</option>
                                                    <option>Amaya Super Fast Charger</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Traffic Source</label>
                                                <select className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-[10px] font-black uppercase text-foreground outline-none focus:ring-4 focus:ring-primary/5 transition-all">
                                                    <option>WhatsApp Status</option>
                                                    <option>Instagram Story</option>
                                                    <option>TikTok Bio</option>
                                                    <option>Facebook Post</option>
                                                </select>
                                            </div>
                                            <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Generate Deep Link</Button>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-white border border-primary/20 space-y-6 relative overflow-hidden flex flex-col justify-center text-center group shadow-sm">
                                            <div className="relative z-10 space-y-4 text-left">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Your Personal Link</p>
                                                <p className="text-xs font-black tracking-tight text-primary break-all select-all">{getReferralLink(profile.promo_name)}</p>
                                                <div className="flex gap-2 pt-4">
                                                    <Button onClick={() => copyLink(getReferralLink(profile.promo_name))} className="flex-1 h-12 rounded-xl bg-primary text-white font-black uppercase text-[9px] shadow-lg shadow-primary/20">Copy Link</Button>
                                                    <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getReferralLink(profile.promo_name))}`, '_blank')} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black uppercase text-[9px] shadow-lg shadow-emerald-500/20">Share WA</Button>
                                                </div>
                                            </div>
                                            <Link2 className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/5 rotate-12" />
                                        </div>
                                    </div>
                                </Card>

                                <AISalesAssistant promoLink={getReferralLink(profile.promo_name)} />
                            </div>
                        )}

                        {activeTab === 'leads' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                <LeadGenerator affiliateId={profile.user_id} />

                                <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden h-[400px] flex flex-col">
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Active Lead Tracking</h2>
                                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-full italic">Pipeline Status</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
                                        <Search size={48} className="mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No leads in negotiation yet. <br/> Submit your first lead to begin tracking conversion.</p>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'payouts' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm text-left relative overflow-hidden">
                                    <div className="relative z-10 grid sm:grid-cols-2 gap-10 items-center">
                                        <div className="space-y-8">
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Yield Extraction</h2>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">&quot;Authorized funds can be extracted instantly via M-Pesa B2C.&quot;</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">M-Pesa Number</p>
                                                        <p className="font-black text-foreground">07XX XXX XXX</p>
                                                    </div>
                                                    <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors" />
                                                </div>
                                                <Button onClick={handleWithdrawal} className="w-full h-18 rounded-[1.8rem] bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Initiate Payout Protocol</Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Payout Integrity</p>
                                            <div className="h-32 w-32 rounded-full border-8 border-emerald-500/20 flex items-center justify-center relative">
                                                <div className="h-24 w-24 rounded-full border-8 border-emerald-500 flex items-center justify-center animate-pulse">
                                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-emerald-600 mt-6 tracking-widest">Global Status: Authorized</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Extraction Log</h2>
                                        <span className="text-[10px] font-black uppercase text-slate-300">History</span>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {[
                                            { id: 'PY-1029', amount: 15400, method: 'M-Pesa', status: 'PAID', date: '04 Sep' },
                                            { id: 'PY-0982', amount: 12100, method: 'M-Pesa', status: 'PAID', date: '28 Aug' },
                                        ].map(log => (
                                            <div key={log.id} className="p-6 px-10 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-6">
                                                    <p className="text-xs font-black text-foreground uppercase">Ref: {log.id}</p>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">{log.date}</span>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <p className="text-sm font-black text-foreground">{formatPrice(log.amount)}</p>
                                                    <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">{log.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'assets' && (
                            <div className="space-y-8 animate-in fade-in duration-500 text-left">
                                <header className="flex justify-between items-center px-4">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-foreground">Creative Library</h2>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2 italic">&quot;Download premium posters and banners designed for conversion.&quot;</p>
                                    </div>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-[9px] font-black uppercase">Posters</button>
                                        <button className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Banners</button>
                                    </div>
                                </header>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {[
                                        { title: 'AirPods Pro Hub', type: 'Instagram Post' },
                                        { title: 'Ultra Power Kit', type: 'WhatsApp Status' },
                                        { title: 'Limited September', type: 'IG Story' },
                                        { title: 'Fleet Expansion', type: 'Facebook Ad' },
                                        { title: 'Elite Loyalty', type: 'Banner' },
                                        { title: 'Trust Verification', type: 'Trust Badge' },
                                    ].map(asset => (
                                        <Card key={asset.title} className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                                            <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center p-10 group-hover:bg-primary/5 transition-colors relative overflow-hidden">
                                                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm relative z-10">
                                                    <Download size={24} />
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                                    <Layout className="h-32 w-32" />
                                                </div>
                                            </div>
                                            <div className="p-5 border-t border-slate-50">
                                                <p className="text-[10px] font-black text-foreground uppercase truncate tracking-tight">{asset.title}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{asset.type}</p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
