'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShoppingBag, Smartphone, MessageSquare, Users, Rocket, Gem, Lock, Star, ShieldCheck, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const IconMap: Record<string, React.ElementType> = {
    Star, ShieldCheck, Crown, Gem, Trophy, ShoppingBag, Smartphone, MessageSquare, Users, Rocket
};

interface Achievement {
    achievement_key: string;
}

export default function AchievementBadges({ userId }: { userId: string }) {
    const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
    const [badges, setBadges] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!supabase || !userId) return;

            try {
                const [achRes, settingsRes] = await Promise.all([
                    supabase.from('user_achievements').select('achievement_key').eq('user_id', userId),
                    supabase.from('settings').select('*').eq('key', 'gamification').maybeSingle()
                ]);

                if (achRes.data) setUnlocked(new Set(achRes.data.map(a => a.achievement_key)));

                if (settingsRes.data?.value?.badges) {
                    setBadges(settingsRes.data.value.badges);
                } else {
                    // Fallback to internal defaults if settings missing
                    setBadges([
                        { key: 'first-purchase', label: 'First Purchase', icon: 'ShoppingBag', desc: 'Your first tech extraction complete.' },
                        { key: 'gadget-hunter', label: 'Gadget Hunter', icon: 'Smartphone', desc: 'Own 5+ elite devices.' },
                        { key: 'reviewer', label: 'Reviewer', icon: 'MessageSquare', desc: 'Shared expertise on 5+ gadgets.' },
                        { key: 'influencer', label: 'Influencer', icon: 'Users', desc: 'Referred a friend successfully.' },
                        { key: 'vip-shopper', label: 'VIP Shopper', icon: 'Rocket', desc: 'Spent over KSh 50,000.' },
                        { key: 'tech-master', label: 'Tech Master', icon: 'Gem', desc: 'Achieved Diamond Rank.' },
                    ]);
                }
            } catch (err: unknown) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId]);

    if (loading) return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-50 rounded-3xl border border-slate-100" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((badge) => {
                const isUnlocked = unlocked.has(badge.key);
                const Icon = IconMap[badge.icon] || Star;
                return (
                    <div
                        key={badge.key}
                        className={cn(
                            "p-6 rounded-[2.5rem] border transition-all text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden group",
                            isUnlocked ? "bg-white border-primary/20 shadow-xl" : "bg-slate-50 border-slate-100 opacity-60 grayscale"
                        )}
                    >
                        <div className={cn(
                            "h-16 w-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700",
                            isUnlocked ? "bg-primary/10 text-primary shadow-lg shadow-primary/10 scale-110 rotate-3" : "bg-white text-slate-200"
                        )}>
                            <Icon className="h-8 w-8" />
                        </div>

                        <div className="space-y-1">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isUnlocked ? "text-slate-900" : "text-slate-400")}>{badge.label}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter max-w-[100px] leading-tight">{badge.desc}</p>
                        </div>

                        {!isUnlocked && (
                            <div className="absolute top-4 right-4">
                                <Lock className="h-3 w-3 text-slate-300" />
                            </div>
                        )}

                        {isUnlocked && (
                            <div className="absolute -bottom-6 -right-6 h-20 w-20 bg-primary/5 rounded-full blur-xl animate-pulse" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
