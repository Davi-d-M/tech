'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity,
    Search,
    Eye,
    MousePointer2,
    ShoppingCart,
    CreditCard,
    CheckCircle2,
    ShieldAlert,
    Clock,
    ChevronRight,
    Loader2,
    Smartphone,
    Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface Signal {
    id: number;
    event_type: string;
    target: string;
    url: string;
    created_at: string;
    metadata: any;
}

export default function CustomerJourney({ userId }: { userId: string }) {
    const [signals, setSignals] = React.useState<Signal[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchJourney = React.useCallback(async () => {
        if (!supabase || !userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_signals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSignals(data || []);
        } catch (err) {
            console.error("Journey Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => {
        fetchJourney();
    }, [fetchJourney]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'SEARCH': return Search;
            case 'VIEW':
            case 'PRODUCT_VIEW': return Eye;
            case 'CLICK': return MousePointer2;
            case 'ADD_TO_BAG': return ShoppingCart;
            case 'CHECKOUT_START': return CreditCard;
            case 'PAYMENT_SUCCESS': return CheckCircle2;
            case 'PAYMENT_FAIL': return ShieldAlert;
            case 'IDENTITY_BRIDGE': return Activity;
            case '3D_INTERACT': return Monitor;
            default: return Activity;
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Reconstructing Session...</p>
        </div>
    );

    if (signals.length === 0) return (
        <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black uppercase text-slate-400">Zero active footprints detected.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.4em]">Journey Reconstruction</h3>
                <span className="text-[9px] font-black uppercase text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/20">{signals.length} Signals Captured</span>
            </div>

            <div className="space-y-4">
                {signals.map((s, i) => {
                    const Icon = getIcon(s.event_type);
                    return (
                        <div key={s.id} className="relative flex gap-6 group">
                            {/* Vertical Timeline line */}
                            {i < signals.length - 1 && (
                                <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                            )}

                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500 z-10",
                                s.event_type.includes('PAYMENT_SUCCESS') ? "bg-emerald-500 text-white scale-110" :
                                s.event_type.includes('FAIL') ? "bg-rose-500 text-white" :
                                "bg-white border border-slate-100 text-slate-400 group-hover:border-primary/20 group-hover:text-primary"
                            )}>
                                <Icon size={24} />
                            </div>

                            <Card className="flex-1 p-6 rounded-[2rem] border border-slate-50 group-hover:border-primary/10 transition-all group-hover:shadow-xl bg-white/50 backdrop-blur-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary">{s.event_type}</span>
                                            <span className="text-[10px] font-bold text-slate-300">•</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <h4 className="font-black text-foreground uppercase tracking-tight text-sm">
                                            {s.target || s.url}
                                        </h4>
                                        <p className="text-[10px] font-medium text-slate-400 mt-1 italic truncate max-w-md">
                                            Path: {s.url}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        {s.metadata?.device_type && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded text-[7px] font-black text-slate-400 uppercase">
                                                {s.metadata.device_type === 'Mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                                                {s.metadata.device_type}
                                            </div>
                                        )}
                                        <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
