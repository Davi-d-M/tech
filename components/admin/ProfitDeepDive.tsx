'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    TrendingUp,
    TrendingDown,
    Zap,
    DollarSign,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieIcon,
    ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

interface MarginStats {
    gross_revenue: number;
    net_profit: number;
    margin_percentage: number;
    breakdown: { name: string, value: number, color: string }[];
}

export default function ProfitDeepDive() {
    const [stats, setStats] = React.useState<MarginStats | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchMarginIntel = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // 1. Fetch Ledger entries (Production Financial Node)
            const { data: entries } = await supabase
                .from('ledger_entries')
                .select('*')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            if (!entries || entries.length === 0) {
                setStats(null);
                return;
            }

            const revenue = entries.filter(e => e.entry_type === 'REVENUE').reduce((s, e) => s + e.amount, 0);
            const cogs = Math.abs(entries.filter(e => e.entry_type === 'COST').reduce((s, e) => s + e.amount, 0));

            // Estimates for shipping/tax if not in ledger yet
            const shipping = revenue * 0.03;
            const vat = revenue * 0.16; // 16% VAT in Kenya
            const commission = revenue * 0.05;

            const netProfit = revenue - cogs - shipping - vat - commission;
            const margin = (netProfit / revenue) * 100;

            setStats({
                gross_revenue: revenue,
                net_profit: netProfit,
                margin_percentage: margin,
                breakdown: [
                    { name: 'Net Yield', value: netProfit, color: '#F5A000' },
                    { name: 'Inventory Cost', value: cogs, color: '#64748b' },
                    { name: 'VAT (16%)', value: vat, color: '#ef4444' },
                    { name: 'Partner Cuts', value: commission, color: '#5B5BFF' },
                    { name: 'Logistics', value: shipping, color: '#10b981' }
                ]
            });
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMarginIntel();
    }, [fetchMarginIntel]);

    if (loading) return (
        <Card className="p-20 text-center space-y-4 rounded-[3rem] border border-slate-100 bg-white">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reconciling Margin Grid...</p>
        </Card>
    );

    if (!stats) return (
        <Card className="p-20 text-center rounded-[3rem] border border-slate-100 bg-white opacity-40">
            <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Ledger Data</p>
        </Card>
    );

    return (
        <Card className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group text-left">
            <div className="relative z-10 space-y-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Margin Intelligence</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Yield Reconstruction HUD</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Net Margin</p>
                        <h3 className="text-3xl font-black text-primary tracking-tighter">{stats.margin_percentage.toFixed(1)}%</h3>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross Sales</p>
                                <p className="text-xl font-black text-foreground">{formatPrice(stats.gross_revenue)}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-1">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Net Yield</p>
                                <p className="text-xl font-black text-emerald-700">{formatPrice(stats.net_profit)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Cost Exposure</p>
                            <div className="space-y-4">
                                {stats.breakdown.slice(1).map(item => (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase">
                                            <span className="text-slate-500">{item.name}</span>
                                            <span className="text-foreground">{formatPrice(item.value)}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full transition-all duration-1000"
                                                style={{ width: `${(item.value / stats.gross_revenue) * 100}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.breakdown}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                            <p className="text-2xl font-black text-foreground">A+</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-600 font-medium leading-relaxed italic">
                        &quot;Profit bleed is currently dominated by VAT exposure (16%). Consider batching imports to optimize input tax claims through the Sourcing Bridge.&quot;
                    </p>
                </div>
            </div>
            <Zap className="absolute -bottom-20 -right-20 h-64 w-64 text-primary/5 rotate-12 -z-0" />
        </Card>
    );
}
