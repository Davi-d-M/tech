'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    RefreshCcw,
    Search,
    TrendingUp,
    Trophy,
    ChevronRight,
    Target,
    MousePointer2,
    ArrowUpRight,
    ShieldCheck,
    MessageSquare,
    Zap,
    AlertCircle,
    Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
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

interface Affiliate {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    referral_code: string;
    referral_clicks: number;
    total_commission_earned: number;
    loyalty_points: number;
    created_at: string;
    total_sales: number;
    order_count: number;
    status: 'Verified' | 'Pending' | 'Flagged';
}

interface AffiliateOrder {
    id: number;
    total_price: number;
    referred_by_code: string | null;
    status: string;
    created_at: string;
}

interface PendingAffiliate {
    user_id: string;
    promo_name: string;
    social_handles: { instagram?: string; tiktok?: string; whatsapp?: string };
    profiles: { full_name: string; email: string; phone_number: string };
}

export default function AdminAffiliates() {
    const [affiliates, setAffiliates] = React.useState<Affiliate[]>([]);
    const [pendingApplications, setPendingApplications] = React.useState<PendingAffiliate[]>([]);
    const [orders, setOrders] = React.useState<AffiliateOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'overview' | 'applications'>('overview');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterRange, setFilterRange] = React.useState<'7d' | '30d' | 'all'>('30d');
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchAffiliates = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [profilesRes, orderRes, appsRes] = await Promise.all([
                supabase.from('profiles').select('*').not('referral_code', 'is', null),
                supabase.from('orders').select('id, total_price, referred_by_code, status, created_at'),
                supabase.from('affiliate_profiles').select('*, profiles(full_name, email, phone_number)').eq('status', 'Pending')
            ]);

            const fetchedOrders = (orderRes.data || []) as AffiliateOrder[];
            setOrders(fetchedOrders);
            setPendingApplications((appsRes.data || []) as unknown as PendingAffiliate[]);

            const enriched = (profilesRes.data || []).map(p => {
                const affOrders = fetchedOrders.filter(o => o.referred_by_code === p.referral_code);
                const deliveredOrders = affOrders.filter(o => o.status === 'Delivered');
                const totalSales = deliveredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

                // Fraud detection: High clicks but 0 orders
                let status: Affiliate['status'] = 'Verified';
                if (p.referral_clicks > 100 && affOrders.length === 0) status = 'Flagged';

                return {
                    ...p,
                    total_sales: totalSales,
                    order_count: affOrders.length,
                    status
                } as Affiliate;
            }).sort((a, b) => b.total_sales - a.total_sales);

            setAffiliates(enriched);
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message || "Pipeline Desync." });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAffiliates();
    }, [fetchAffiliates]);

    const handleApproveApp = async (userId: string) => {
        if (!supabase) return;
        try {
            const { error: pError } = await supabase.from('affiliate_profiles').update({ status: 'Active' }).eq('user_id', userId);
            if (pError) throw pError;

            await supabase.from('affiliate_wallets').upsert({ user_id: userId }, { onConflict: 'user_id' });

            setMessage({ type: 'success', text: "Affiliate approved and wallet initialized!" });
            fetchAffiliates();
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message });
        }
    };

    const updateAffiliateStatus = async (id: string, status: Affiliate['status']) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('profiles').update({ status_flag: status }).eq('id', id);
            if (error) throw error;
            setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            setMessage({ type: 'success', text: `Affiliate status updated to ${status}.` });
        } catch (err) {
            console.error(err);
        }
    };

    const stats = React.useMemo(() => {
        const totalSales = affiliates.reduce((sum, a) => sum + a.total_sales, 0);
        const totalClicks = affiliates.reduce((sum, a) => sum + (a.referral_clicks || 0), 0);
        const totalOrders = affiliates.reduce((sum, a) => sum + a.order_count, 0);

        return {
            totalSales,
            totalClicks,
            totalOrders,
            activeCount: affiliates.length,
            convRate: totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0
        };
    }, [affiliates]);

    const chartData = React.useMemo(() => {
        const days = filterRange === '7d' ? 7 : filterRange === '30d' ? 30 : 90;
        const now = new Date();

        return Array.from({ length: days }).map((_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - (days - i - 1));
            const dateStr = date.toISOString().split('T')[0];

            const dayOrders = orders.filter(o =>
                o.created_at?.startsWith(dateStr) &&
                o.referred_by_code &&
                o.status === 'Delivered'
            );

            const revenue = dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

            return {
                name: date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
                revenue,
                commission: revenue * 0.1
            };
        });
    }, [filterRange, orders]);

    const filteredAffiliates = affiliates.filter(a =>
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && affiliates.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <RefreshCcw className="h-10 w-10 text-primary animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing Creator Network...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Partner Economy</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Affiliate Center</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Scale your reach through authentic creator partnerships.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex mr-2">
                        <button onClick={() => setActiveTab('overview')} className={cn("px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeTab === 'overview' ? "bg-primary text-white shadow-lg" : "text-slate-400")}>Overview</button>
                        <button onClick={() => setActiveTab('applications')} className={cn("px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative", activeTab === 'applications' ? "bg-primary text-white shadow-lg" : "text-slate-400")}>
                            Applications
                            {pendingApplications.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[7px] font-black">{pendingApplications.length}</span>}
                        </button>
                    </div>
                    <Button onClick={fetchAffiliates} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-secondary">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Records
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            {activeTab === 'applications' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-black uppercase text-foreground px-4">Pending Applications</h2>
                    <div className="grid gap-6">
                        {pendingApplications.length === 0 ? (
                            <div className="p-20 text-center opacity-30">
                                <ShieldCheck size={48} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No pending applications.</p>
                            </div>
                        ) : pendingApplications.map(app => (
                            <Card key={app.user_id} className="p-8 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                                        {app.promo_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black uppercase tracking-tight leading-none">{app.promo_name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{app.profiles?.email}</p>
                                        <div className="flex gap-4 mt-3">
                                            {app.social_handles?.instagram && <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded">IG: {app.social_handles.instagram}</span>}
                                            {app.social_handles?.tiktok && <span className="text-[8px] font-black uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded">TT: {app.social_handles.tiktok}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={() => handleApproveApp(app.user_id)} className="h-12 px-8 rounded-xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Approve</Button>
                                    <Button variant="outline" className="h-12 px-8 rounded-xl border-rose-100 text-rose-500 font-black uppercase text-[10px]">Reject</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Partners', val: stats.activeCount, icon: Users, color: 'indigo', sub: 'Verified Marketers' },
                            { label: 'Network Clicks', val: stats.totalClicks.toLocaleString(), icon: MousePointer2, color: 'primary', sub: 'Incoming Traffic' },
                            { label: 'Conversions', val: stats.totalOrders, icon: Target, color: 'emerald', sub: `${stats.convRate.toFixed(1)}% Success Rate` },
                            { label: 'Network Value', val: formatPrice(stats.totalSales), icon: TrendingUp, color: 'primary', sub: 'Gross Revenue' },
                        ].map((item) => (
                            <Card key={item.label} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                        item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                        item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                        "bg-primary/10 text-primary"
                                    )}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-4">{item.sub}</p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-10 items-stretch mt-10">
                        <Card className="lg:col-span-8 rounded-[3.5rem] border border-border p-10 bg-card shadow-sm flex flex-col min-h-[500px]">
                            <div className="flex justify-between items-center mb-12">
                                <div className="text-left">
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">Yield Dynamics</h2>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Revenue generated by network</p>
                                </div>
                                <div className="flex bg-secondary p-1 rounded-xl border border-border">
                                    {(['7d', '30d', 'all'] as const).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterRange(r)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                                filterRange === r ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 w-full min-h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: 'currentColor'}} className="text-muted-foreground" />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: 'currentColor'}} className="text-muted-foreground" />
                                        <Tooltip
                                            contentStyle={{backgroundColor: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}}
                                            itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                        <Area type="monotone" dataKey="commission" stroke="currentColor" strokeWidth={2} fill="transparent" className="text-foreground" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="lg:col-span-4 flex flex-col gap-10">
                            <Card className="rounded-[3rem] border border-border overflow-hidden bg-card shadow-sm flex flex-col h-full min-h-[300px]">
                                <div className="p-8 border-b border-border flex items-center justify-between">
                                    <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Elite Partners</h2>
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                                    {affiliates.slice(0, 5).map((aff, i) => (
                                        <div key={aff.id} className="flex items-center justify-between p-5 bg-secondary rounded-[2rem] group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-primary/10">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-[10px] uppercase shadow-lg shadow-primary/10 transition-transform group-hover:rotate-6">
                                                        {aff.full_name?.substring(0, 2) || '??'}
                                                    </div>
                                                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white border border-border flex items-center justify-center text-[8px] font-black text-primary shadow-sm">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="text-[11px] font-black text-foreground uppercase truncate leading-none mb-1">{aff.full_name || 'Anonymous'}</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{aff.order_count} Deliveries</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-foreground">{formatPrice(aff.total_sales)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/admin/customers" className="p-6 text-center border-t border-border mt-auto">
                                    <button className="text-[9px] font-black uppercase text-muted-foreground hover:text-primary tracking-[0.2em] transition-all flex items-center justify-center gap-2 mx-auto">
                                        View Full Directory <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                </Link>
                            </Card>

                            <Card className="rounded-[3rem] border border-border p-8 bg-card shadow-sm space-y-6 flex flex-col justify-center">
                                <h2 className="text-lg font-black text-foreground uppercase tracking-tighter flex items-center gap-3"><Zap className="h-5 w-5 text-primary fill-current" /> Asset Center</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/admin/media?tab=posters" className="flex-1">
                                        <button className="w-full p-4 rounded-2xl bg-secondary border border-border hover:bg-white hover:shadow-lg transition-all text-left group">
                                            <Camera className="h-4 w-4 mb-3 text-primary" />
                                            <p className="text-[9px] font-black uppercase text-foreground">Posters</p>
                                        </button>
                                    </Link>
                                    <Link href="/admin/media?tab=banners" className="flex-1">
                                        <button className="w-full p-4 rounded-2xl bg-secondary border border-border hover:bg-white hover:shadow-lg transition-all text-left group">
                                            <MessageSquare className="h-4 w-4 mb-3 text-primary" />
                                            <p className="text-[9px] font-black uppercase text-foreground">Banners</p>
                                        </button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div id="partner-directory-section" className="scroll-mt-24 mt-10">
                        <Card className="rounded-[3.5rem] border border-border bg-card shadow-sm overflow-hidden text-left">
                            <div className="p-10 border-b border-border flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-center">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Target className="h-5 w-5" /></div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Partner Directory</h2>
                                </div>
                                <div className="relative w-full lg:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or code..."
                                        className="h-14 rounded-2xl bg-secondary border-border pl-12 text-sm font-bold shadow-inner w-full"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                            <th className="px-10 py-6">Identity</th>
                                            <th className="px-10 py-6 text-center">Referral Key</th>
                                            <th className="px-10 py-6 text-center">Clicks</th>
                                            <th className="px-10 py-6 text-center">Status</th>
                                            <th className="px-10 py-6 text-center">Total Sales</th>
                                            <th className="px-10 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAffiliates.map(aff => (
                                            <tr key={aff.id} className="hover:bg-primary/5 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black uppercase text-[10px] shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 shrink-0">
                                                            {aff.full_name?.substring(0, 2) || '??'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-black text-foreground uppercase text-xs tracking-tight block truncate">{aff.full_name || 'Anonymous'}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 block truncate">{aff.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className="font-mono text-[10px] font-black text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                                        {aff.referral_code}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center font-black text-foreground">{aff.referral_clicks?.toLocaleString() || 0}</td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                        aff.status === 'Verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        aff.status === 'Flagged' ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" :
                                                        "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {aff.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <p className="font-black text-foreground text-sm">{formatPrice(aff.total_sales)}</p>
                                                    <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">{aff.order_count} Orders</p>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            onClick={() => window.open(`https://wa.me/${aff.phone_number}`, '_blank')}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:text-primary hover:bg-white transition-all shadow-sm"
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                const status = aff.status === 'Verified' ? 'Flagged' : 'Verified';
                                                                updateAffiliateStatus(aff.id, status);
                                                            }}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:text-amber-500 hover:bg-white transition-all shadow-sm"
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </Button>
                                                        <Link href={`/admin/customers/${aff.phone_number}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-xl hover:text-foreground hover:bg-white transition-all shadow-sm"
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
