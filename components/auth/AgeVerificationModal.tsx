'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ShieldCheck, Beer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AgeVerificationModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const verified = localStorage.getItem('apex_age_verified');
        if (!verified) {
            setIsVisible(true);
        }
    }, []);

    const handleConfirm = () => {
        setIsVerifying(true);
        setTimeout(() => {
            localStorage.setItem('apex_age_verified', 'true');
            setIsVisible(false);
            setIsVerifying(false);
        }, 1000);
    };

    const handleDeny = () => {
        window.location.href = 'https://www.google.com';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-6">
            <Card className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-500 text-center relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm border border-primary/20">
                        <ShieldCheck size={40} className="animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Identity Gate</h2>
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Age Verification Protocol</p>
                    </div>

                    <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                        &quot;In compliance with the Kenyan Alcoholic Drinks Control Act, you must be 18 years or older to access this marketplace. Please confirm your status.&quot;
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleConfirm}
                            disabled={isVerifying}
                            className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isVerifying ? 'Synchronizing...' : 'I am 18 or older'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleDeny}
                            className="w-full h-12 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors"
                        >
                            Exit Platform
                        </Button>
                    </div>
                </div>

                {/* Tactical Footer */}
                <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-2 opacity-30">
                    <AlertCircle size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Please drink responsibly</span>
                </div>

                <Beer className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
            </Card>
        </div>
    );
}
