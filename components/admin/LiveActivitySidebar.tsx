'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    ShoppingCart,
    UserPlus,
    CreditCard,
    Truck,
    MessageSquare,
    X,
    ChevronRight,
    Activity as ActivityIcon
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface ActivityEvent {
    id: string;
    label: string;
    time: string;
    type: 'order' | 'pay' | 'user' | 'rider' | 'review' | 'message';
    url: string;
    amount?: number;
    color: string;
}

export default function LiveActivitySidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const [events, setPulseEvents] = React.useState<ActivityEvent[]>([]);

    React.useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('enterprise-pulse');

        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: { new: { customer_name: string; total_price: number } }) => {
                const newEvent: ActivityEvent = {
                    id: Math.random().toString(),
                    label: `New Order from ${payload.new.customer_name}`,
                    time: 'Just now',
                    type: 'order',
                    url: '/admin/orders',
                    amount: payload.new.total_price,
                    color: 'primary'
                };
                setPulseEvents(prev => [newEvent, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.Paid' }, (payload: { new: { id: number } }) => {
                const newEvent: ActivityEvent = {
                    id: Math.random().toString(),
                    label: `Payment Verified for #${payload.new.id}`,
                    time: 'Just now',
                    type: 'pay',
                    url: '/admin/orders',
                    color: 'emerald'
                };
                setPulseEvents(prev => [newEvent, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                const newEvent: ActivityEvent = {
                    id: Math.random().toString(),
                    label: `New Customer Registered`,
                    time: 'Just now',
                    type: 'user',
                    url: '/admin/customers',
                    color: 'indigo'
                };
                setPulseEvents(prev => [newEvent, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rider_status' }, (payload: { new: { status: string; rider_name: string }; old: { status: string } }) => {
                if (payload.new.status === 'Idle' && payload.old.status === 'Offline') {
                    const newEvent: ActivityEvent = {
                        id: Math.random().toString(),
                        label: `Rider ${payload.new.rider_name} came Online`,
                        time: 'Just now',
                        type: 'rider',
                        url: '/admin/dispatch',
                        color: 'primary'
                    };
                    setPulseEvents(prev => [newEvent, ...prev].slice(0, 10));
                }
            })
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const iconMap = {
        order: ShoppingCart,
        pay: CreditCard,
        user: UserPlus,
        rider: Truck,
        review: MessageSquare,
        message: MessageSquare
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[110] bg-background/20 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Panel */}
            <aside className={cn(
                "fixed inset-y-0 right-0 z-[120] w-96 bg-card border-l border-border shadow-2xl transition-transform duration-500 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    <header className="p-8 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                <Zap className="h-6 w-6 fill-current" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">Live Pulse</h2>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-time Stream</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {events.length === 0 ? (
                            <div className="py-20 text-center space-y-4 opacity-30">
                                <ActivityIcon className="h-10 w-10 mx-auto animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Awaiting Uplink...</p>
                            </div>
                        ) : (
                            events.map((event) => {
                                const Icon = iconMap[event.type];
                                return (
                                    <Link
                                        key={event.id}
                                        href={event.url}
                                        onClick={() => setIsOpen(false)}
                                        className="block p-5 rounded-[2rem] bg-secondary border border-border hover:border-primary/20 hover:shadow-xl transition-all group animate-in slide-in-from-right-4"
                                    >
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                                event.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                                                event.color === 'indigo' ? "bg-indigo-500/10 text-indigo-500" :
                                                "bg-card text-primary"
                                            )}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[11px] font-black uppercase text-foreground leading-tight">{event.label}</p>
                                                    <span className="text-[8px] font-black text-muted-foreground uppercase shrink-0 ml-2">{event.time}</span>
                                                </div>
                                                {event.amount && <p className="text-sm font-black text-primary mt-1">{formatPrice(event.amount)}</p>}
                                                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[8px] font-black uppercase text-primary">Tactical View</span>
                                                    <ChevronRight className="h-3 w-3 text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    <div className="p-8 border-t border-border bg-secondary/50">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                            <span className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Satellite Link Stable
                            </span>
                            <span>v4.2-Titan</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
