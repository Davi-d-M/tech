'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, Clock, ShieldAlert, Zap, Truck, Package, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Exception {
    id: string;
    type: 'ORDER' | 'INVENTORY' | 'PAYMENT' | 'RIDER' | 'SYSTEM';
    label: string;
    time: string;
    severity: 'critical' | 'warning' | 'info';
    url: string;
}

export default function ExceptionCenter() {
    const [exceptions, setExceptions] = React.useState<Exception[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function scanForExceptions() {
            if (!supabase) return;

            const detected: Exception[] = [];
            const now = new Date();

            try {
                // 1. Scan for delayed orders (Pending > 2 hours)
                const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
                const { data: delayedOrders } = await supabase
                    .from('orders')
                    .select('id, created_at')
                    .eq('status', 'Pending')
                    .lt('created_at', twoHoursAgo)
                    .limit(2);

                delayedOrders?.forEach(o => detected.push({
                    id: `delayed-${o.id}`,
                    type: 'ORDER',
                    label: `Order #${o.id} delayed ${Math.round((now.getTime() - new Date(o.created_at).getTime()) / 60000)}m`,
                    time: 'Just now',
                    severity: 'critical',
                    url: '/admin/orders'
                }));

                // 2. Scan for critical inventory
                const { data: lowStock } = await supabase
                    .from('products')
                    .select('name, stock')
                    .lte('stock', 3)
                    .limit(2);

                lowStock?.forEach(p => detected.push({
                    id: `stock-${p.name}`,
                    type: 'INVENTORY',
                    label: `${p.name} — ${p.stock} units remaining`,
                    time: 'Recently',
                    severity: 'warning',
                    url: '/admin/upload'
                }));

                // 3. Scan for stalled riders (Active status but no heartbeat for 20m)
                const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
                const { data: stalledRiders } = await supabase
                    .from('rider_status')
                    .select('rider_name, updated_at')
                    .eq('status', 'Delivering')
                    .lt('updated_at', twentyMinsAgo)
                    .limit(2);

                stalledRiders?.forEach(r => detected.push({
                    id: `rider-stalled-${r.rider_name}`,
                    type: 'RIDER',
                    label: `Unit ${r.rider_name} stalled (No pulse for ${Math.round((now.getTime() - new Date(r.updated_at).getTime()) / 60000)}m)`,
                    time: 'Live',
                    severity: 'critical',
                    url: '/admin/dispatch'
                }));

                setExceptions(detected);
            } catch {
                console.error("Exception Scan failed.");
            } finally {
                setLoading(false);
            }
        }

        scanForExceptions();
        const interval = setInterval(scanForExceptions, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && exceptions.length === 0) return null;
    if (exceptions.length === 0) return null;

    const iconMap = {
        ORDER: Clock,
        INVENTORY: Package,
        PAYMENT: CreditCard,
        RIDER: Truck,
        SYSTEM: Zap
    };

    return (
        <section className="bg-white rounded-[3rem] border border-rose-100 p-10 relative overflow-hidden shadow-sm animate-in fade-in duration-1000">
            <div className="relative z-10 space-y-8 text-left">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm animate-pulse">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Exception Center</h2>
                    </div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                        {exceptions.length} Anomalies Detected
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exceptions.map(ex => {
                        const Icon = iconMap[ex.type];
                        return (
                            <Link key={ex.id} href={ex.url}>
                                <div className="p-6 rounded-3xl bg-slate-50 border border-border flex items-center justify-between group hover:bg-white hover:border-rose-200 transition-all hover:shadow-xl">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            ex.severity === 'critical' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{ex.type} &bull; {ex.time}</p>
                                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{ex.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-black text-primary uppercase">Resolve</span>
                                        <ChevronRight className="h-3 w-3 text-primary" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 h-64 w-64 text-rose-500/5 rotate-12 -z-0">
                <AlertTriangle size={256} />
            </div>
        </section>
    );
}
