'use client';

import * as React from 'react';
import {
    Smartphone,
    Speaker,
    BatteryCharging,
    Watch,
    MapPin,
    ArrowRight,
    Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CustomerOnboarding({ onComplete }: { onComplete: (data: Record<string, string[]>) => void }) {
    const [step, setStep] = React.useState(0);
    const [interests, setIntersets] = React.useState<string[]>([]);

    const categories = [
        { id: 'airpods', label: 'Elite Audio', icon: Speaker },
        { id: 'chargers', label: 'Super Charge', icon: BatteryCharging },
        { id: 'watches', label: 'Wrist Tech', icon: Watch },
        { id: 'cases', label: 'Armor Protection', icon: Smartphone },
    ];

    const toggleInterest = (id: string) => {
        setIntersets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const next = () => {
        if (step === 0) setStep(1);
        else onComplete({ interests });
    };

    return (
        <Card className="max-w-xl w-full p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Identity Sync</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Personalize Grid</h2>
                </div>
                <div className="flex gap-1">
                    {[0, 1].map(i => (
                        <div key={i} className={cn("h-1 w-4 rounded-full transition-all", i === step ? "bg-primary w-8" : "bg-slate-100")} />
                    ))}
                </div>
            </header>

            <div className="relative z-10 space-y-8 animate-in slide-in-from-right-4">
                {step === 0 ? (
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase text-foreground leading-tight">What tech moves you?</h3>
                            <p className="text-sm text-slate-500 font-medium italic">Select your interests to curate your 2026 tactical feed.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleInterest(cat.id)}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center group",
                                        interests.includes(cat.id) ? "border-primary bg-primary/5 shadow-lg" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                                    )}
                                >
                                    <cat.icon className={cn("h-8 w-8 transition-transform group-hover:scale-110", interests.includes(cat.id) ? "text-primary" : "text-slate-300")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", interests.includes(cat.id) ? "text-primary" : "text-slate-400")}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 text-center py-6">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-inner animate-pulse">
                            <MapPin size={40} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase text-foreground">Location Protocol</h3>
                            <p className="text-sm text-slate-500 font-medium italic leading-relaxed px-6">
                                &quot;Enable location for high-speed delivery estimates and local tech drops in your area.&quot;
                            </p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">Allow Precision Access</Button>
                            <button onClick={next} className="text-[10px] font-black uppercase text-slate-300 hover:text-primary transition-colors underline">Set Manually Later</button>
                        </div>
                    </div>
                )}
            </div>

            {step === 0 && (
                <Button
                    onClick={next}
                    disabled={interests.length === 0}
                    className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 z-10 relative"
                >
                    Sync Interests <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
            )}

            <Zap className="absolute -bottom-10 -left-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
