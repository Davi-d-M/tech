'use client';

import * as React from 'react';
import {
    Layout,
    Zap,
    Loader2,
    PlusCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WidgetInstall({ onComplete }: { onComplete: () => void }) {
    const [isPinning, setIsPinning] = React.useState(false);

    const handlePin = () => {
        setIsPinning(true);
        // 🛰️ Trigger Native Android Widget Pinning Protocol
        const win = window as any;
        if (win.ApexDevice?.requestWidgetPin) {
            win.ApexDevice.requestWidgetPin();
        } else {
            console.warn("Native node not detected. Skipping to final activation.");
        }

        // Wait for system dialog to appear before completing mission step
        setTimeout(() => {
            setIsPinning(false);
            onComplete();
        }, 3000);
    };

    return (
        <Card className="max-w-xl w-full p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Node Deployment</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Home Screen Command</h2>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </header>

            <div className="relative z-10 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                    <div className="h-24 w-full bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F5A000_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl flex items-center gap-4 relative z-10 scale-90">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Zap size={20} className="fill-current" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tight">Apex Grid Active</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Synchronizing Missions...</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase text-foreground leading-tight">Install Your Live Node</h3>
                        <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                            Pin the Apex Home Widget to receive real-time tech drops, track extractions, and unlock elite-only flash sales directly on your phone screen.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 pt-4">
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <PlusCircle size={18} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase">Permanent access to the tactical grid without opening the app.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
                <Button
                    onClick={handlePin}
                    disabled={isPinning}
                    className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    {isPinning ? <Loader2 className="animate-spin h-6 w-6" /> : 'Pin Widget to Home Screen'}
                </Button>
                <button onClick={onComplete} className="text-[10px] font-black uppercase text-slate-300 hover:text-primary transition-colors py-2">Maybe Later</button>
            </div>

            <Layout className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
