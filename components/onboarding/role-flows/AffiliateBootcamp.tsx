'use client';

import * as React from 'react';
import {
    Zap,
    TrendingUp,
    Link2,
    DollarSign,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AffiliateBootcamp({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = React.useState(0);
    const [isFinishing, setIsFinishing] = React.useState(false);

    const principles = [
        {
            title: "Asset Selection",
            desc: "Choose high-velocity tech products from the catalog to promote. Every gadget has a pre-calculated commission yield.",
            icon: Zap
        },
        {
            title: "Link Attribution",
            desc: "Generate your unique tactical link. Our Identity Bridge tracks every click and session for 30 days.",
            icon: Link2
        },
        {
            title: "Yield Extraction",
            desc: "Track your earnings in real-time. Request withdrawals directly to your M-Pesa once you hit the 1k threshold.",
            icon: DollarSign
        }
    ];

    const next = () => {
        if (step < principles.length - 1) setStep(prev => prev + 1);
        else {
            setIsFinishing(true);
            setTimeout(onComplete, 1500);
        }
    };

    const current = principles[step];
    const Icon = current.icon;

    return (
        <Card className="max-w-xl w-full p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em]">Bootcamp Node</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Affiliate Training</h2>
                </div>
                <div className="flex gap-1">
                    {principles.map((_, i) => (
                        <div key={i} className={cn("h-1 w-4 rounded-full transition-all", i === step ? "bg-indigo-600 w-8" : "bg-slate-100")} />
                    ))}
                </div>
            </header>

            <div className="relative z-10 space-y-8 animate-in slide-in-from-right-4" key={step}>
                <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Icon size={32} />
                </div>
                <div className="space-y-3">
                    <h3 className="text-3xl font-black uppercase text-foreground leading-none">{current.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed italic">&quot;{current.desc}&quot;</p>
                </div>
            </div>

            <Button
                onClick={next}
                disabled={isFinishing}
                className="w-full h-20 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 z-10 relative"
            >
                {isFinishing ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : <>{step === principles.length - 1 ? 'Activate Account' : 'Next Principle'} <ArrowRight className="ml-3 h-4 w-4" /></>}
            </Button>

            <TrendingUp className="absolute -bottom-10 -right-10 h-64 w-64 text-indigo-50 -z-0 rotate-12" />
        </Card>
    );
}
