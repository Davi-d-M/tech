'use client';

import * as React from 'react';
import {
    Store,
    ArrowRight,
    Layers,
    TrendingUp,
    Loader2,
    Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MerchantDiscoveryProps {
    onComplete: (data: Record<string, string>) => void;
}

export default function MerchantDiscovery({ onComplete }: MerchantDiscoveryProps) {
    const [step, setStep] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [answers, setAnswers] = React.useState({
        order_volume: '',
        current_software: '',
        pain_point: ''
    });

    const questions = [
        {
            id: 'order_volume',
            title: "Daily Extraction Volume",
            desc: "How many orders do you process on average each day?",
            options: ['0-10 (Starter)', '10-50 (Scaling)', '50-200 (Elite)', '200+ (Command)'],
            icon: TrendingUp
        },
        {
            id: 'current_software',
            title: "Current Tech Stack",
            desc: "What tools do you use to manage your business today?",
            options: ['WhatsApp/Excel', 'Legacy POS', 'Generic E-commerce', 'None / Manual'],
            icon: Layers
        },
        {
            id: 'pain_point',
            title: "Primary Objective",
            desc: "What is your main goal for integrating with Apex OS?",
            options: ['Rider Dispatch', 'Inventory Sync', 'Payment Ledgering', 'AI Insights'],
            icon: Search
        }
    ];

    const handleSelect = (val: string) => {
        const qId = questions[step].id;
        setAnswers(prev => ({ ...prev, [qId]: val }));

        if (step < questions.length - 1) {
            setStep(prev => prev + 1);
        } else {
            setLoading(true);
            setTimeout(() => {
                onComplete(answers);
            }, 1500);
        }
    };

    const currentQ = questions[step];
    const Icon = currentQ.icon;

    return (
        <Card className="max-w-xl w-full p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Operational Discovery</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Mission Scoping</h2>
                </div>
                <div className="flex gap-1">
                    {questions.map((_, i) => (
                        <div key={i} className={cn("h-1 w-4 rounded-full transition-all", i === step ? "bg-primary w-8" : "bg-slate-100")} />
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="py-20 text-center space-y-6 animate-in fade-in">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calibrating Apex OS Environment...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 relative z-10" key={step}>
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
                        <Icon size={28} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black uppercase text-foreground leading-tight">{currentQ.title}</h3>
                        <p className="text-sm text-slate-500 font-medium italic">{currentQ.desc}</p>
                    </div>

                    <div className="grid gap-3 pt-4">
                        {currentQ.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-primary hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between"
                            >
                                <span className="text-[11px] font-black uppercase text-slate-600 group-hover:text-foreground">{opt}</span>
                                <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Store className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
