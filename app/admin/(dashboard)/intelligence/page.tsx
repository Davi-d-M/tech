'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    Users,
    Search,
    ChevronRight,
    Zap,
    ShieldCheck,
    Dna,
    RefreshCcw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserIdentity {
    visitor_id: string;
    user_id?: string;
    email?: string;
    full_name?: string;
    dna?: {
        engagement_score: number;
        shopping_frequency: number;
        feature_adoption: number;
    };
    last_session?: {
        started_at: string;
        view_count: number;
        outcome: string;
    };
}

export default function UserIntelligenceList() {
    const [loading, setLoading] = React.useState(true);
    const [identities, setIdentities] = React.useState<UserIdentity[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

    const fetchIdentities = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // 1. Fetch DNA and link with profiles
            const { data: dnaData } = await supabase
                .from('user_behavioral_dna')
                .select('*, profiles(email, full_name)')
                .order('last_computed_at', { ascending: false });

            // 2. Fetch Latest Sessions
            const { data: sessionData } = await supabase
                .from('user_sessions_v2')
                .select('visitor_id, started_at, view_count, purchase_completed')
                .order('started_at', { ascending: false });

            const merged: UserIdentity[] = (dnaData || []).map(d => {
                const session = sessionData?.find(s => s.visitor_id === d.visitor_id);
                return {
                    visitor_id: d.visitor_id,
                    user_id: d.user_id,
                    email: d.profiles?.email,
                    full_name: d.profiles?.full_name,
                    dna: {
                        engagement_score: d.engagement_score,
                        shopping_frequency: d.shopping_frequency,
                        feature_adoption: d.feature_adoption
                    },
                    last_session: session ? {
                        started_at: session.started_at,
                        view_count: session.view_count,
                        outcome: session.purchase_completed ? 'Conversion' : 'Browsing'
                    } : undefined
                };
            });

            setIdentities(merged);
        } catch (err) {
            console.error("Intelligence Link Failure:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchIdentities();
    }, [fetchIdentities]);

    const filtered = identities.filter(i =>
        i.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.visitor_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="p-24 flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Dna className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Compiling User DNA...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-12 animate-in fade-in duration-700 text-left selection:bg-primary/20">

            {/* EXECUTIVE HEADER */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Autonomous Mapping Active</span>
                    </div>
                    <h1 className="text-5xl font-black text-foreground uppercase tracking-tighter">User Intelligence</h1>
                    <p className="text-slate-500 text-sm font-medium italic">Mapping Every Journey. Decoding Every Persona.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Identify by ID or Email..."
                            className="h-14 w-80 rounded-2xl border-slate-100 bg-white pl-12 font-bold text-xs shadow-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                    <Button onClick={fetchIdentities} variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50">
                        <RefreshCcw className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>
            </header>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Personas', val: identities.length, icon: Users, color: 'primary' },
                    { label: 'High Intent', val: identities.filter(i => (i.dna?.engagement_score || 0) > 80).length, icon: Zap, color: 'emerald' },
                    { label: 'Avg Engagement', val: Math.round(identities.reduce((s, i) => s + (i.dna?.engagement_score || 0), 0) / identities.length) + '%', icon: Activity, color: 'indigo' },
                    { label: 'System Uptime', val: '99.9%', icon: ShieldCheck, color: 'primary' },
                ].map(stat => (
                    <Card key={stat.label} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", `bg-${stat.color}/10 text-${stat.color}`)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                            <p className="text-2xl font-black text-foreground tracking-tighter">{stat.val}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* IDENTITY GRID */}
            <div className="grid grid-cols-1 gap-4">
                <div className="px-10 flex items-center text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">
                    <span className="flex-1">Identity Node</span>
                    <span className="w-64">Behavioral DNA</span>
                    <span className="w-48 text-center">Last Pulse</span>
                    <span className="w-32 text-center">Outcome</span>
                    <span className="w-12"></span>
                </div>

                {filtered.map(identity => (
                    <Link key={identity.visitor_id} href={`/admin/intelligence/${identity.visitor_id}`}>
                        <Card className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all flex items-center group cursor-pointer">
                            <div className="flex-1 flex items-center gap-6 min-w-0">
                                <div className="h-14 w-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Users className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-foreground uppercase tracking-tight truncate">
                                        {identity.full_name || identity.visitor_id.substring(0, 12)}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                        {identity.email || 'Anonymous Voyager'}
                                    </p>
                                </div>
                            </div>

                            <div className="w-64 flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(245,160,0,0.5)]"
                                            style={{ width: `${identity.dna?.engagement_score || 0}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-slate-300">
                                        <span>Engagement</span>
                                        <span>{identity.dna?.engagement_score || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-48 flex flex-col items-center">
                                <p className="text-[10px] font-black text-foreground">{identity.last_session ? new Date(identity.last_session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{identity.last_session?.view_count || 0} Pages Scanned</p>
                            </div>

                            <div className="w-32 flex justify-center">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                    identity.last_session?.outcome === 'Conversion'
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-slate-50 text-slate-400 border-slate-100"
                                )}>
                                    {identity.last_session?.outcome || 'Browsing'}
                                </span>
                            </div>

                            <div className="w-12 flex justify-end">
                                <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}

                {filtered.length === 0 && (
                    <div className="py-32 text-center space-y-6 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
                        <Dna size={48} className="mx-auto text-slate-200 opacity-20" />
                        <p className="text-slate-300 font-black uppercase tracking-[0.4em]">Identity Not Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
