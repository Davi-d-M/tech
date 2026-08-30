'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Zap,
    ShoppingBag,
    Eye,
    Search,
    ArrowLeft,
    Clock,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Signal {
    id: number;
    event_type: string;
    target: string;
    url: string;
    created_at: string;
    metadata: Record<string, unknown>;
}

interface CustomerProfile {
    id: string;
    full_name: string;
    phone_number: string;
}

export default function CustomerJourneyReplay() {
    const params = useParams();
    const phone = params.phone as string;
    const [signals, setSignals] = React.useState<Signal[]>([]);
    const [profile, setProfile] = React.useState<CustomerProfile | null>(null);
    const [loading, setLoading] = React.useState(true);

    const loadJourney = React.useCallback(async () => {
        if (!supabase || !phone) return;
        setLoading(true);
        try {
            // 1. Resolve Profile and User ID
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone_number', phone)
                .single();

            if (profileData) {
                setProfile(profileData as CustomerProfile);
                // 2. Fetch all signals linked to this user or their known session
                const { data: sigs } = await supabase
                    .from('user_signals')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                setSignals((sigs || []) as Signal[]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [phone]);

    React.useEffect(() => {
        loadJourney();
    }, [loadJourney]);

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>;

    const events = signals.map(s => {
        let icon = <Eye size={14} />;
        let color = 'bg-slate-50 text-slate-500';

        if (s.event_type === 'ADD_TO_BAG') { icon = <ShoppingBag size={14} />; color = 'bg-emerald-50 text-emerald-600'; }
        if (s.event_type === 'CLICK') { icon = <Zap size={14} />; color = 'bg-amber-50 text-amber-600'; }
        if (s.event_type === 'SEARCH') { icon = <Search size={14} />; color = 'bg-indigo-50 text-indigo-600'; }
        if (s.event_type === 'CHECKOUT_START') { icon = <ShieldCheck size={14} />; color = 'bg-primary text-white'; }

        return { ...s, icon, color };
    });

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div className="flex items-center gap-6">
                    <Link href={`/admin/customers/${phone}`}>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <History className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Behavioral Replay</span>
                        </div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Journey Audit</h1>
                        <p className="text-muted-foreground text-sm font-medium mt-1">Tracing tactical footprints for {profile?.full_name || phone}.</p>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-[2rem] bg-secondary flex items-center justify-center text-foreground text-xl font-black">
                                {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase text-foreground">{profile?.full_name || 'Guest Unit'}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{phone}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-50">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-slate-400">Lifetime Missions</span>
                                <span className="text-sm font-black text-foreground">12 Units</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-slate-400">Acquisition</span>
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Direct Search</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[3rem] bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Intelligence</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-bold uppercase italic">&quot;Customer prefers night browsing.&quot;</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Target className="h-4 w-4 text-emerald-400" />
                                    <p className="text-xs font-bold uppercase italic">&quot;92% Conversion likelihood on Audio.&quot;</p>
                                </div>
                            </div>
                        </div>
                        <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5 rotate-12" />
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] ml-6 mb-8">Chronological Stream</h3>

                        <div className="relative pl-10 space-y-12">
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-10 top-2 bottom-2 w-px bg-slate-100" />

                            {events.length === 0 ? (
                                <div className="py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest">Awaiting tactical data...</div>
                            ) : events.map((event, i) => (
                                <div key={i} className="relative animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    {/* Timeline Pip */}
                                    <div className={cn("absolute -left-12 top-1 h-4 w-4 rounded-full border-4 border-slate-50 z-10", event.event_type === 'CHECKOUT_START' ? 'bg-primary' : 'bg-slate-200')} />

                                    <div className="flex items-start gap-6">
                                        <span className="text-[10px] font-black text-slate-300 font-mono w-16 shrink-0 mt-1">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                        <Card className="flex-1 p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl hover:border-primary/20 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", event.color)}>
                                                    {event.icon}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{event.event_type}</p>
                                                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                        {event.target || event.url || 'Operation Recorded'}
                                                    </h4>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-all" />
                                        </Card>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
