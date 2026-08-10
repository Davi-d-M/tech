'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ApexIntelligence() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consulting Apex Intelligence...</p>
        </Card>
    );

    return (
        <section className="bg-white rounded-[3rem] p-10 border border-border shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">

                <div className="space-y-6 flex-1 text-left">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Apex Intelligence</h2>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Operational Co-Pilot</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-lg font-black text-foreground uppercase leading-none">Good morning, Admin.</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5" />
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                    Revenue is up <span className="text-emerald-600 font-black">18.4%</span> this week. Your highest-performing product is <span className="text-foreground font-black">AMAYA AM-05</span>.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                    Inventory risk detected in <span className="text-amber-600 font-black">3 products</span>. Logistics costs increased 11%.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Package className="h-4 w-4 text-primary mt-0.5" />
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                    I recommend restocking <span className="text-primary font-black uppercase">SIM Card Tray Ejector</span> within 48 hours to prevent stockouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-64 flex flex-col justify-end">
                    <Link href="/admin/analytics">
                        <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            View Deep Analysis <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>

            </div>

            <Sparkles className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
        </section>
    );
}
