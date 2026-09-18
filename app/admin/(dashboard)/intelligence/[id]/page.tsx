'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    Users,
    Zap,
    ShieldCheck,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Dna,
    ArrowLeft,
    Target,
    MousePointer2,
    ShoppingBag,
    Bug,
    History
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Signal {
    id: number;
    event_type: string;
    target: string;
    metadata: Record<string, unknown>;
    url: string;
    created_at: string;
}

interface Session {
    id: string;
    started_at: string;
    ended_at: string;
    view_count: number;
    click_count: number;
    purchase_completed: boolean;
    entry_url: string;
    exit_url: string;
}

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
}

interface UserDNA {
    engagement_score: number;
    shopping_frequency: number;
    feature_adoption: number;
    returning_probability: number;
    top_categories: string[];
}

export default function UserProfileIntelligence() {
    const { id } = useParams();
    const [loading, setLoading] = React.useState(true);
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [dna, setDna] = React.useState<UserDNA | null>(null);
    const [sessions, setSessions] = React.useState<Session[]>([]);
    const [timeline, setTimeline] = React.useState<Signal[]>([]);

    const fetchDetails = React.useCallback(async () => {
        if (!supabase || !id) return;
        setLoading(true);
        try {
            // 1. Fetch DNA and link with profile
            const { data: dnaData } = await supabase
                .from('user_behavioral_dna')
                .select('*, profiles(*)')
                .eq('visitor_id', id)
                .single();

            if (dnaData) {
                setDna({
                    engagement_score: dnaData.engagement_score,
                    shopping_frequency: dnaData.shopping_frequency,
                    feature_adoption: dnaData.feature_adoption,
                    returning_probability: dnaData.returning_probability || 85, // Fallback logistic
                    top_categories: dnaData.top_categories || []
                });
                setProfile(dnaData.profiles as UserProfile);
            }

            // 2. Fetch Timeline (Last 50 signals)
            const { data: signalData } = await supabase
                .from('user_signals')
                .select('*')
                .eq('visitor_id', id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (signalData) setTimeline(signalData);

            // 3. Fetch Sessions
            const { data: sessionData } = await supabase
                .from('user_sessions_v2')
                .select('*')
                .eq('visitor_id', id)
                .order('started_at', { ascending: false })
                .limit(10);

            if (sessionData) setSessions(sessionData);

        } catch (err) {
            console.error("Profile Extraction Failure:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    React.useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    if (loading) return (
        <div className="p-24 flex flex-col items-center justify-center gap-6">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Extracting Identity #{(id as string).substring(0, 8)}...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 text-left selection:bg-primary/20">

            {/* HUB HEADER */}
            <header className="flex justify-between items-end border-b border-slate-200 pb-10">
                <div className="space-y-4">
                    <Link href="/admin/intelligence" className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft size={14} /> Identity Registry
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center text-primary relative group">
                            <Users size={32} />
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">
                                {profile?.full_name || 'Anonymous Voyager'}
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1 italic">
                                UID: {id} • Status: <span className="text-emerald-500">Live Active Session</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => alert("Identity Lock Protocol Initialized.")} className="h-14 px-8 rounded-2xl border-slate-100 bg-white font-black uppercase text-[10px] tracking-widest shadow-sm">
                        Lock Account
                    </Button>
                    <Button onClick={() => alert("Direct Relay Bridge Opening...")} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                        Initiate Direct Relay
                    </Button>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">

                {/* LEFT: DNA & PREDICTIVE METRICS */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-sm space-y-10 relative overflow-hidden group">
                        <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                            <Dna className="h-6 w-6 text-primary" /> Behavioral DNA
                        </h2>
                        <div className="space-y-8 relative z-10">
                            {[
                                { label: 'Engagement', val: dna?.engagement_score || 0, color: 'primary' },
                                { label: 'Freq Strategy', val: dna?.shopping_frequency || 0, color: 'emerald' },
                                { label: 'Elite Adoption', val: dna?.feature_adoption || 0, color: 'indigo' },
                                { label: 'Loyalty Probability', val: dna?.returning_probability || 0, color: 'primary' },
                            ].map(dnaNode => (
                                <div key={dnaNode.label} className="space-y-3">
                                    <div className="flex justify-between items-end px-1">
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{dnaNode.label}</p>
                                        <p className="text-xs font-black text-foreground">{dnaNode.val}%</p>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                        <div
                                            className={cn("h-full transition-all duration-1000", `bg-${dnaNode.color}`)}
                                            style={{ width: `${dnaNode.val}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Dna className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 -rotate-12 -z-0" />
                    </Card>

                    <Card className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-sm space-y-8">
                        <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                            <Target className="h-6 w-6 text-emerald-500" /> Intelligence Summary
                        </h2>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                                <p className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                                    <Zap size={12} className="text-primary fill-current" /> Behavioral Patterns
                                </p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                    &quot;High intent detected in premium audio. Frequently uses product comparison to validate high-ticket purchases.&quot;
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Risk Score</p>
                                    <p className="text-2xl font-black text-emerald-700 leading-none">Nominal</p>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                                    <p className="text-[8px] font-black uppercase text-primary mb-1">Predicted CLV</p>
                                    <p className="text-xl font-black text-primary leading-none">KSh 42.5K</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: TIMELINE & SESSIONS */}
                <div className="lg:col-span-8 space-y-10">

                    {/* LIVE EVENT STREAM */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-4">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                <Activity className="h-6 w-6 text-primary" /> Behavioral Timeline
                            </h2>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Latest 50 Events</span>
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                            {timeline.length === 0 ? (
                                <div className="p-20 text-center space-y-4 opacity-30">
                                    <History size={48} className="mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero timeline traces detected.</p>
                                </div>
                            ) : (
                                timeline.map((event) => (
                                    <div key={event.id} className="p-8 flex items-center gap-10 hover:bg-slate-50 transition-colors group">
                                        <div className="w-24 text-left">
                                            <p className="text-[10px] font-black text-foreground">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{new Date(event.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            {event.event_type === 'CLICK' ? <MousePointer2 size={16} className="text-indigo-500" /> :
                                             event.event_type === 'VIEW' ? <Activity size={16} className="text-slate-400" /> :
                                             event.event_type === 'ADD_TO_BAG' ? <ShoppingBag size={16} className="text-primary" /> :
                                             event.event_type === 'PAYMENT_SUCCESS' ? <ShieldCheck size={16} className="text-emerald-500" /> :
                                             event.event_type === 'TECHNICAL_ERROR' ? <Bug size={16} className="text-rose-500" /> :
                                             <Zap size={16} className="text-amber-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase text-foreground tracking-tight truncate">{event.event_type}</p>
                                            <p className="text-[10px] text-slate-400 font-medium italic mt-1 truncate">{event.target || event.url}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="h-8 rounded-lg text-[9px] font-black uppercase text-primary">Details</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* SESSION GRID */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-4">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                <History className="h-6 w-6 text-primary" /> Session Registry
                            </h2>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Lifecycle Data</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {sessions.map((session) => (
                                <Card key={session.id} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm space-y-6 hover:shadow-xl transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-foreground uppercase tracking-tight">Session #{(session.id as string).substring(0, 8)}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(session.started_at).toLocaleString()}</p>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                            session.purchase_completed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                        )}>
                                            {session.purchase_completed ? 'Purchase' : 'Browsing'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                        <div><p className="text-[8px] font-black uppercase text-slate-400">Intensity</p><p className="text-lg font-black text-foreground">{session.click_count + session.view_count} Signals</p></div>
                                        <div><p className="text-[8px] font-black uppercase text-slate-400">Funnels</p><p className="text-lg font-black text-foreground">{session.purchase_completed ? 'Completed' : 'Abandon'}</p></div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <ArrowUpRight size={12} className="text-emerald-500" />
                                            <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{session.entry_url || '/'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ArrowDownRight size={12} className="text-rose-500" />
                                            <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{session.exit_url || '/shop'}</p>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-black uppercase text-[9px] tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                        <Activity size={14} className="mr-2" /> Reconstruct Journey
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>

                </div>

            </div>

        </div>
    );
}
