'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    DollarSign,
    RefreshCcw,
    Search,
    TrendingUp,
    Trophy,
    Zap,
    FileText,
    MessageSquare,
    Activity,
    ChevronRight,
    Target,
    MousePointer2,
    ArrowUpRight,
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
import { useSettings } from '@/lib/useSettings';
import Link from 'next/link';

interface Affiliate {
    id: string;
    email: string;
    full_name: string;
    referral_code: string;
    referral_clicks: number;
    total_commission_earned: number;
    loyalty_points: number;
    created_at: string;
    total_sales: number;
    order_count: number;
}

interface AffiliateOrder {
    id: number;
    total_price: number;
    referred_by_code: string | null;
    status: string;
}

export default function AdminAffiliates() {
    const { settings } = useSettings();
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [orders, setOrders] = useState<AffiliateOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRange, setFilterRange] = useState<'7d' | '30d' | 'all'>('30d');

    const fetchAffiliates = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .not('referral_code', 'is', null);

            if (pError) throw pError;

            const { data: orderData, error: oError } = await supabase
                .from('orders')
                .select('id, total_price, referred_by_code, status, created_at');

            if (oError) throw oError;
            const fetchedOrders = (orderData || []) as AffiliateOrder[];
            setOrders(fetchedOrders);

            const enriched = (profiles || []).map(p => {
                const affOrders = fetchedOrders.filter(o => o.referred_by_code === p.referral_code);
                const deliveredOrders = affOrders.filter(o => o.status === 'Delivered');

                return {
                    ...p,
                    total_sales: deliveredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
                    order_count: affOrders.length
                } as Affiliate;
            }).sort((a, b) => b.total_sales - a.total_sales);

            setAffiliates(enriched);
        } catch (err: unknown) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAffiliates();
    }, [fetchAffiliates]);

    const stats = useMemo(() => {
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

    const chartData = useMemo(() => {
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
                commission: revenue * 0.1 // Assuming 10% commission for the chart visualization
            };
        });
    }, [filterRange, orders]);

    const filteredAffiliates = affiliates.filter(a =>
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
            <RefreshCcw className="h-10 w-10 text-primary animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Scanning Affiliate Network...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Network Intelligence</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage global partners, track conversion funnels, and authorize payouts.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchAffiliates} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Records
                    </Button>
                    <Link href="/admin/payouts">
                        <Button className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all shadow-primary/20">
                            <DollarSign className="h-4 w-4 mr-2" /> Payout Queue
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partners', val: stats.activeCount, icon: Users, color: 'primary', sub: 'Verified Marketers' },
                    { label: 'Network Clicks', val: stats.totalClicks.toLocaleString(), icon: MousePointer2, color: 'primary', sub: 'Incoming Traffic' },
                    { label: 'Conversions', val: stats.totalOrders, icon: Target, color: 'primary', sub: `${stats.convRate.toFixed(1)}% Success Rate` },
                    { label: 'Network Value', val: formatPrice(stats.totalSales), icon: TrendingUp, color: 'primary', sub: 'Gross Revenue' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all cursor-pointer">
                        <div>
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-6 shadow-sm bg-primary/10 text-primary">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{item.val}</h3>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-4">{item.sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-8 rounded-[3rem] border border-slate-100 p-10 bg-white shadow-sm space-y-8 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Activity className="h-5 w-5 text-primary" /> Growth Metrics</h2>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['7d', '30d', 'all'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setFilterRange(r)}
                                    className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all", filterRange === r ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                                <Tooltip
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                    itemStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="commission" stroke="#F5A000" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[3rem] border border-slate-100 overflow-hidden bg-white shadow-sm flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Top Earners</h2>
                            <Trophy className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            {affiliates.slice(0, 5).map((aff, i) => (
                                <div key={aff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-primary/10">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-[10px] uppercase shadow-lg shadow-primary/10">
                                                {aff.full_name?.substring(0, 2) || '??'}
                                            </div>
                                            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[8px] font-black text-primary shadow-sm">
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-foreground uppercase truncate leading-none mb-1">{aff.full_name || 'Anonymous'}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{aff.order_count} Sales</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-foreground">{formatPrice(aff.total_sales)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/admin/customers" className="p-6 text-center border-t border-slate-50">
                            <button className="text-[9px] font-black uppercase text-slate-400 hover:text-primary tracking-[0.2em] transition-all flex items-center justify-center gap-2 mx-auto">
                                View Full Directory <ArrowUpRight className="h-3 w-3" />
                            </button>
                        </Link>
                    </Card>

                    <Card className="rounded-[3rem] border border-slate-100 p-8 bg-white shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-foreground uppercase tracking-tighter flex items-center gap-3"><Zap className="h-5 w-5 text-primary" /> Assets</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'IG Posters', icon: Camera, href: '/admin/media?tab=posters' },
                                { label: 'WA Banners', icon: MessageSquare, href: '/admin/media?tab=banners' },
                            ].map((asset) => (
                                <Link key={asset.label} href={asset.href}>
                                    <button className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all text-left group">
                                        <asset.icon className="h-4 w-4 mb-3 text-primary" />
                                        <p className="text-[9px] font-black uppercase text-foreground">{asset.label}</p>
                                    </button>
                                </Link>
                            ))}
                        </div>
                        <Button
                            onClick={async () => {
                                try {
                                    const { generateProductCatalog } = await import('@/lib/catalogService');
                                    const doc = await generateProductCatalog(new Date().toLocaleString('default', { month: 'long' }));
                                    doc.save('Elite_Tech_Catalog.pdf');
                                } catch (err: unknown) {
                                    const error = err as Error;
                                    alert(error.message);
                                }
                            }}
                            className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest active:scale-95 shadow-lg shadow-primary/20 hover:bg-primary/90"
                        >
                            <FileText className="h-4 w-4 mr-2" /> Download Catalog
                        </Button>
                    </Card>
                </div>
            </div>

            <div id="partner-directory-section" className="scroll-mt-24">
                <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden text-left">
                    <div className="p-8 sm:p-10 border-b border-slate-50 flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Users className="h-5 w-5" /></div>
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Partner Directory</h2>
                        </div>
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name or code..."
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold shadow-inner w-full"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Partner Identity</th>
                                    <th className="px-10 py-6 text-center">Referral Key</th>
                                    <th className="px-10 py-6 text-center">Protocol Clicks</th>
                                    <th className="px-10 py-6 text-center">Sales Payload</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAffiliates.map(aff => (
                                    <tr key={aff.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black uppercase text-[10px] shadow-lg shadow-primary/10 transition-transform group-hover:scale-110">
                                                    {aff.full_name?.substring(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <span className="font-black text-foreground uppercase text-xs tracking-tight block">{aff.full_name || 'Anonymous'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{aff.email}</span>
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
                                            <p className="font-black text-foreground">{formatPrice(aff.total_sales)}</p>
                                            <p className="text-[8px] font-black text-emerald-500 uppercase">{aff.order_count} Orders</p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    onClick={() => window.open(`https://wa.me/${settings.contact.whatsapp}`, '_blank')}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl text-slate-200 hover:text-primary hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/admin/customers/${aff.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl text-slate-200 hover:text-foreground hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
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
        </div>
    );
}
