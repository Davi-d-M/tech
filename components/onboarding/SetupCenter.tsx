'use client';

import * as React from 'react';
import {
    CheckCircle2,
    Circle,
    Rocket,
    Zap,
    ChevronRight,
    ShieldCheck,
    Smartphone
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OnboardingState } from '@/lib/apex-os/onboarding-engine';

interface SetupCenterProps {
    state: OnboardingState;
    onContinue: () => void;
}

export default function SetupCenter({ state, onContinue }: SetupCenterProps) {
    const getTasks = () => {
        switch (state.role) {
            case 'RIDER':
                return [
                    { id: 'welcome', label: 'Rider Academy', done: state.completedSteps.includes('welcome') },
                    { id: 'phone', label: 'Identity Verification', done: state.completedSteps.includes('phone') },
                    { id: 'test-mission', label: 'First Test Mission', done: state.completedSteps.includes('test-mission') },
                ];
            case 'MERCHANT':
                return [
                    { id: 'discovery', label: 'Operational Scoping', done: state.completedSteps.includes('discovery') },
                    { id: 'business-setup', label: 'Business Profile', done: state.completedSteps.includes('business-setup') },
                    { id: 'team', label: 'Team Provisioning', done: state.completedSteps.includes('team') },
                ];
            case 'AFFILIATE':
                return [
                    { id: 'bootcamp', label: 'Bootcamp Principle', done: state.completedSteps.includes('bootcamp') },
                    { id: 'first-link', label: 'Generate Link', done: state.completedSteps.includes('first-link') },
                ];
            default:
                return [
                    { id: 'preferences', label: 'Personalize Feed', done: state.completedSteps.includes('preferences') },
                    { id: 'widget-install', label: 'Home Screen Node', done: state.completedSteps.includes('widget-install') },
                    { id: 'first-order', label: 'Initial Tech Discovery', done: state.completedSteps.includes('first-order') },
                ];
        }
    };

    const remainingTasks = getTasks();

    return (
        <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <header className="text-center space-y-4">
                <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm">
                    <Rocket className="h-10 w-10 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Mission Setup</h1>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-2">{state.role} Activation Center</p>
                </div>
            </header>

            {/* Progress HUD */}
            <Card className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left overflow-hidden relative">
                <div className="relative z-10 flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Activation Progress</p>
                        <h2 className="text-5xl font-black text-foreground tracking-tighter leading-none">{state.score}%</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-500 px-4 py-1.5 rounded-full border border-emerald-100">Sync Active</span>
                    </div>
                </div>

                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 relative z-10">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_#F5A000]"
                        style={{ width: `${state.score}%` }}
                    />
                </div>

                <div className="space-y-4 relative z-10">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-2 mb-6">Required Deployments</p>
                    {remainingTasks.map(task => (
                        <div key={task.id} className={cn(
                            "flex items-center justify-between p-5 rounded-3xl border transition-all",
                            task.done ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                    task.done ? "bg-emerald-500 text-white" : "bg-white text-slate-300"
                                )}>
                                    {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </div>
                                <p className={cn("text-xs font-black uppercase tracking-tight", task.done ? "text-emerald-900" : "text-slate-400")}>{task.label}</p>
                            </div>
                            {!task.done && <ChevronRight size={16} className="text-slate-300" />}
                        </div>
                    ))}
                </div>

                <Button
                    onClick={onContinue}
                    className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 z-10 relative"
                >
                    Resume Mission <Zap size={18} className="ml-3 fill-current" />
                </Button>

                <Zap className="absolute -bottom-20 -right-20 h-64 w-64 text-primary/5 rotate-12 -z-0" />
            </Card>

            <footer className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <ShieldCheck size={12} className="text-primary" />
                        <span className="text-[8px] font-black uppercase text-slate-400">Enterprise Secure</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                        <Smartphone size={12} className="text-indigo-500" />
                        <span className="text-[8px] font-black uppercase text-slate-400">Apex Link v2.4</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
