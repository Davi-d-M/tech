'use client';

import * as React from 'react';
import {
    ArrowRight,
    Zap,
    ShieldCheck,
    Bike,
    Navigation,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function RiderAcademy({ onComplete }: { onComplete: () => void }) {
    const [currentModule, setCurrentModule] = React.useState(0);
    const [isPassing, setIsPassing] = React.useState(false);

    const modules = [
        {
            title: "Accepting Missions",
            desc: "When a delivery signal appears on your HUD, you have 30 seconds to accept. High acceptance rates unlock premium rewards.",
            icon: Zap
        },
        {
            title: "Tactical Navigation",
            desc: "Use the integrated Apex Map for precision routing. Avoid high-traffic nodes to maintain your 100% on-time rating.",
            icon: Navigation
        },
        {
            title: "Elite Verification",
            desc: "Always capture a proof-of-delivery photo. For high-value tech, a unique PIN from the customer is required to finalize.",
            icon: ShieldCheck
        }
    ];

    const nextModule = () => {
        if (currentModule < modules.length - 1) {
            setCurrentModule(prev => prev + 1);
        } else {
            setIsPassing(true);
            setTimeout(() => {
                onComplete();
            }, 2000);
        }
    };

    const ModuleIcon = modules[currentModule].icon;

    return (
        <Card className="max-w-xl w-full p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Academy Node</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Operational Training</h2>
                </div>
                <div className="flex gap-1">
                    {modules.map((_, i) => (
                        <div key={i} className={cn("h-1 w-4 rounded-full transition-all", i === currentModule ? "bg-primary w-8" : "bg-slate-100")} />
                    ))}
                </div>
            </header>

            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 relative z-10" key={currentModule}>
                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
                    <ModuleIcon size={32} />
                </div>
                <div className="space-y-3">
                    <h3 className="text-3xl font-black uppercase text-foreground leading-none">{modules[currentModule].title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed italic">&quot;{modules[currentModule].desc}&quot;</p>
                </div>
            </div>

            <Button
                onClick={nextModule}
                disabled={isPassing}
                className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 z-10 relative"
            >
                {isPassing ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : <>{currentModule === modules.length - 1 ? 'Finalize Certification' : 'Next Module'} <ArrowRight className="ml-3 h-4 w-4" /></>}
            </Button>

            <Bike className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
