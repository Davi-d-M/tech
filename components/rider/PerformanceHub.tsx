'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, Activity, BatteryMedium, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceProps {
    tier: string;
    rating: number;
    acceptance: number;
    maintenanceStatus: string;
}

export default function PerformanceHub({ tier, rating, acceptance, maintenanceStatus }: PerformanceProps) {
    const isHealthy = maintenanceStatus === 'Healthy';

    return (
        <section className="space-y-6 text-left">
            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 px-2">Operator Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 🏆 RANK CARD */}
                <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Current Tier</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{tier}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Next: Silver (14 Missions)</p>
                        </div>
                    </div>
                </Card>

                {/* ⭐ RATING CARD */}
                <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <Star className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600">Top 5%</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{rating.toFixed(2)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Tactical Rating</p>
                    </div>
                </Card>

                {/* ⚡ ACCEPTANCE RATE */}
                <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                        <Activity className="h-4 w-4 text-slate-100" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900">{acceptance}%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Mission Acceptance</p>
                    </div>
                </Card>

            </div>

            {/* 🛠️ MAINTENANCE MONITOR */}
            <Card className={cn(
                "p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden group",
                isHealthy ? "bg-white border-slate-100" : "bg-rose-50 border-rose-100 animate-pulse"
            )}>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "h-16 w-16 rounded-[1.8rem] flex items-center justify-center shadow-sm transition-transform group-hover:rotate-6",
                            isHealthy ? "bg-primary/10 text-primary" : "bg-rose-500 text-white"
                        )}>
                            {isHealthy ? <BatteryMedium className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                        </div>
                        <div>
                            <h3 className={cn("text-xl font-black uppercase tracking-tighter", isHealthy ? "text-slate-900" : "text-rose-600")}>
                                {isHealthy ? "Unit Health Optimal" : "Maintenance Required"}
                            </h3>
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic mt-1">
                                {isHealthy
                                    ? "Your vehicle protocol is stable. Service recommended in 482 missions."
                                    : "Protocol Alert: Scheduled maintenance overdue. Safety check required."
                                }
                            </p>
                        </div>
                    </div>
                    <Button className={cn(
                        "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl",
                        isHealthy ? "bg-slate-50 text-slate-400" : "bg-rose-600 text-white shadow-rose-200"
                    )}>
                        Log Service
                    </Button>
                </div>
            </Card>

        </section>
    );
}
