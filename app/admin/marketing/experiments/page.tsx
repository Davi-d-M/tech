'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    TrendingUp,
    BarChart3,
    RefreshCcw,
    Plus,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Target,
    Activity,
    Smartphone,
    Trophy,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Experiment {
    id: string;
    name: string;
    status: 'Running' | 'Paused' | 'Ended';
    variant_a: { name: string, orders: number, ctr: number };
    variant_b: { name: string, orders: number, ctr: number };
    created_at: string;
}

export default function ExperimentationCenter() {
    useAdmin();
    const [experiments, setExperiments] = React.useState<Experiment[]>([
        {
            id: '1',
            name: 'Hero Headline Test',
            status: 'Running',
            variant_a: { name: 'Future Sound', orders: 21, ctr: 4.2 },
            variant_b: { name: 'Titan Audio', orders: 39, ctr: 7.8 },
            created_at: new Date().toISOString()
        }
    ]);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Yield Lab</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Experimentation</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Optimize conversion funnels through clinical A/B testing protocols.</p>
                </div>
                <Button className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus size={16} className="mr-2" /> Start Experiment
                </Button>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    {experiments.map(exp => {
                        const winner = exp.variant_a.ctr > exp.variant_b.ctr ? 'A' : 'B';
                        return (
                            <Card key={exp.id} className="p-10 rounded-[3.5rem] border border-border bg-card shadow-sm space-y-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Target size={24} /></div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">{exp.name}</h3>
                                    </div>
                                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full animate-pulse">Running</span>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-10">
                                    {/* Variant A */}
                                    <div className={cn(
                                        "p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden",
                                        winner === 'A' ? "border-emerald-500/20 bg-emerald-50/10" : "border-border bg-secondary/50"
                                    )}>
                                        <div className="relative z-10 space-y-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Version A</p>
                                            <h4 className="text-xl font-black text-foreground uppercase italic leading-none">{exp.variant_a.name}</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground">CTR</p>
                                                    <p className="text-2xl font-black text-foreground">{exp.variant_a.ctr}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground">Orders</p>
                                                    <p className="text-2xl font-black text-foreground">{exp.variant_a.orders}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variant B */}
                                    <div className={cn(
                                        "p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden",
                                        winner === 'B' ? "border-emerald-500 border-emerald-50/30 shadow-2xl" : "border-border bg-secondary/50"
                                    )}>
                                        {winner === 'B' && <div className="absolute top-4 right-4"><Trophy className="text-primary h-6 w-6" /></div>}
                                        <div className="relative z-10 space-y-6">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Version B</p>
                                            <h4 className="text-xl font-black text-foreground uppercase italic leading-none">{exp.variant_b.name}</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground">CTR</p>
                                                    <p className="text-2xl font-black text-primary">{exp.variant_b.ctr}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground">Orders</p>
                                                    <p className="text-2xl font-black text-primary">{exp.variant_b.orders}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border flex justify-between items-center">
                                    <p className="text-[10px] text-muted-foreground font-medium italic">&quot;Version B is outperforming A by 85%. Statistical significance reached.&quot;</p>
                                    <Button className="rounded-xl h-12 px-6 bg-foreground text-background font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">Adopt Version B</Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-6 text-left">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Conversion Funnel</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-background/50">
                                        <span>Product Views</span>
                                        <span>9.8K</span>
                                    </div>
                                    <div className="h-1 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-background/50">
                                        <span>Cart Additions</span>
                                        <span>2.1K</span>
                                    </div>
                                    <div className="h-1 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[22%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-background/50">
                                        <span>Checkout Start</span>
                                        <span>1.0K</span>
                                    </div>
                                    <div className="h-1 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[11%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-background/50">
                                        <span>Completed Order</span>
                                        <span className="text-emerald-500">684</span>
                                    </div>
                                    <div className="h-1 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[7%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-border shadow-sm space-y-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={18} /></div>
                        <h4 className="text-lg font-black uppercase text-foreground leading-none">Yield Booster</h4>
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                            &quot;Current leakage detected in the Cart-to-Checkout transition. Version B pricing anchor is recommended.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
