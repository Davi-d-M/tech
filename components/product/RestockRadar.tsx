'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Loader2, CheckCircle2, Zap, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RestockRequest {
    product_id: number;
    customer_email: string;
}

export default function RestockRadar({ productId, productName }: { productId: number, productName: string }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !supabase) return;

        setStatus('loading');
        try {
            const request: RestockRequest = {
                product_id: productId,
                customer_email: email.trim().toLowerCase()
            };
            const { error } = await supabase
                .from('restock_requests')
                .insert([request]);

            if (error) throw error;

            setStatus('success');
            setMessage(`You're on the list! We'll alert you the second ${productName} is back.`);
        } catch (err: unknown) {
            const error = err as Error;
            console.error(error);
            setStatus('error');
            setMessage(error.message || "Uplink failed. Please try again.");
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center animate-in zoom-in-95 duration-500">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-xs font-black uppercase text-emerald-700 tracking-tight leading-tight">{message}</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        <Rocket className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-foreground leading-none">Restock Radar</h3>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1.5">Elite Priority Notification</p>
                    </div>
                </div>

                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    &quot;This gadget is currently high-demand. Join the radar to get an instant alert the second we restock.&quot;
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="h-14 rounded-2xl bg-white border-slate-100 pl-12 text-sm font-bold shadow-sm"
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                    <Button
                        disabled={status === 'loading'}
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join The Radar'}
                    </Button>
                </form>
                {status === 'error' && <p className="text-[9px] font-black text-rose-500 uppercase text-center">{message}</p>}
            </div>

            {/* Background Decor */}
            <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 rotate-12 -z-0 group-hover:scale-110 transition-transform duration-1000" />
        </div>
    );
}
