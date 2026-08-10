'use client';

import { useState, useEffect } from 'react';
import { Bell, X, ShieldAlert, Package, Truck, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    label: string;
    meta: string;
    time: string;
    url: string;
    isRead: boolean;
}

export default function NotificationCenter({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', type: 'critical', label: 'Payment Discrepancy', meta: 'KES 800 mismatch in Paystack sync', time: '2m ago', url: '/admin/finance', isRead: false },
        { id: '2', type: 'warning', label: 'Critical Stock Alert', meta: 'SIM Card Tray — 3 units remaining', time: '11m ago', url: '/admin/upload', isRead: false },
        { id: '3', type: 'info', label: 'Rider Delayed', meta: 'Rider John K. hasn\'t moved for 15m', time: '23m ago', url: '/admin/dispatch', isRead: true },
        { id: '4', type: 'success', label: 'Campaign Completed', meta: 'Flash Sale broadcast reached 1,240 users', time: '1h ago', url: '/admin/broadcast', isRead: true },
    ]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                    {notifications.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <CheckCircle2 className="h-10 w-10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sky clear, Commander.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <Link key={n.id} href={n.url} onClick={() => setIsOpen(false)}>
                                <div className={cn(
                                    "p-6 rounded-[2rem] border transition-all flex gap-4 group relative",
                                    n.isRead ? "bg-slate-50/50 border-border opacity-60" : "bg-white border-primary/20 shadow-xl"
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
                                    {!n.isRead && (
                                        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="p-8 border-t border-border bg-slate-50/50">
                    <Button variant="outline" className="w-full h-12 rounded-xl border-border font-black uppercase text-[10px] tracking-widest hover:bg-white">
                        Clear All History
                    </Button>
                </div>
            </aside>
        </>
    );
}
