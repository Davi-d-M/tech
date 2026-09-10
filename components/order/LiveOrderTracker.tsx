'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    CheckCircle2,
    Package,
    Truck,
    Home,
    ShieldCheck,
    Zap,
    Phone,
    MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MissionMap = dynamic(() => import('@/components/rider/MissionMap'), {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />
});

interface OrderStatus {
    id: number;
    status: string;
    customer_name: string;
    rider_name?: string;
    rider_phone?: string;
    latitude?: number;
    longitude?: number;
    pickup_lat?: number;
    pickup_lng?: number;
    created_at: string;
    estimated_arrival?: string;
}

const STEPS = [
    { label: 'Confirmed', icon: CheckCircle2, statuses: ['Paid', 'Pending'] },
    { label: 'Preparing', icon: Package, statuses: ['Processing', 'Stock Reserved'] },
    { label: 'Dispatched', icon: Truck, statuses: ['Dispatched', 'Picked Up'] },
    { label: 'Arriving', icon: Home, statuses: ['Delivered', 'Completed'] },
];

export default function LiveOrderTracker({ orderId }: { orderId: number }) {
    const [order, setOrder] = React.useState<OrderStatus | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchOrder = React.useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (data) setOrder(data as OrderStatus);
        setLoading(false);
    }, [orderId]);

    React.useEffect(() => {
        fetchOrder();

        const channel = supabase
            ?.channel(`customer_order_${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(payload.new as OrderStatus);
            })
            .subscribe();

        return () => {
            if (supabase) supabase.removeChannel(channel!);
        };
    }, [fetchOrder, orderId]);

    if (loading) return <div className="h-64 bg-slate-50 rounded-[3rem] animate-pulse" />;
    if (!order) return <div className="p-10 text-center font-black uppercase text-slate-300">Order not found</div>;

    const currentStepIndex = STEPS.findIndex(s => s.statuses.includes(order.status));
    const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Status Timeline */}
            <div className="flex justify-between items-start px-4">
                {STEPS.map((step, i) => (
                    <div key={step.label} className="flex flex-col items-center gap-3 relative flex-1">
                        {i < STEPS.length - 1 && (
                            <div className={cn(
                                "absolute top-5 left-1/2 w-full h-1 z-0",
                                i < activeStep ? "bg-primary" : "bg-slate-100"
                            )} />
                        )}
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center relative z-10 transition-all duration-500",
                            i <= activeStep ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-white border border-slate-100 text-slate-300"
                        )}>
                            <step.icon size={20} />
                        </div>
                        <p className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            i <= activeStep ? "text-primary" : "text-slate-300"
                        )}>{step.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Tracker Card */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden text-left relative">
                <div className="p-10 space-y-10">
                    <header className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Extraction Live</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Order Status</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Est. Arrival</p>
                            <p className="text-2xl font-black text-foreground">18 MIN</p>
                        </div>
                    </header>

                    {/* Mission Intelligence */}
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                                    <Truck size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Rider Unit</p>
                                    <p className="text-xl font-black text-foreground uppercase tracking-tight">{order.rider_name || 'Dispatching...'}</p>
                                </div>
                            </div>
                            {order.rider_phone && (
                                <div className="flex gap-2">
                                    <button onClick={() => window.open(`tel:${order.rider_phone}`)} className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                                        <Phone size={20} />
                                    </button>
                                    <button onClick={() => window.open(`https://wa.me/${order.rider_phone}`)} className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <MessageCircle size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tactical Map */}
                    <div className="h-80 w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
                        <MissionMap mission={order} />
                    </div>

                    <footer className="pt-4 flex items-center gap-4 text-slate-400">
                        <ShieldCheck size={16} />
                        <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                            Secured by Apex Shield. Your rider is approaching with priority clearance.
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
