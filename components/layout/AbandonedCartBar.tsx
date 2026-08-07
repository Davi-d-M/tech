'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function AbandonedCartBar() {
    const [abandonedCart, setAbandonedCart] = useState<Record<string, unknown> | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        async function checkAbandonedCart() {
            if (!supabase) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('abandoned_carts')
                    .select('*')
                    .eq('customer_email', session.user.email)
                    .is('recovery_sent_at', null)
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    setAbandonedCart(data);
                    setIsVisible(true);
                }
            }
        }
        checkAbandonedCart();
    }, []);

    if (!isVisible || !abandonedCart) return null;

    return (
        <div className="bg-primary text-white py-3 px-4 shadow-lg animate-in slide-in-from-top duration-500">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">
                        Welcome back! We&apos;ve saved your items.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/cart">
                        <Button className="h-9 px-6 bg-white text-primary hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest rounded-xl">
                            Finish Order <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
