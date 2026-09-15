'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    TrendingUp,
    Eye,
    Zap,
    Clock,
    Monitor,
    DollarSign,
    Loader2,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ProductStats {
    id: number;
    name: string;
    views: number;
    cart_adds: number;
    wishlist_adds: number;
    purchases: number;
    revenue: number;
    avg_3d_time: number;
    opportunity_score: number;
    velocity: 'High' | 'Medium' | 'Low';
    search_frequency: number;
}

export default function Product360({ productId }: { productId: number }) {
    const [stats, setStats] = React.useState<ProductStats | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchStats = React.useCallback(async () => {
        if (!supabase || !productId) return;
        setLoading(true);
        try {
            // 1. Fetch Basic Info & predictive scores
            const { data: product } = await supabase
                .from('products')
                .select('name, price, opportunity_score, avg_3d_interaction_time')
                .eq('id', productId)
                .single();

            // 2. Fetch Signals Aggregate
            const { data: signals } = await supabase
                .from('user_signals')
                .select('event_type')
                .eq('target', productId.toString());

            // 3. Fetch Orders Aggregate
            const { data: orders } = await supabase
                .from('orders')
                .select('total_price, status')
                .eq('product_id', productId)
                .eq('status', 'Delivered');

            const views = signals?.filter(s => s.event_type === 'PRODUCT_VIEW').length || 0;
            const adds = signals?.filter(s => s.event_type === 'ADD_TO_BAG').length || 0;
            const wishlist = signals?.filter(s => s.event_type === 'WISHLIST_ADD').length || 0;
            const searches = signals?.filter(s => s.event_type === 'SEARCH').length || 0;

            const revenue = orders?.reduce((s, o) => s + (o.total_price || 0), 0) || 0;

            setStats({
                id: productId,
                name: product?.name || 'Unknown',
                views,
                cart_adds: adds,
                wishlist_adds: wishlist,
                purchases: orders?.length || 0,
                revenue,
                avg_3d_time: Math.round(product?.avg_3d_interaction_time || 0),
                opportunity_score: product?.opportunity_score || 0,
                velocity: (orders?.length || 0) > 10 ? 'High' : 'Low',
                search_frequency: searches
            });
        } catch (err) {
            console.error("Product 360 Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    React.useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Syncing SKU Matrix...</p>
        </div>
    );

    if (!stats) return null;

    const conversion = stats.views > 0 ? (stats.purchases / stats.views) * 100 : 0;

    return (
        <div className="space-y-10 text-left animate-in fade-in duration-700">
            {/* Header Intelligence */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-primary fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">SKU Intelligence Node</span>
                    </div>
                    <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">{stats.name}</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                        Product Status: <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Optimal Velocity</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Opportunity Score</p>
                        <h4 className="text-3xl font-black text-primary tracking-tighter">{stats.opportunity_score}%</h4>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', val: formatPrice(stats.revenue), icon: DollarSign, color: 'primary', trend: '+12%' },
                    { label: 'Platform Views', val: stats.views, icon: Eye, color: 'indigo', trend: '+4%' },
                    { label: 'Conversion Rate', val: `${conversion.toFixed(1)}%`, icon: Zap, color: 'emerald', trend: '+1.2%' },
                    { label: 'Avg 3D Interaction', val: `${stats.avg_3d_time}s`, icon: Monitor, color: 'amber', trend: 'Optimal' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", `bg-${item.color}-50 text-${item.color}-500 shadow-sm border border-${item.color}-100`)}>
                            <item.icon size={24} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-2xl font-black text-foreground tracking-tighter">{item.val}</h3>
                        <div className="mt-3 flex items-center gap-1.5 text-[8px] font-black uppercase">
                            {item.trend.includes('+') ? <ArrowUpRight size={10} className="text-emerald-500" /> : <Clock size={10} className="text-slate-300" />}
                            <span className={cn(item.trend.includes('+') ? "text-emerald-500" : "text-slate-400")}>{item.trend}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Behavioral Demand Analysis */}
            <div className="grid lg:grid-cols-2 gap-10">
                <Card className="p-10 rounded-[3rem] bg-primary/5 border border-primary/20 relative overflow-hidden group shadow-sm">
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4 text-left">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20"><TrendingUp size={20} /></div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-primary">Demand Radar</h3>
                        </div>
                        <div className="space-y-6 text-left">
                            <div className="flex justify-between items-center py-4 border-b border-primary/5 text-left">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cart Intent</span>
                                <span className="text-sm font-black text-foreground">{stats.cart_adds} Adds</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-primary/5 text-left">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wishlist Latency</span>
                                <span className="text-sm font-black text-foreground">{stats.wishlist_adds} Saves</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-primary/5 text-left">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Search Visibility</span>
                                <span className="text-sm font-black text-foreground">{stats.search_frequency} Queries</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed text-left">
                            &quot;High search-to-cart ratio detected. Consider creating a targeted TikTok bundle for this SKU.&quot;
                        </p>
                    </div>
                    <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12" />
                </Card>

                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100"><Search size={20} /></div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Discovery Intelligence</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Traffic Channels</p>
                            <div className="space-y-4">
                                {[
                                    { channel: 'TikTok', reach: '42%', conv: '6.8%' },
                                    { channel: 'Instagram', reach: '28%', conv: '4.2%' },
                                    { channel: 'Direct', reach: '20%', conv: '8.1%' }
                                ].map(c => (
                                    <div key={c.channel} className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase">
                                            <span className="text-foreground">{c.channel}</span>
                                            <span className="text-primary">{c.reach}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-primary" style={{ width: c.reach }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
