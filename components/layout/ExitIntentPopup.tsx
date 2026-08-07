'use client';

import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export default function ExitIntentPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);

    useEffect(() => {
        // Check if already shown in this session
        const shown = sessionStorage.getItem('exit_popup_shown');
        if (shown) {
            setHasBeenShown(true);
            return;
        }

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasBeenShown) {
                setIsVisible(true);
                setHasBeenShown(true);
                sessionStorage.setItem('exit_popup_shown', 'true');
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasBeenShown]);

    if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-500/10 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] max-w-lg w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-6 right-6 text-slate-300 hover:text-foreground transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="p-10 pt-16 text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Gift className="h-10 w-10" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">Wait, Bro!</h2>
                    <p className="text-slate-500 font-medium text-lg">Don&apos;t leave your gear behind.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Exclusive Exit Offer</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-4xl font-black text-primary">5% OFF</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-white rounded-xl py-3 px-4 border border-slate-100">
                        <code className="text-xl font-black text-foreground tracking-widest">STAY5</code>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText('STAY5');
                            localStorage.setItem('apex_exit_intent', 'true');
                            setIsVisible(false);
                            window.location.href = '/checkout';
                        }}
                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 group hover:bg-primary/90 transition-all active:scale-95"
                    >
                        Copy & Checkout <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-foreground transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>

            {/* Urgent footer */}
            <div className="bg-primary p-4 flex items-center justify-center gap-4 text-white">
                <Zap className="h-4 w-4 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest">Limited Time Offer • Only at Apexstores</span>
                <Zap className="h-4 w-4 fill-current" />
            </div>
        </div>
    </div>
  );
}
