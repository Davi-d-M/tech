'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Check, Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
    productId: number;
    productName: string;
}

export default function RestockNotifyButton({ productId, productName }: Props) {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleNotify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !supabase) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('restock_requests')
                .insert([{
                    product_id: productId,
                    customer_phone: phone.trim()
                }]);

            if (error) throw error;
            setStatus('success');
            setPhone('');
        } catch (err: unknown) {
            const error = err as Error;
            console.error(error);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] font-black uppercase text-emerald-700 leading-tight">
                    Locked in! We&apos;ll blast you the second {productName} is back.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                <Rocket className="h-3 w-3 animate-bounce" /> Currently Sold Out
            </p>
            <form onSubmit={handleNotify} className="flex gap-2">
                <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-bold"
                    required
                />
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 px-4 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all shrink-0"
                >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Bell className="h-3 w-3 mr-1" /> Notify Me</>}
                </Button>
            </form>
            {status === 'error' && <p className="text-[8px] font-bold text-rose-500 uppercase">Sync failed. Try again.</p>}
        </div>
    );
}
