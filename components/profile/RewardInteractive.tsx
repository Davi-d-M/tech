'use client';

import { useState } from 'react';
import { Gift, Zap, Loader2, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Prize {
    type: string;
    amount: number;
    label: string;
}

export default function RewardInteractive({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState<'box' | 'spin'>('box');
    const [status, setStatus] = useState<'idle' | 'spinning' | 'opening' | 'won'>('idle');
    const [prize, setPrize] = useState<Prize | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClaim = async (type: 'spin' | 'box') => {
        setStatus(type === 'spin' ? 'spinning' : 'opening');
        setError(null);

        try {
            const res = await fetch('/api/member/gamification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'claim-daily-reward', payload: { type } }),
            });
            const data = await res.json();

            if (res.status === 429) {
                setError(data.error);
                setStatus('idle');
                return;
            }

            if (data.ok) {
                // Delay for animation
                setTimeout(() => {
                    setPrize(data.prize);
                    setStatus('won');
                }, type === 'spin' ? 3000 : 1500);
            } else {
                throw new Error(data.error);
            }
        } catch (err: unknown) {
            setError("Tactical link offline. Try again later, bro!");
            setStatus('idle');
        }
    };

    return (
        <div className="bg-white rounded-[3.5rem] p-10 text-foreground border border-slate-100 relative overflow-hidden shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center">
            {/* Header Tabs */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 z-20">
                <button
                    onClick={() => setActiveTab('box')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'box' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Daily Crate
                </button>
                <button
                    onClick={() => setActiveTab('spin')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'spin' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Elite Spin
                </button>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                {status === 'won' && prize ? (
                    <div className="animate-in zoom-in-95 duration-500 space-y-6 flex flex-col items-center">
                        <div className="h-32 w-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(255,107,0,0.1)] animate-pulse">
                            <Trophy className="h-16 w-16" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-4xl font-black uppercase tracking-tighter">Mission Accomplished</h4>
                            <p className="text-primary font-black text-2xl italic tracking-widest">{prize.label} Received</p>
                            <p className="text-slate-400 text-xs font-medium italic mt-4">&quot;Your elite reward has been added to your account ledger, bro!&quot;</p>
                        </div>
                        <Button onClick={() => setStatus('idle')} className="h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary/90 transition-all active:scale-95 mt-4">
                            Dismiss
                        </Button>
                    </div>
                ) : activeTab === 'box' ? (
                    <div className="space-y-10 flex flex-col items-center">
                        <div className={cn(
                            "relative w-48 h-48 transition-all duration-700 cursor-pointer group",
                            status === 'opening' && "animate-bounce scale-110"
                        )} onClick={() => status === 'idle' && handleClaim('box')}>
                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
                            <Gift className={cn(
                                "h-48 w-48 text-primary fill-current transition-all",
                                status === 'opening' ? "opacity-50 blur-sm" : "group-hover:scale-110"
                            )} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="h-12 w-12 text-white animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-4 max-w-xs mx-auto">
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground">Daily Tech Crate</h4>
                            <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                                Contains random XP boosts or secret store credits. Refreshes every 24 hours.
                            </p>
                            {error ? (
                                <p className="text-primary font-black text-[9px] uppercase tracking-widest bg-primary/5 py-3 rounded-xl border border-primary/10 px-6">⚠️ {error}</p>
                            ) : (
                                <Button
                                    onClick={() => handleClaim('box')}
                                    disabled={status !== 'idle'}
                                    className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                    {status === 'opening' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Tap to Extract Payload'}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10 flex flex-col items-center">
                        <div className={cn(
                            "relative w-64 h-64 border-8 border-slate-50 rounded-full flex items-center justify-center bg-white transition-all duration-[3000ms] ease-out shadow-inner",
                            status === 'spinning' && "rotate-[1080deg]"
                        )}>
                             {/* Mock Spin Wheel segments */}
                             <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-spin-slow"></div>
                             <Zap className={cn(
                                 "h-20 w-20 text-primary fill-current",
                                 status === 'spinning' && "animate-ping"
                             )} />
                             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl z-20"></div>
                        </div>

                        <div className="space-y-4 max-w-xs mx-auto">
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground">Elite Wheel</h4>
                            <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                                One spin, total power. High probability of XP, low probability of vouchers.
                            </p>
                            {error ? (
                                <p className="text-primary font-black text-[9px] uppercase tracking-widest bg-primary/5 py-3 rounded-xl border border-primary/10 px-6">⚠️ {error}</p>
                            ) : (
                                <Button
                                    onClick={() => handleClaim('spin')}
                                    disabled={status !== 'idle'}
                                    className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                    {status === 'spinning' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Execute Spin Sequence'}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Background elements */}
            <Zap className="absolute -top-20 -left-20 h-64 w-64 text-slate-50 rotate-45 -z-0" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
        </div>
    );
}
