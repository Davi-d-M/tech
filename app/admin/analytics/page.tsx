'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    BarChart3,
    Users,
    Activity as Zap,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    PieChart as PieIcon,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const PIE_COLORS = ['#F5A000', '#0F172A', '#5B5BFF', '#10B981'];

export default function AdminAnalyticsPage() {
    useAdmin();
    const [timeframe, setTimeframe] = React.useState<'7d' | '30d' | '90d' | 'YTD'>('30d');
    const [loading, setLoading] = React.useState(true);
    const [products, setProducts] = React.useState<any[]>([]);
    const [orders, setOrders] = React.useState<any[]>([]);

    React.useEffect(() => {
        async function fetchData() {
            if (!supabase) return;
            setLoading(true);
            try {
                const [prodRes, ordRes] = await Promise.all([
                    supabase.from('products').select('category'),
                    supabase.from('orders').select('*')
                ]);
                setProducts(prodRes.data || []);
                setOrders(ordRes.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const categoryData = React.useMemo(() => {
        const map = new Map<string, number>();
        products.forEach(p => {
            const cat = p.category || 'Other';
            map.set(cat, (map.get(cat) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [products]);

    const chartData = React.useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const now = new Date();
        const last7Days = days.map((_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayOrders = orders.filter(o => o.created_at?.startsWith(date));
            const revenue = dayOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.total_price || 0), 0);
            return {
                name: date.split('-')[2],
                revenue,
                profit: revenue * 0.3, // Estimated 30% margin
                users: dayOrders.length
            };
        });
    }, [orders]);

    const performanceStats = React.useMemo(() => {
        const delivered = orders.filter(o => o.status === 'Delivered');
        const totalRevenue = delivered.reduce((s, o) => s + (o.total_price || 0), 0);
        const totalProfit = totalRevenue * 0.3; // Baseline 30% margin
        const convRate = orders.length > 0 ? (delivered.length / orders.length) * 100 : 0;

        return [
            { label: 'Revenue (Total)', val: formatPrice(totalRevenue), trend: '+18.3%', color: 'primary' },
            { label: 'Net Margin', val: '30.0%', trend: '+2.1%', color: 'emerald' },
            { label: 'Total Orders', val: orders.length.toString(), trend: '+4.5%', color: 'indigo' },
            { label: 'Conv. Rate', val: `${convRate.toFixed(1)}%`, trend: '-0.2%', color: 'amber' },
        ];
    }, [orders]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-4">Synthesizing Data Streams...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Strategic Analytics</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time performance metrics and business growth intelligence.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-secondary p-1 rounded-xl flex gap-1 border border-border">
                        {['7d', '30d', '90d', 'YTD'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t as any)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                    timeframe === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" className="rounded-xl h-11 px-6 border-border bg-card font-black uppercase text-[9px] tracking-widest hover:bg-secondary">
                        <Download className="h-3.5 w-3.5 mr-2" /> Report
                    </Button>
                </div>
            </header>

            {/* Performance HUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {performanceStats.map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-card border-border shadow-sm group hover:shadow-xl transition-all h-full flex flex-col justify-between">
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                                <div className={cn(
                                    "flex items-center gap-1 text-[9px] font-black uppercase",
                                    item.trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {item.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {item.trend}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-1000",
                                item.color === 'primary' ? 'bg-primary' :
                                item.color === 'emerald' ? 'bg-emerald-500' :
                                item.color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                            )} style={{ width: '70%' }}></div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">

                <div className="lg:col-span-8 space-y-10">
                    {/* Revenue Dynamics */}
                    <Card className="p-10 rounded-[3.5rem] border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Revenue Dynamics</h2>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Cash Flow vs Profit extraction</p>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">Exploded View &rarr;</Button>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }} className="text-muted-foreground" />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }} className="text-muted-foreground" />
                                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={4} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="profit" stroke="currentColor" strokeWidth={2} fill="transparent" className="text-foreground" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Customer Growth */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-10 rounded-[3rem] border border-border bg-card shadow-sm">
                            <h3 className="text-sm font-black uppercase text-foreground tracking-tighter mb-8">User Acquisition</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900 }} className="text-muted-foreground" />
                                        <Bar dataKey="users" fill="#ff6b00" radius={[10, 10, 10, 10]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-10 rounded-[3rem] border border-border bg-card shadow-sm flex flex-col items-center">
                            <h3 className="text-sm font-black uppercase text-foreground tracking-tighter mb-8 w-full text-left">Segment Distribution</h3>
                            <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <PieIcon className="h-6 w-6 text-primary mb-1" />
                                    <span className="text-[10px] font-black uppercase text-foreground">Top Segments</span>
                                </div>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-4 mt-6">
                                {categoryData.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    {/* Operational Efficiency */}
                    <Card className="p-10 rounded-[3.5rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-sm"><Clock className="h-5 w-5" /></div>
                                <h3 className="text-lg font-black uppercase tracking-tighter">Ops Performance</h3>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-background/50">
                                        <span>Fulfillment Time</span>
                                        <span className="text-primary">1.2h</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[85%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-background/50">
                                        <span>Delivery Time (NBO)</span>
                                        <span className="text-emerald-500">42m</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[92%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-background/50">
                                        <span>Cancellation Rate</span>
                                        <span className="text-rose-500">0.8%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 w-[12%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-background/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Zap size={14} className="fill-current" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-background">Operational Elite</span>
                                </div>
                                <ArrowUpRight className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                        <BarChart3 className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/10 rotate-12 -z-0" />
                    </Card>

                    {/* Marketing Pulse */}
                    <div className="p-10 rounded-[3rem] bg-white border border-border shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Users className="h-5 w-5" /></div>
                            <h3 className="text-sm font-black uppercase text-foreground">Marketing ROI</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-border">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Affiliate Rev</span>
                                <span className="text-sm font-black text-foreground">KSh 142K</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-border">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Coupon Burn</span>
                                <span className="text-sm font-black text-rose-500">KSh 18K</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Net Campaign ROI</span>
                                <span className="text-lg font-black text-emerald-500 tracking-tighter">7.4x</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
