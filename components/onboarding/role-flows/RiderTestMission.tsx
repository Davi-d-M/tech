'use client';

import * as React from 'react';
import {
    Truck,
    MapPin,
    Zap,
    CheckCircle2,
    Camera,
    ArrowRight,
    Loader2,
    Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function RiderTestMission({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = React.useState<'ACCEPT' | 'NAVIGATE' | 'ARRIVE' | 'PROOF' | 'SUCCESS'>('ACCEPT');
    const [loading, setLoading] = React.useState(false);

    const handleAccept = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setPhase('NAVIGATE');
        }, 1000);
    };

    const handleArrive = () => setPhase('ARRIVE');

    const handleCapture = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setPhase('SUCCESS');
        }, 1500);
    };

    return (
        <Card className="max-w-xl w-full p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.4em]">Simulation Node</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Test Mission</h2>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse",
                    phase === 'SUCCESS' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                    {phase === 'SUCCESS' ? 'Mission Cleared' : 'Live Extraction'}
                </div>
            </header>

            <div className="relative z-10 min-h-[300px] flex flex-col justify-center">
                {phase === 'ACCEPT' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95">
                        <div className="h-20 w-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                            <Zap size={32} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase text-foreground leading-none">Incoming Signal</h3>
                            <p className="text-sm text-slate-500 font-medium italic">Order #TEST-01 is available at the Nairobi Hub. Accept to start navigation.</p>
                        </div>
                        <Button onClick={handleAccept} disabled={loading} className="w-full h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : 'Accept Mission'}
                        </Button>
                    </div>
                )}

                {phase === 'NAVIGATE' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="h-48 w-full rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
                            <Activity className="h-24 w-24 text-primary/10 animate-pulse" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <MapPin size={24} className="text-primary animate-bounce" />
                                <p className="text-[8px] font-black uppercase text-slate-400">Tactical Route Active</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase text-foreground">En Route to Drop Point</h3>
                            <p className="text-xs text-slate-400 font-medium">Estimated arrival: 2 minutes. Proceed with safety protocols.</p>
                        </div>
                        <Button onClick={handleArrive} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">Simulate Arrival</Button>
                    </div>
                )}

                {phase === 'ARRIVE' && (
                    <div className="space-y-8 animate-in zoom-in-95">
                        <div className="h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <MapPin size={32} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black uppercase text-foreground">Target Reached</h3>
                            <p className="text-sm text-slate-500 font-medium italic">You are at the drop point. Please capture a proof-of-delivery photo to finalize extraction.</p>
                        </div>
                        <Button onClick={handleCapture} disabled={loading} className="w-full h-20 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs">
                             {loading ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : <><Camera className="mr-3" /> Capture Proof</>}
                        </Button>
                    </div>
                )}

                {phase === 'SUCCESS' && (
                    <div className="space-y-8 text-center animate-in zoom-in-95">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase text-foreground">Certification Ready</h3>
                            <p className="text-sm text-slate-500 font-medium italic">Simulation complete. Your unit is now fully certified for real-world missions.</p>
                        </div>
                        <Button onClick={onComplete} className="w-full h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl">Activate Final Authorization</Button>
                    </div>
                )}
            </div>

            <Truck className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
