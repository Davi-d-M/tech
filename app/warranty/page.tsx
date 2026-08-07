'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldCheck,
    Search,
    Package,
    CheckCircle2,
    Zap,
    Smartphone,
    Loader2,
    Trophy,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Recommendations from '@/components/cart/Recommendations';

interface OrderWithProducts {
    id: number;
    created_at: string;
    status: string;
    customer_name: string;
    products: {
        name: string;
        category: string;
    } | null;
}

export default function WarrantyVault() {
    const [orderId, setOrderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<OrderWithProducts | null>(null);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !supabase) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const { data, error: dbError } = await supabase
                .from('orders')
                .select('id, created_at, status, customer_name, products(name, category)')
                .eq('id', orderId.trim())
                .eq('status', 'Delivered')
                .single();

            if (dbError || !data) {
                setError("Order not found or not yet delivered. Only delivered gadgets have active cloud warranties.");
            } else {
                setResult(data as unknown as OrderWithProducts);
            }
        } catch (err: unknown) {
            console.error("Warranty error:", err);
            setError("Security link failed. Please check your Order ID.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-4xl mx-auto">

                <header className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10 mb-2">
                        <ShieldCheck className="h-3 w-3" /> Blockchain Verified Tech
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">Digital <br/> <span className="text-primary italic">Warranty Vault</span></h1>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto italic text-lg leading-relaxed">
                        &quot;Your gadgets are premium. Your protection should be too. Enter your order ID to access your digital tech certificate.&quot;
                    </p>
                </header>

                <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-inner mb-12">
                    <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Order Identification Number</label>
                            <div className="relative">
                                <Input
                                    value={orderId}
                                    onChange={e => setOrderId(e.target.value)}
                                    placeholder="e.g. 1024"
                                    className="h-16 rounded-2xl border-slate-200 bg-white pl-14 text-lg font-black tracking-widest uppercase"
                                    required
                                />
                                <Package className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Verify Gadget Authenticity</>}
                        </Button>
                        {error && <p className="text-[10px] font-black uppercase text-rose-500 text-center animate-pulse">{error}</p>}
                    </form>
                </div>

                {result && (
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        <div className="bg-white border-8 border-primary/20 rounded-[4rem] p-8 sm:p-16 relative overflow-hidden shadow-2xl">

                            {/* Certificate Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-16 border-b-2 border-slate-100 pb-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Certificate of Authenticity</p>
                                    <h2 className="text-3xl font-black text-foreground uppercase">Apexstores Tech Kenya</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Vault Key</p>
                                    <p className="text-xl font-mono font-black text-foreground tracking-widest">#{result.id}</p>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="grid sm:grid-cols-2 gap-12 items-center mb-16">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Registered Owner</p>
                                        <p className="text-2xl font-black text-foreground uppercase tracking-tight">{result.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Device Specification</p>
                                        <p className="text-xl font-black text-primary uppercase leading-tight">{result.products?.name || 'Titan Grade Gadget'}</p>
                                    </div>
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Activation Date</p>
                                            <p className="text-sm font-bold text-foreground">{new Date(result.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Security Status</p>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 text-primary rounded-md border border-primary/10">
                                                <ShieldCheck className="h-3 w-3 fill-current" />
                                                <span className="text-[8px] font-black uppercase">Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center border-4 border-dashed border-slate-100 shadow-inner">
                                    <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6 shadow-xl relative">
                                        <CheckCircle2 className="h-12 w-12" />
                                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
                                    </div>
                                    <p className="text-xl font-black text-foreground uppercase tracking-tighter mb-2">Elite Warranty Active</p>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">180 Days Protection Remaining</p>
                                </div>
                            </div>

                            <footer className="pt-12 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-40 grayscale">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Official Apexstores Seal</span>
                                </div>
                                <p className="text-[8px] font-bold uppercase tracking-tighter">This certificate is tied to the hardware IMEI/Serial logged upon dispatch.</p>
                            </footer>

                            {/* Watermark */}
                            <Zap className="absolute -bottom-10 -left-10 h-64 w-64 text-slate-50 -z-10 rotate-12" />
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Button variant="ghost" onClick={() => window.print()} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary">
                                <History className="h-4 w-4 mr-2" /> Download Proof as PDF
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-24 grid sm:grid-cols-3 gap-8 text-center border-t border-slate-100 pt-16">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mx-auto"><ShieldCheck className="h-5 w-5" /></div>
                        <h3 className="font-black uppercase text-xs">Authenticity Guard</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">All Apex gadgets are source-verified and tested before activation.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mx-auto"><CheckCircle2 className="h-5 w-5" /></div>
                        <h3 className="font-black uppercase text-xs">Seamless Returns</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Verified faults are resolved within 48 hours under our elite program.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto"><Trophy className="h-5 w-5" /></div>
                        <h3 className="font-black uppercase text-xs">Life-Time Support</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Get priority assistance for as long as you own your registered gadget.</p>
                    </div>
                </div>

                {/* Recommendations Engine Integration */}
                <Recommendations />
            </div>
        </div>
    );
}
