'use client';

import { Flame, Info } from 'lucide-react';

interface DailyStreakProps {
    currentStreak: number;
    milestoneDays?: number;
    milestoneReward?: string;
}

export default function DailyStreak({ currentStreak, milestoneDays = 14, milestoneReward = "KSh 500 Voucher" }: DailyStreakProps) {
    const progress = (currentStreak / milestoneDays) * 100;
    const daysLeft = Math.max(0, milestoneDays - currentStreak);

    return (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group text-left">
            <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="h-16 w-16 rounded-[1.8rem] bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500 border border-rose-100">
                        <Flame className="h-8 w-8 fill-current" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Streak</p>
                        <p className="text-4xl font-black text-foreground tracking-tighter uppercase">{currentStreak} <span className="text-rose-500 italic">Days</span></p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase text-foreground tracking-tight">Milestone Progress</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{currentStreak}/{milestoneDays} Days</p>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                        <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0 mt-1"><Info className="h-4 w-4" /></div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                            {daysLeft > 0
                                ? `Keep shopping for ${daysLeft} more days to unlock your elite ${milestoneReward}. Don't break the chain!`
                                : `Elite Milestone Reached! Your ${milestoneReward} has been credited.`
                            }
                        </p>
                    </div>
                </div>
            </div>
            {/* Background Pattern */}
            <Flame className="absolute -bottom-10 -left-10 h-64 w-64 text-slate-50 rotate-12 -z-0 opacity-40" />
        </div>
    );
}
