'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Zap,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScheduledPost {
    id: string;
    platform: string;
    status: string;
    scheduled_at: string;
    content_id: string;
}

export default function ContentCalendar() {
    const [posts, setPosts] = React.useState<ScheduledPost[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [viewDate, setViewDate] = React.useState(new Date());

    const fetchScheduled = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('publishing_jobs')
                .select('id, platform, status, scheduled_at, content_id')
                .order('scheduled_at', { ascending: true });
            setPosts(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchScheduled();
    }, [fetchScheduled]);

    const days = [...Array(14)].map((_, i) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10 text-left">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Content Timeline</h2>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Mission Scheduling & Sequence</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 7)))}><ChevronLeft size={18} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 7)))}><ChevronRight size={18} /></Button>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 pt-4">
                {days.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayPosts = posts.filter(p => p.scheduled_at?.startsWith(dateStr));
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                        <div key={i} className="flex-shrink-0 w-64 space-y-6">
                            <div className={cn(
                                "p-4 rounded-2xl text-center border transition-all",
                                isToday ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">{date.toLocaleDateString('en-KE', { weekday: 'short' })}</p>
                                <p className="text-2xl font-black">{date.getDate()}</p>
                                <p className="text-[7px] font-bold uppercase mt-1">{date.toLocaleDateString('en-KE', { month: 'short' })}</p>
                            </div>

                            <div className="space-y-3 min-h-[300px]">
                                {dayPosts.length === 0 ? (
                                    <div className="h-40 rounded-[2rem] border-2 border-dashed border-slate-50 flex items-center justify-center">
                                        <p className="text-[8px] font-black text-slate-200 uppercase tracking-widest italic">Zero Tasks</p>
                                    </div>
                                ) : dayPosts.map(p => (
                                    <div key={p.id} className="p-5 rounded-3xl bg-white border border-slate-50 shadow-sm space-y-4 hover:shadow-xl transition-all group border-l-4 border-l-primary">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[7px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">{p.platform}</span>
                                            <p className="text-[8px] font-black text-slate-300">{new Date(p.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-foreground leading-tight line-clamp-2">Campaign Element #{p.content_id.substring(0, 5)}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                {p.status === 'published' ? (
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                ) : p.status === 'failed' ? (
                                                    <AlertTriangle size={12} className="text-rose-500" />
                                                ) : (
                                                    <Clock size={12} className="text-amber-500 animate-pulse" />
                                                )}
                                                <span className="text-[7px] font-black uppercase text-slate-400">{p.status}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg group-hover:bg-slate-50"><ChevronRight size={12} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-8 rounded-[3rem] bg-indigo-50 border border-indigo-100 flex items-center justify-between mx-2">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Target size={20} /></div>
                    <p className="text-[10px] font-black uppercase text-indigo-700">Autopilot Integrity: High (24 Tasks Locked)</p>
                </div>
                <Button className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase text-[8px] tracking-widest shadow-xl shadow-indigo-100">Synchronize All Nodes</Button>
            </div>
        </Card>
    );
}
