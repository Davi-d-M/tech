'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    AlertTriangle,
    Loader2,
    Target,
    Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface IntelligenceData {
    growth: number;
    ordersUp: number;
    marginChange: number;
    inventoryRisk: number;
    supplierRisk: number;
    atRiskCustomers: number;
}

export default function ApexIntelligence2() {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<IntelligenceData>({
        growth: 0,
        ordersUp: 0,
        marginChange: 0,
        inventoryRisk: 0,
        supplierRisk: 0,
        atRiskCustomers: 0
    });

    React.useEffect(() => {
        async function fetchDailyBrief() {
            if (!supabase) return;
            try {
                // Tactical Data Scans
                const [, productsRes, suppliersRes] = await Promise.all([
                    supabase.from('orders').select('total_price, status, created_at'),
                    supabase.from('products').select('stock'),
                    supabase.from('suppliers').select('rating')
                ]);

                // Calculate metrics
                const lowStock = productsRes.data?.filter(p => p.stock < 5).length || 0;
                const riskySuppliers = suppliersRes.data?.filter(s => s.rating < 80).length || 0;

                setData({
                    growth: 14.8, // Dynamic calculation logic to be added
                    ordersUp: 8.2,
                    marginChange: -2.4,
                    inventoryRisk: lowStock,
                    supplierRisk: riskySuppliers,
                    atRiskCustomers: 4
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDailyBrief();
    }, []);

    if (loading) return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 flex flex-col items-center justify-center gap-4 min-h-[250px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compiling Daily Intelligence...</p>
        </Card>
    );

    return (
        <section className="bg-white rounded-[3.5rem] p-10 text-foreground relative overflow-hidden group shadow-sm border border-slate-100">
            <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Apex Daily Brief</h2>
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-1">Operational Co-Pilot Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Synchronized</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                            <span className="flex items-center text-emerald-500 text-xs font-black"><ArrowUpRight className="h-3 w-3 mr-1" /> {data.growth}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Volume</p>
                            <span className="flex items-center text-emerald-500 text-xs font-black"><ArrowUpRight className="h-3 w-3 mr-1" /> {data.ordersUp}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/2 shadow-[0_0_15px_rgba(255,107,0,0.3)]"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit Margin</p>
                            <span className="flex items-center text-rose-500 text-xs font-black"><ArrowDownRight className="h-3 w-3 mr-1" /> {Math.abs(data.marginChange)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 w-1/3 shadow-[0_0_15px_rgba(244,63,94,0.3)]"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Anomaly Detection</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-100 transition-all cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><AlertTriangle size={20} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase text-foreground tracking-tight">Inventory Risk</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1 italic">&quot;{data.inventoryRisk} critical products approaching stock-out velocity.&quot;</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-100 transition-all cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><Target size={20} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase text-foreground tracking-tight">Supplier Performance</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1 italic">&quot;{data.supplierRisk} suppliers flagged for high defect rates or SLA breaches.&quot;</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">AI Recommendations</h3>
                        <div className="space-y-4">
                            <div className="p-5 bg-primary/5 border border-primary/10 rounded-3xl relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <p className="text-[10px] font-black uppercase text-primary">Profit Optimization</p>
                                </div>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic relative z-10">
                                    &quot;Supplier B has lowered cost by 4.2%. Adjust procurement allocation to maintain 14% target margin.&quot;
                                </p>
                                <Sparkles className="absolute -bottom-4 -right-4 h-16 w-16 text-primary/10 rotate-12" />
                            </div>
                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <p className="text-[10px] font-black uppercase text-indigo-500">Retention Strategy</p>
                                </div>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                    &quot;{data.atRiskCustomers} high-value customers are dormant. Initialize Re-Engagement Campaign C89.&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            <Target className="absolute -bottom-10 -left-10 h-64 w-64 text-primary/5 -rotate-12" />
        </section>
    );
}
