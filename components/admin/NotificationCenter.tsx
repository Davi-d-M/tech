'use client';

import * as React from 'react';
import { Bell, X, ShieldAlert, Package, Truck, ChevronRight, CheckCircle2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { scanForExceptions } from '@/lib/apex-os/intelligence';
import { supabase } from '@/lib/supabaseClient';
import { runSingularityAutomation, runRevenueRecoverySync } from '@/lib/apex-os/automation';

interface Notification {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    label: string;
    meta: string;
    time: string;
    url: string;
    is_read: boolean;
}

export default function NotificationCenter({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchSignals = async () => {
        if (!supabase) return;
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('system_signals')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data.map(d => ({
                    id: d.id,
                    type: d.type as Notification['type'],
                    label: d.label,
                    meta: d.meta,
                    time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    url: d.url,
                    is_read: d.is_read
                })));
            }
        } catch (err) {
            console.error("Signal Retrieval Failure:", err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (isOpen) fetchSignals();
    }, [isOpen]);

    const markAllRead = async () => {
        if (!supabase || notifications.length === 0) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            const { error } = await supabase
                .from('system_signals')
                .update({ is_read: true })
                .in('id', unreadIds);

            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (err) {
            console.error("Signal Sync Error:", err);
        }
    };

    const runSystemScan = async () => {
        if (!supabase) return;
        setIsLoading(true);
        try {
            // 1. Run Intelligence Exceptions
            const exceptions = await scanForExceptions();
            if (exceptions.length > 0) {
                const signals = exceptions.map(ex => ({
                    type: ex.severity.toLowerCase(),
                    label: ex.title,
                    meta: ex.description,
                    url: ex.order_id ? `/admin/orders` : '/admin'
                }));

                await supabase.from('system_signals').insert(signals);
                await fetchSignals();
            }

            // 2. Run Operational Automation (Singularity)
            await runSingularityAutomation();

            // 3. Run Revenue Recovery Sync
            await runRevenueRecoverySync();

        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!supabase) return;
        if (!confirm("Are you sure you want to purge all signal history?")) return;

        setIsLoading(true);
        try {
            await supabase.from('system_signals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-[110] bg-background/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />

            {/* Panel */}
            <aside className="fixed inset-y-0 right-0 z-[120] w-[400px] bg-card border-l border-border shadow-2xl animate-in slide-in-from-right-4 duration-500 overflow-hidden flex flex-col">
                <header className="p-8 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">Intelligence Alerts</h2>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{unreadCount} New Signals</p>
                        </div>
                    </div>
                    <button onClick={markAllRead} className="text-[8px] font-black uppercase text-primary hover:underline">Mark all read</button>
                    <button onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                    {isLoading ? (
                        <div className="py-20 text-center opacity-30 animate-pulse">
                            <RefreshCcw className="h-10 w-10 mx-auto mb-4 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Scanning Grid...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <CheckCircle2 className="h-10 w-10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sky clear, Commander.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <Link key={n.id} href={n.url} onClick={() => setIsOpen(false)}>
                                <div className={cn(
                                    "p-6 rounded-[2rem] border transition-all flex gap-4 group relative",
                                    n.is_read ? "bg-slate-50/50 border-border opacity-60" : "bg-white border-primary/20 shadow-xl"
                                )}>
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        n.type === 'critical' ? "bg-rose-50 text-rose-500" :
                                        n.type === 'warning' ? "bg-amber-50 text-amber-500" :
                                        n.type === 'success' ? "bg-emerald-50 text-emerald-500" :
                                        "bg-indigo-50 text-indigo-500"
                                    )}>
                                        {n.type === 'critical' ? <ShieldAlert size={20} /> :
                                         n.type === 'warning' ? <Package size={20} /> :
                                         n.type === 'success' ? <CheckCircle2 size={20} /> :
                                         <Truck size={20} />}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[11px] font-black uppercase text-foreground leading-none truncate pr-4">{n.label}</p>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase whitespace-nowrap">{n.time}</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed line-clamp-2">{n.meta}</p>
                                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black uppercase text-primary">Engage Protocol</span>
                                            <ChevronRight className="h-3 w-3 text-primary" />
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="p-8 border-t border-border bg-slate-50/50 space-y-3">
                    <Button
                        onClick={runSystemScan}
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        Scan Operational Grid
                    </Button>
                    <Button
                        variant="outline"
                        onClick={clearHistory}
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl border-border font-black uppercase text-[10px] tracking-widest hover:bg-white"
                    >
                        Clear All History
                    </Button>
                </div>
            </aside>
        </>
    );
}
