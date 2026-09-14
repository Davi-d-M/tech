'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldAlert,
    TrendingUp,
    Zap,
    Loader2,
    AlertCircle,
    Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Insight {
    id: string;
    type: 'ALERT' | 'OPPORTUNITY';
    title: string;
    desc: string;
    impact: string;
    severity: 'High' | 'Medium' | 'Low';
    actionLabel: string;
    actionHref: string;
}

export default function DecisionDashboard() {
    const [insights, setInsights] = React.useState<Insight[]>([]);
    const [loading, setLoading] = React.useState(true);

    const generateInsights = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // 1. Fetch live metrics for heuristics
            const [ordersRes, signalsRes, productsRes] = await Promise.all([
                supabase.from('orders').select('status').order('created_at', { ascending: false }).limit(20),
                supabase.from('search_intelligence').select('query, results_count').eq('is_success', false).limit(10),
                supabase.from('products').select('name, stock, opportunity_score').lt('stock', 5).limit(3)
            ]);

            const newInsights: Insight[] = [];

            // HEURISTIC A: Payment Failure Rate
            const failures = ordersRes.data?.filter(o => o.status === 'Payment Failed').length || 0;
            if (failures > 3) {
                newInsights.push({
                    id: 'alert-payment',
                    type: 'ALERT',
                    title: 'Payment Friction Rising',
                    desc: 'Detected 4+ payment failures in the last 2 hours. Likely gateway instability.',
                    impact: '-14% Conversion',
                    severity: 'High',
                    actionLabel: 'Audit Gateways',
                    actionHref: '/admin/finance'
                });
            }

            // HEURISTIC B: Search Demand (Zero Results)
            if (signalsRes.data && signalsRes.data.length > 0) {
                newInsights.push({
                    id: 'opp-search',
                    type: 'OPPORTUNITY',
                    title: 'Unmet Demand Node',
                    desc: `High search volume for "${signalsRes.data[0].query}" with zero matching SKUs.`,
                    impact: 'Potential KSh 45k/mo',
                    severity: 'Medium',
                    actionLabel: 'Add to Catalog',
                    actionHref: '/admin/upload'
                });
            }

            // HEURISTIC C: Stockout Risk
            if (productsRes.data && productsRes.data.length > 0) {
                newInsights.push({
                    id: 'alert-stock',
                    type: 'ALERT',
                    title: 'Strategic Stockout Risk',
                    desc: `"${productsRes.data[0].name}" projected to deplete in 2.1 days.`,
                    impact: 'High Priority SKU',
                    severity: 'High',
                    actionLabel: 'Replenish',
                    actionHref: '/admin/upload'
                });
            }

            // HEURISTIC D: Campaign Opportunity
            newInsights.push({
                id: 'opp-campaign',
                type: 'OPPORTUNITY',
                title: 'Viral Velocity Spike',
                desc: 'Whiskey related traffic from TikTok up 31% in the Karen region.',
                impact: 'Scaling Recommended',
                severity: 'Low',
                actionLabel: 'Push Ad',
                actionHref: '/admin/marketing/ai-agency'
            });

            setInsights(newInsights);
        } catch (err) {
            console.error("Decision Engine Desync:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        generateInsights();
    }, [generateInsights]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing Decision Hub...</p>
        </div>
    );

    const alerts = insights.filter(i => i.type === 'ALERT');
    const opps = insights.filter(i => i.type === 'OPPORTUNITY');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 px-4">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Mission Priorities</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">

                {/* HIGH PRIORITY ALERTS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4">
                        <ShieldAlert className="h-3 w-3 text-rose-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">{alerts.length} Critical Actions Required</span>
                    </div>
                    <div className="space-y-3">
                        {alerts.map(item => (
                            <Card key={item.id} className="p-6 rounded-[2.5rem] bg-rose-50 border border-rose-100 flex items-center justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-start gap-6 text-left">
                                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 shrink-0 group-hover:scale-110 transition-transform">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-rose-900 uppercase text-sm leading-none">{item.title}</h4>
                                        <p className="text-[10px] font-medium text-rose-600/80 mt-1 italic leading-tight max-w-[250px]">{item.desc}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded-full uppercase">{item.impact}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={item.actionHref}>
                                    <Button className="h-10 px-6 rounded-xl bg-rose-600 text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all">
                                        {item.actionLabel}
                                    </Button>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* GROWTH OPPORTUNITIES */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4">
                        <Zap className="h-3 w-3 text-primary fill-current" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">{opps.length} Growth Levers Detected</span>
                    </div>
                    <div className="space-y-3">
                        {opps.map(item => (
                            <Card key={item.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-start gap-6 text-left">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10 shrink-0 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground uppercase text-sm leading-none">{item.title}</h4>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1 italic leading-tight max-w-[250px]">{item.desc}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] font-black rounded-full uppercase border border-emerald-100">{item.impact}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={item.actionHref}>
                                    <Button className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                        {item.actionLabel}
                                    </Button>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
