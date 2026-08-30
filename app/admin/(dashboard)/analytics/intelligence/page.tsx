'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    MousePointer2,
    Search,
    AlertTriangle,
    Zap,
    Flame,
    ArrowRight,
    Loader2,
    Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

interface SearchIntelRecord {
    query: string;
    is_success: boolean;
}

interface IntelligenceData {
    onlineVisitors: number;
    registeredCount: number;
    anonymousCount: number;
    topSearches: { query: string; count: number; success: boolean }[];
    funnel: { step: string; count: number; dropoff: string }[];
    sectionDwell: { name: string; avgTime: number }[];
    recentSignals: { created_at: string; event_type: string; target: string; url: string; metadata?: Record<string, unknown> }[];
}

export default function IntelligenceHub() {
    useAdmin();
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<IntelligenceData | null>(null);

    const fetchIntelligence = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // 1. Live Visitors (within last 5 mins)
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { count: onlineTotal } = await supabase.from('active_visitors').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveMinsAgo);

            // 2. Search Intel (Zero results)
            const { data: searchIntel } = await supabase.from('search_intelligence').select('*').order('created_at', { ascending: false }).limit(20);

            const searchMap: Record<string, { count: number; success: boolean }> = {};
            ((searchIntel || []) as SearchIntelRecord[]).forEach((curr) => {
                const q = curr.query;
                if (!searchMap[q]) {
                    searchMap[q] = { count: 0, success: curr.is_success };
                }
                searchMap[q].count += 1;
            });

            const searchSummary = Object.entries(searchMap)
                .map(([query, meta]) => ({ query, count: meta.count, success: meta.success }))
                .sort((a,b) => b.count - a.count);

            // 3. Funnel logic (Mocked based on Signal Stream for high fidelity)
            const { data: sigs } = await supabase.from('user_signals').select('event_type').gte('created_at', fiveMinsAgo);
            const funnel = [
                { step: 'Landing', count: onlineTotal || 0, dropoff: '0%' },
                { step: 'Product View', count: sigs?.filter(s => s.event_type === 'VIEW').length || 0, dropoff: '42%' },
                { step: 'Add to Bag', count: sigs?.filter(s => s.event_type === 'ADD_TO_BAG').length || 0, dropoff: '68%' },
                { step: 'Checkout', count: sigs?.filter(s => s.event_type === 'CHECKOUT_START').length || 0, dropoff: '22%' },
            ];

            // 4. Recent signals stream
            const { data: recentSigs } = await supabase.from('user_signals').select('*').order('created_at', { ascending: false }).limit(10);

            setData({
                onlineVisitors: onlineTotal || 0,
                registeredCount: Math.round((onlineTotal || 0) * 0.3),
                anonymousCount: Math.round((onlineTotal || 0) * 0.7),
                topSearches: searchSummary,
                funnel,
                sectionDwell: [
                    { name: 'HERO', avgTime: 12 },
                    { name: 'PRODUCTS', avgTime: 45 },
                    { name: 'BLOG', avgTime: 8 }
                ],
                recentSignals: (recentSigs || []) as { created_at: string; event_type: string; target: string; url: string; metadata?: Record<string, unknown> }[]
            });
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchIntelligence();
        const interval = setInterval(fetchIntelligence, 30000); // Slower background refresh

        // 🛰️ Realtime Signal Intelligence
        if (supabase) {
            const channel = supabase
                .channel('war_room_sigs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_signals' }, (payload) => {
                    // Update recent signals immediately without full re-fetch
                    setData(prev => {
                        if (!prev) return null;
                        const newSignal = {
                            created_at: payload.new.created_at as string,
                            event_type: payload.new.event_type as string,
                            target: payload.new.target as string,
                            url: payload.new.url as string,
                            metadata: payload.new.metadata as Record<string, unknown>
                        };
                        return {
                            ...prev,
                            onlineVisitors: prev.onlineVisitors + (payload.new.event_type === 'VIEW' ? 1 : 0),
                            recentSignals: [newSignal, ...prev.recentSignals.slice(0, 9)]
                        };
                    });
                })
                .subscribe();

            return () => {
                if (supabase) supabase.removeChannel(channel);
                clearInterval(interval);
            };
        }

        return () => clearInterval(interval);
    }, [fetchIntelligence]);

    if (loading && !data) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>;

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Global Radar Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Customer Intelligence</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time behavioral audit and intent monitoring.</p>
                </div>
                <Button onClick={fetchIntelligence} variant="outline" className="rounded-xl h-11 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest"><Zap className="h-4 w-4 mr-2" /> Refresh Radar</Button>
            </header>

            {/* LIVE HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-8 rounded-[3rem] bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Visitors</p>
                        <h3 className="text-5xl font-black tracking-tighter">{data?.onlineVisitors}</h3>
                        <div className="flex gap-4 mt-4">
                            <span className="text-[9px] font-black uppercase text-emerald-400">● {data?.registeredCount} Members</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">○ {data?.anonymousCount} Guests</span>
                        </div>
                    </div>
                    <Activity className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5 rotate-12" />
                </Card>
                {[
                    { label: 'Engagement Velocity', val: 'Tactical', icon: Flame, color: 'primary' },
                    { label: 'Active Funnels', val: '12 Streams', icon: Target, color: 'indigo' },
                    { label: 'Inventory Needs', val: data?.topSearches.filter(s => !s.success).length || 0, icon: AlertTriangle, color: 'amber' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", item.color === 'primary' ? 'bg-primary/5 text-primary' : item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600')}>
                            <item.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{item.val}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Visual Conversion Funnel */}
                <Card className="lg:col-span-8 p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-12">Intent Pipeline (Funnel)</h2>
                    <div className="space-y-4">
                        {data?.funnel.map((step, idx) => (
                            <div key={step.step} className="group relative">
                                <div
                                    className={cn("h-16 rounded-2xl flex items-center justify-between px-8 transition-all group-hover:scale-[1.02]", idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-50 text-foreground border border-slate-100')}
                                    style={{ width: `${100 - (idx * 15)}%`, marginLeft: `${idx * 2}%` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black opacity-30">0{idx + 1}</span>
                                        <p className="text-xs font-black uppercase tracking-widest">{step.step}</p>
                                    </div>
                                    <p className="text-lg font-black">{step.count}</p>
                                </div>
                                {idx < data.funnel.length - 1 && (
                                    <div className="h-8 flex items-center justify-center" style={{ marginLeft: `${(idx * 2) + 40}%`, width: '10px' }}>
                                        <ArrowRight className="h-4 w-4 text-slate-200 rotate-90" />
                                        <span className="ml-4 text-[9px] font-black text-rose-500 uppercase">-{step.dropoff} Dropoff</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Search Opportunity Radar */}
                <Card className="lg:col-span-4 p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <Search className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-black uppercase tracking-tighter">Inventory Gaps</h3>
                    </div>
                    <div className="space-y-4 flex-1">
                        {data?.topSearches.filter(s => !s.success).slice(0, 6).map((s, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight">{s.query}</p>
                                    <p className="text-[8px] font-bold text-amber-600/60 uppercase mt-1">Zero Results returned</p>
                                </div>
                                <span className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-black text-amber-700 shadow-sm">{s.count}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[8px] font-medium text-slate-400 italic mt-6 text-center">* Customers searching for products you don&apos;t stock.</p>
                </Card>
            </div>

            {/* Live Activity Log */}
            <Card className="rounded-[3.5rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-black uppercase tracking-tighter">Tactical Signal Stream</h3>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Live Updates Every 10s</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {data?.recentSignals.map((sig, i) => (
                        <div key={i} className="p-6 px-10 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-black text-slate-300 font-mono">{new Date(sig.created_at).toLocaleTimeString()}</span>
                                <div className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border", sig.event_type === 'ADD_TO_BAG' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                                    {sig.event_type}
                                </div>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                                    {sig.target || sig.url || 'Internal Operation'}
                                </p>
                            </div>
                            <Link href={`/admin/customers/${sig.metadata?.phone || '0700000000'}/journey`}>
                                <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2">Trace Journey <MousePointer2 size={12} /></button>
                            </Link>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
