'use client';

import * as React from 'react';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Box,
    TrendingUp,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Plus,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import Link from 'next/link';

export default function SupplierDashboard() {
    const { supplier_id } = useAdmin();
    const [stats, setStats] = React.useState({ live: 0, pending: 0, stock: 0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchSupplierStats() {
            if (!supabase || !supplier_id) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('products')
                    .select('status, stock')
                    .eq('supplier_id', supplier_id);

                const live = data?.filter(p => p.status === 'Live').length || 0;
                const pending = data?.filter(p => p.status === 'Pending').length || 0;
                const totalStock = data?.reduce((acc, curr) => acc + (curr.stock || 0), 0) || 0;

                setStats({ live, pending, stock: totalStock });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSupplierStats();
    }, [supplier_id]);

    if (loading) return (
        <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Warming Partner Uplink...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Secure Duty Channel</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Partner Command</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage your inventory pulse and propose new tactical gadgets.</p>
                </div>
                <Link href="/supplier/propose">
                    <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> Propose New Product
                    </Button>
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {[
                    { label: 'Live on Grid', val: stats.live, icon: Zap, color: 'primary' },
                    { label: 'In Review', val: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Units at Base', val: stats.stock, icon: Box, color: 'emerald' },
                ].map(item => (
                    <Card key={item.label} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all h-full">
                        <div className="flex justify-between items-start mb-8">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                item.color === 'primary' ? "bg-primary/5 text-primary" :
                                item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                "bg-emerald-50 text-emerald-600"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6 text-left">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground px-4">Fulfillment Feed</h3>
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] opacity-40 italic">
                        <Box size={40} className="mb-4 text-slate-300" />
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Awaiting active mission data...</p>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-8 text-left">
                    <Card className="p-10 rounded-[3.5rem] bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-lg font-black uppercase tracking-tighter">Your Scorecard</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Reliability</span>
                                        <span className="text-emerald-500">100%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Dispatch SLA</span>
                                        <span className="text-primary">98%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[98%]"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] font-medium italic text-slate-400 leading-relaxed">
                                &quot;Your performance metrics are synchronized with the Command Center in real-time.&quot;
                            </p>
                        </div>
                        <TrendingUp className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/10 rotate-12 -z-0" />
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm"><AlertTriangle size={20} /></div>
                            <h3 className="text-lg font-black uppercase text-foreground leading-none tracking-tighter">Operational Guard</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;Always update your base stock levels to avoid mission delays. Low stock alerts will be transmitted immediately.&quot;
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
