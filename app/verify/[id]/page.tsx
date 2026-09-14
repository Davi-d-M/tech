'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldCheck,
    AlertTriangle,
    Package,
    Truck,
    CheckCircle2,
    Zap,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ProvenanceRecord {
    id: string;
    product_name: string;
    serial_number: string;
    imei?: string;
    status: string;
    supplier_name: string;
    received_at: string;
    order_id?: string;
    customer_name?: string;
    delivered_at?: string;
}

export default function AuthenticityVerifier() {
    const { id: serialId } = useParams();
    const [record, setRecord] = React.useState<ProvenanceRecord | null>(null);
    const [loading, setLoading] = React.useState(true);

    const verifyProvenance = React.useCallback(async () => {
        if (!supabase || !serialId) return;
        setLoading(true);
        try {
            // Join inventory_units with products and suppliers
            const { data, error } = await supabase
                .from('inventory_units')
                .select(`
                    serial_number,
                    imei,
                    status,
                    received_at,
                    updated_at,
                    products(name),
                    suppliers(name)
                `)
                .eq('serial_number', serialId)
                .single();

            if (error) throw error;

            if (data) {
                setRecord({
                    id: serialId as string,
                    product_name: (data.products as unknown as { name: string } | null)?.name || 'Unknown Gadget',
                    serial_number: data.serial_number,
                    imei: data.imei,
                    status: data.status,
                    supplier_name: (data.suppliers as unknown as { name: string } | null)?.name || 'Verified Apex Supplier',
                    received_at: data.received_at
                });
            }
        } catch (err) {
            console.error("Verification Failure:", err);
        } finally {
            setLoading(false);
        }
    }, [serialId]);

    React.useEffect(() => {
        verifyProvenance();
    }, [verifyProvenance]);

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-8">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Scanning Block-Record...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-left selection:bg-primary/20">
            {/* Verification Header */}
            <div className={cn(
                "py-24 px-6 text-center text-white relative overflow-hidden transition-colors duration-1000",
                record ? "bg-emerald-600" : "bg-rose-600"
            )}>
                <div className="max-w-2xl mx-auto space-y-6 relative z-10 animate-in zoom-in-95 duration-700">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center mx-auto shadow-2xl">
                        {record ? <ShieldCheck size={48} className="animate-bounce" /> : <AlertTriangle size={48} className="animate-pulse" />}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            {record ? 'Authenticity Verified' : 'Unrecognized Unit'}
                        </h1>
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">
                            {record ? 'Provenance record matched on Apex Grid' : 'Identity mismatch detected. Possible counterfiet.'}
                        </p>
                    </div>
                </div>
                <Zap className="absolute -bottom-20 -right-20 h-96 w-96 text-white/10 rotate-45" />
            </div>

            <main className="max-w-2xl mx-auto -mt-10 px-6 pb-40 relative z-20 space-y-8">
                {record ? (
                    <>
                        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl space-y-10">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Product Node</p>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">{record.product_name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Serial ID</p>
                                    <p className="text-sm font-black text-primary font-mono">{record.serial_number}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Provenance Path</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 group">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-primary/20 transition-all">
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-50 pb-4">
                                            <p className="text-[9px] font-black text-primary uppercase">Origin Locked</p>
                                            <p className="font-bold text-foreground text-sm uppercase">{record.supplier_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 group">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-primary/20 transition-all">
                                            <Truck size={20} />
                                        </div>
                                        <div className="flex-1 border-b border-slate-50 pb-4">
                                            <p className="text-[9px] font-black text-primary uppercase">Receiving Sync</p>
                                            <p className="font-bold text-foreground text-sm uppercase">Nairobi Logistic Hub • {new Date(record.received_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 group">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 group-hover:border-primary/20 transition-all">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase">Identity Verified</p>
                                            <p className="font-bold text-foreground text-sm uppercase">Secure Ownership Protocol Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 rounded-[3rem] bg-indigo-600 text-white relative overflow-hidden group shadow-2xl">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Lock size={18} />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Apex Shield Active</h4>
                                </div>
                                <p className="text-xs font-medium leading-relaxed italic opacity-80">
                                    &quot;This unit is covered by a 12-month tactical warranty. Every internal component has been verified for authenticity and performance.&quot;
                                </p>
                            </div>
                            <ShieldCheck className="absolute -bottom-10 -right-10 h-48 w-48 text-white/10 rotate-12" />
                        </div>
                    </>
                ) : (
                    <Card className="p-10 rounded-[3rem] bg-white border border-rose-100 shadow-2xl space-y-8 text-center animate-in zoom-in-95">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-rose-600 uppercase">Warning: Illegal Unit</h2>
                            <p className="text-sm font-medium text-slate-500 italic leading-relaxed px-10">
                                &quot;The serial ID <strong>{serialId}</strong> does not exist in the Apex Global Provenance database. This gadget may be a counterfeit or from an unauthorized source.&quot;
                            </p>
                        </div>
                        <div className="pt-8 border-t border-slate-50">
                            <Link href="/contact">
                                <button className="h-14 w-full rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100">Report Unauthorized SKU</button>
                            </Link>
                        </div>
                    </Card>
                )}

                <div className="text-center pt-10">
                    <Link href="/" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.4em] transition-all">← Return to Command</Link>
                </div>
            </main>
        </div>
    );
}
