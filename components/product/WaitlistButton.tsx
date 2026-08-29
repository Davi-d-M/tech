'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Check, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WaitlistButton({ productId }: { productId: number }) {
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [showInput, setShowInput] = useState(false);

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !supabase) return;

        setStatus('loading');
        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([{
                    product_id: productId,
                    customer_phone: phone.trim()
                }]);

            if (error) throw error;
            setStatus('success');
            setTimeout(() => {
                setShowInput(false);
                setStatus('idle');
                setPhone('');
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    if (!showInput) {
        return (
            <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => setShowInput(true)}
            >
                <Bell className="h-4 w-4 mr-2" /> Notify Me
            </Button>
        );
    }

    return (
        <form onSubmit={handleJoinWaitlist} className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
                <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 pl-10 text-[11px] font-bold"
                    required
                    disabled={status === 'loading' || status === 'success'}
                />
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            </div>
            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className={`flex-1 h-10 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg ${
                        status === 'success' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-primary'
                    }`}
                >
                    {status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> :
                     status === 'success' ? <><Check className="h-3 w-3 mr-1" /> Added</> :
                     'Join Waitlist'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowInput(false)}
                    className="h-10 px-3 rounded-xl text-slate-400 font-black uppercase text-[9px]"
                >
                    X
                </Button>
            </div>
            {status === 'success' && (
                <p className="text-[9px] font-black text-emerald-600 uppercase text-center animate-pulse">We&apos;ll alert you on WhatsApp!</p>
            )}
        </form>
    );
}
