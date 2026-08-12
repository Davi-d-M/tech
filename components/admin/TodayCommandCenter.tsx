'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShoppingBag, Truck, Package, MessageSquare, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CommandStats {
    attention_orders: number;
    offline_riders: number;
    low_stock: number;
    support_tickets: number;
}

export default function TodayCommandCenter() {
    const [stats, setStats] = React.useState<CommandStats>({
        attention_orders: 0,
        offline_riders: 0,
        low_stock: 0,
        support_tickets: 0
    });

    React.useEffect(() => {
        async function fetchCommandData() {
            if (!supabase) return;
            try {
                const [ordersRes, ridersRes, productsRes, messagesRes] = await Promise.all([
                    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'Pending'),
                    supabase.from('rider_status').select('id', { count: 'exact' }).eq('status', 'Offline'),
                    supabase.from('products').select('id', { count: 'exact' }).lte('stock', 5),
                    supabase.from('messages').select('id', { count: 'exact' }).eq('status', 'New')
                ]);

                setStats({
                    attention_orders: ordersRes.count || 0,
                    offline_riders: ridersRes.count || 0,
                    low_stock: productsRes.count || 0,
                    support_tickets: messagesRes.count || 0
                });
            } catch {
                console.error("Command Center Link unstable.");
            }
        }

        fetchCommandData();
        const interval = setInterval(fetchCommandData, 30000);
        return () => clearInterval(interval);
    }, []);

    const indicators = [
        {
            label: 'Orders Need Attention',
            val: stats.attention_orders,
            href: '/admin/orders',
            icon: ShoppingBag,
            color: 'rose',
            status: stats.attention_orders > 0 ? 'CRITICAL' : 'STABLE'
        },
        {
            label: 'Riders Offline',
            val: stats.offline_riders,
            href: '/admin/dispatch',
            icon: Truck,
            color: 'amber',
            status: 'MONITORING'
        },
        {
            label: 'Products Low Stock',
            val: stats.low_stock,
            href: '/admin/upload',
            icon: Package,
            color: 'primary',
            status: stats.low_stock > 5 ? 'REORDER' : 'SAFE'
        },
        {
            label: 'Support Tickets',
            val: stats.support_tickets,
            href: '/admin/messages',
            icon: MessageSquare,
            color: 'indigo',
            status: 'ACTIVE'
        }
    ];

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Today&apos;s Command Center</h2>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border">Live Intelligence</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {indicators.map((item) => (
                    <Link key={item.label} href={item.href} className="flex h-full">
                        <div className={cn(
                            "p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden flex flex-col justify-between w-full h-full",
                            item.val > 0 && item.color === 'rose' && "border-rose-100 bg-rose-50/50"
                        )}>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-sm",
                                    item.color === 'rose' ? "bg-rose-50 text-rose-500" :
                                    item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                    item.color === 'primary' ? "bg-primary/10 text-primary" :
                                    "bg-indigo-50 text-indigo-500"
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.status}</p>
                                    <h3 className="text-3xl font-black text-foreground tracking-tighter">{item.val}</h3>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase text-foreground/70 tracking-tight leading-tight max-w-[120px]">{item.label}</p>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="h-4 w-4 text-primary" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
