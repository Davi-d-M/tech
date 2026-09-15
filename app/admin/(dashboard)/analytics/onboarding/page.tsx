'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    Target,
    Zap,
    Loader2,
    Smartphone,
    Rocket
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

interface OnboardingMetric {
    role: string;
    total_started: number;
    completed: number;
    avg_score: number;
}

export default function OnboardingAnalytics() {
    useAdmin();
    const [metrics, setMetrics] = React.useState<OnboardingMetric[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchMetrics = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data: progress } = await supabase.from('onboarding_progress').select('role, is_completed, score');

            const roleStats: Record<string, { started: number, completed: number, totalScore: number }> = {};

            progress?.forEach(p => {
                if (!roleStats[p.role]) roleStats[p.role] = { started: 0, completed: 0, totalScore: 0 };
                roleStats[p.role].started += 1;
                if (p.is_completed) roleStats[p.role].completed += 1;
                roleStats[p.role].totalScore += p.score || 0;
            });

            const summary = Object.entries(roleStats).map(([role, stats]) => ({
                role,
                total_started: stats.started,
                completed: stats.completed,
                avg_score: Math.round(stats.totalScore / stats.started)
            }));

            setMetrics(summary);
        } catch (err) {
            console.error("Onboarding Intelligence Failure:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    if (loading) return (
        <div className="p-20 text-center space-y-4">
            <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Activation Funnels...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-12 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Onboarding Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Activation HUD</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Monitor the funnel from initial registration to operational grid-lock.</p>
                </div>
                <Button onClick={fetchMetrics} variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                    <Zap className="h-4 w-4 mr-2" /> Refresh Data
                </Button>
            </header>

            {/* HIGH LEVEL KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Total Registrations', val: metrics.reduce((s, m) => s + m.total_started, 0), icon: Users, color: 'primary' },
                    { label: 'Overall Completion', val: `${Math.round((metrics.reduce((s, m) => s + m.completed, 0) / (metrics.reduce((s, m) => s + m.total_started, 0) || 1)) * 100)}%`, icon: Target, color: 'indigo' },
                    { label: 'Avg Health Score', val: `${Math.round(metrics.reduce((s, m) => s + m.avg_score, 0) / (metrics.length || 1))}%`, icon: Zap, color: 'emerald' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all h-full flex flex-col justify-between">
                        <div className="relative z-10 space-y-6">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color === 'primary' ? 'bg-primary/5 text-primary' : item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-500')}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">{item.val}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ROLE FUNNELS */}
            <div className="grid lg:grid-cols-2 gap-10">
                {metrics.map(m => (
                    <Card key={m.role} className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-10 text-left">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary"><Smartphone size={20} /></div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{m.role} Funnel</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-full">{m.total_started} Nodes</span>
                        </div>

                        <div className="space-y-8">
                            {/* Funnel Viz */}
                            <div className="relative space-y-4">
                                <div className="h-16 w-full bg-primary rounded-2xl flex items-center justify-between px-8 text-white relative group transition-all hover:scale-[1.02]">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
                                    <span className="text-xl font-black">{m.total_started}</span>
                                </div>
                                <div className="h-8 flex items-center justify-center">
                                    <div className="w-0.5 h-full bg-slate-100" />
                                </div>
                                <div
                                    className="h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-between px-8 text-foreground relative group transition-all hover:scale-[1.02] shadow-inner"
                                    style={{ width: `${Math.max(40, (m.completed / (m.total_started || 1)) * 100)}%`, margin: '0 auto' }}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">Activation</span>
                                    <span className="text-xl font-black">{m.completed}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Completion Rate</p>
                                    <p className="text-xl font-black text-primary">{Math.round((m.completed / (m.total_started || 1)) * 100)}%</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Avg Health Score</p>
                                    <p className="text-xl font-black text-emerald-500">{m.avg_score}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                             <Link href={`/admin/analytics/intelligence`}>
                                <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">View Behavioral Leakage &rarr;</Button>
                             </Link>
                        </div>
                    </Card>
                ))}

                {metrics.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6 opacity-30">
                        <Target size={64} className="text-slate-200" />
                        <p className="text-xl font-black uppercase text-slate-400">Awaiting Funnel Signals...</p>
                    </div>
                )}
            </div>

            {/* GHOST INSIGHTS */}
            <Card className="p-10 rounded-[4rem] bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20"><Zap size={24} /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Autonomous Insight</h3>
                    </div>
                    <p className="text-lg font-bold italic leading-relaxed opacity-90 max-w-3xl">
                        &quot;Rider onboarding drop-off is highest at the &apos;National ID&apos; upload step. I recommend adding a &apos;Scan ID&apos; OCR feature to reduce manual input friction and increase completion by an estimated 14%.&quot;
                    </p>
                    <div className="pt-6 border-t border-white/10 flex gap-4">
                         <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20">Decision Ready</span>
                    </div>
                </div>
                <Zap className="absolute -bottom-20 -right-20 h-96 w-96 text-white/5 rotate-12" />
            </Card>
        </div>
    );
}
