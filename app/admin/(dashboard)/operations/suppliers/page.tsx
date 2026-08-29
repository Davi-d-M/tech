'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    RefreshCcw,
    Activity,
    Target,
    FileDown,
    Loader2,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Supplier {
    id: number;
    name: string;
    email: string;
    rating: number;
    fill_rate: number;
    on_time_dispatch_rate: number;
    defect_rate: number;
    verification_status: 'UnderReview' | 'Verified' | 'Suspended';
    business_registration_no?: string;
    location?: string;
}

export default function SupplierScorecards() {
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [filter, setFilter] = React.useState<'all' | 'pending'>('all');
    const [loading, setLoading] = React.useState(true);
    const [actionId, setActionId] = React.useState<number | null>(null);
    const [generatingPO, setGeneratingPO] = React.useState<number | null>(null);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const generatePO = async (supplier: Supplier) => {
        setGeneratingPO(supplier.id);
        try {
            if (!supabase) return;

            // 1. Fetch real low-stock items for this supplier
            const { data: products } = await supabase
                .from('products')
                .select('name, stock, cost_price, low_stock_alert')
                .eq('supplier_id', supplier.id)
                .lte('stock', 5); // Threshold

            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.text("PURCHASE ORDER", 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`PO Number: APEX-PO-${Date.now()}`, 20, 40);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

            doc.setFontSize(12);
            doc.text("SUPPLIER DETAILS:", 20, 60);
            doc.setFontSize(10);
            doc.text(`Name: ${supplier.name}`, 20, 65);
            doc.text(`Email: ${supplier.email}`, 20, 70);

            doc.setFontSize(12);
            doc.text("ORDER SUMMARY:", 20, 90);

            if (products && products.length > 0) {
                let y = 100;
                products.forEach((p, i) => {
                    doc.setFontSize(10);
                    doc.text(`${i + 1}. ${p.name} - Requesting replenishment (Current: ${p.stock})`, 20, y);
                    y += 7;
                });
            } else {
                doc.setFontSize(10);
                doc.text("No specific low-stock items flagged. General replenishment request.", 20, 100);
            }

            doc.save(`PO_${supplier.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            setMessage({ type: 'success', text: "Data-driven PO generated and logged. 📝" });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingPO(null);
        }
    };

    const fetchSuppliers = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('suppliers').select('*');
            if (error) throw error;
            setSuppliers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleApprove = async (supplier: Supplier) => {
        if (!supabase) return;
        setActionId(supplier.id);
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ verification_status: 'Verified', is_active: true })
                .eq('id', supplier.id);

            if (error) throw error;

            setMessage({ type: 'success', text: `${supplier.name} has been verified! 🚀` });
            fetchSuppliers();
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message });
        } finally {
            setActionId(null);
        }
    };

    const filteredSuppliers = React.useMemo(() => {
        if (filter === 'pending') return suppliers.filter(s => s.verification_status === 'UnderReview');
        return suppliers;
    }, [suppliers, filter]);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Procurement Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Supplier Scorecards</h1>

                    <div className="flex gap-2 p-1 bg-secondary rounded-xl border border-border w-fit">
                        {[
                            { id: 'all', label: 'All Partners' },
                            { id: 'pending', label: 'Pending Review' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id as 'all' | 'pending')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                    filter === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchSuppliers} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Performance
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    <Zap className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSuppliers.map(s => (
                    <Card key={s.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group text-left">
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl">
                                        {s.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">{s.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{s.email}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                    s.verification_status === 'Verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    s.verification_status === 'UnderReview' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                                    "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {s.verification_status === 'UnderReview' ? 'PENDING' : s.rating + ' Score'}
                                </span>
                            </div>

                            {s.verification_status === 'UnderReview' ? (
                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-3 text-amber-600">
                                        <AlertCircle size={16} />
                                        <p className="text-[10px] font-black uppercase">Credentials Awaiting Audit</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {s.business_registration_no || 'N/A'}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">LOC: {s.location || 'N/A'}</p>
                                    </div>
                                    <Button
                                        onClick={() => handleApprove(s)}
                                        disabled={actionId === s.id}
                                        className="w-full h-12 rounded-xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        {actionId === s.id ? <Loader2 className="animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                        Verify Partner
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                            <span>Fill Rate</span>
                                            <span>{s.fill_rate}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.fill_rate}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                            <span>On-Time Dispatch</span>
                                            <span>{s.on_time_dispatch_rate}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.on_time_dispatch_rate}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {s.verification_status === 'Verified' && (
                                    <Button
                                        onClick={() => generatePO(s)}
                                        disabled={generatingPO === s.id}
                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        {generatingPO === s.id ? <Loader2 size={16} className="animate-spin mr-2" /> : <FileDown size={16} className="mr-2" />}
                                        Boost Inventory (PO)
                                    </Button>
                                )}
                                <div className="pt-4 border-t border-border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Activity className="h-4 w-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{s.rating >= 90 ? 'Platinum Tier' : 'Standard'}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-primary tracking-widest">Analytics &rarr;</Button>
                                </div>
                            </div>
                        </div>
                        <Target className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 -rotate-12" />
                    </Card>
                ))}

                {filteredSuppliers.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-card rounded-[3rem] border-2 border-dashed border-border opacity-30">
                        <Zap className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                        <p className="text-sm font-black text-slate-400 uppercase italic">Awaiting Supplier Integration Data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
