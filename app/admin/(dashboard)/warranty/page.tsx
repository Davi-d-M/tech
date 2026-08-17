'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldAlert,
    RefreshCcw,
    Smartphone,
    Truck,
    Wrench,
    CheckCircle2,
    Clock,
    Search,
    AlertTriangle,
    Loader2,
    MessageSquare,
    Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface WarrantyCase {
    id: number;
    order_id: number;
    serial_number: string;
    customer_complaint: string;
    diagnostic_notes: string;
    resolution_type: string;
    status: string;
    supplier_notified: boolean;
    created_at: string;
    product_name?: string;
}

export default function WarrantyHub() {
    const { role } = useAdmin();
    const [cases, setCases] = React.useState<WarrantyCase[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filter, setFilter] = React.useState('all');

    const fetchCases = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // Join with orders and products for deep intel
            const { data, error } = await supabase
                .from('warranty_cases')
                .select(`
                    *,
                    orders (id, customer_name),
                    products (id, name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = (data || []).map(c => ({
                ...c,
                product_name: c.products?.name || 'Unknown Gadget'
            }));

            setCases(formatted);
        } catch (err) {
            console.error("Diagnostic Uplink Failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const stats = React.useMemo(() => {
        return {
            total: cases.length,
            active: cases.filter(c => c.status !== 'Resolved').length,
            repairs: cases.filter(c => c.status === 'Repairing').length,
            pickups: cases.filter(c => c.status === 'Pending_Pickup').length
        };
    }, [cases]);

    const filteredCases = cases.filter(c =>
        (c.serial_number || '').includes(searchQuery) ||
        (c.order_id || '').toString().includes(searchQuery) ||
        (c.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Reverse Logistics Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Warranty Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Technical diagnostics, repair flows, and replacement logistics.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchCases} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Hub
                    </Button>
                </div>
            </header>

            {/* Tactical HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Cases', val: stats.active, icon: ShieldAlert, color: 'rose' },
                    { label: 'Pending Pickup', val: stats.pickups, icon: Truck, color: 'primary' },
                    { label: 'In Workshop', val: stats.repairs, icon: Wrench, color: 'indigo' },
                    { label: 'SLA Health', val: '94%', icon: Clock, color: 'emerald' },
                ].map(item => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                item.color === 'rose' ? "bg-rose-50 text-rose-500" :
                                item.color === 'primary' ? "bg-primary/5 text-primary" :
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                "bg-emerald-50 text-emerald-600"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                    </Card>
                ))}
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Serial, IMEI or Order ID..."
                        className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                </div>
            </div>

            {loading ? (
                <div className="p-32 text-center flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Accessing Warranty Vault...</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="p-32 text-center bg-white rounded-[3.5rem] border border-slate-100 opacity-40 italic">
                    <Box size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">All units verified. Zero open failures detected.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredCases.map(c => (
                        <Card key={c.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                                <div className="space-y-6 flex-1 text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-105 transition-transform">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{c.product_name}</h3>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Serial: {c.serial_number || 'NOT LOGGED'}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[8px] font-black uppercase text-slate-400">Order #{c.order_id}</span>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                c.status === 'Pending_Pickup' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                c.status === 'Repairing' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                                "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                            )}>
                                                {c.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-20 space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
                                            <p className="text-[9px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><MessageSquare size={12} /> Customer Complaint</p>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed italic">&quot;{c.customer_complaint}&quot;</p>
                                            <AlertTriangle className="absolute -bottom-6 -right-6 h-24 w-24 text-rose-500/5 rotate-12" />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all">
                                                <Wrench className="h-4 w-4 mr-2 text-indigo-500" /> Start Diagnostic
                                            </Button>
                                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 transition-all">
                                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Mark Resolved
                                            </Button>
                                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all">
                                                <AlertTriangle className="h-4 w-4 mr-2 text-rose-500" /> Reject Claim
                                            </Button>
                                            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all">
                                                <Truck className="h-4 w-4 mr-2 text-primary" /> Assign Courier
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
