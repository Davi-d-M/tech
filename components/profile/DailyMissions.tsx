'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShoppingBag, Star, Video, Users, Heart, Share2, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { cn, getReferralLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Mission {
    mission_type: string;
    progress: number;
    is_completed: boolean;
}

const MISSION_CONFIG = [
    { type: 'buy-accessory', label: 'Buy Any Accessory', xp: '+100 XP', target: 2, icon: ShoppingBag, cta: 'Go to Shop', href: '/shop' },
    { type: 'review-product', label: 'Review Product', xp: '+50 XP', target: 5, icon: Star, cta: 'Review Now', href: '#buy-again-section' },
    { type: 'watch-video', label: 'Watch Product Video', xp: '+30 XP', target: 1, icon: Video, cta: 'Find Videos', href: '/shop' },
    { type: 'refer-friend', label: 'Refer Friend', xp: '+200 XP', target: 1, icon: Users, cta: 'Invite Now', action: 'refer' },
    { type: 'wishlist-items', label: 'Wishlist 5 Items', xp: '+40 XP', target: 5, icon: Heart, cta: 'Add Items', href: '/shop' },
    { type: 'share-product', label: 'Share Product', xp: '+25 XP', target: 1, icon: Share2, cta: 'Share Tech', href: '/shop' },
];

export default function DailyMissions({ userId, referralCode }: { userId: string, referralCode?: string }) {
    const [userMissions, setUserMissions] = useState<Record<string, Mission>>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchMissions() {
            if (!supabase || !userId) return;
            const { data } = await supabase.from('user_missions').select('*').eq('user_id', userId);
            const missionMap: Record<string, Mission> = {};
            data?.forEach(m => missionMap[m.mission_type] = m);
            setUserMissions(missionMap);
            setLoading(false);
        }
        fetchMissions();
    }, [userId]);

    const handleExecute = (config: typeof MISSION_CONFIG[0]) => {
        if (config.action === 'refer') {
            const text = `Check out Apexstores for premium tech! Use my link to get a member discount: ${getReferralLink(referralCode || 'APEX-MEMBER')}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            return;
        }

        if (config.href) {
            if (config.href.startsWith('#')) {
                const el = document.getElementById(config.href.substring(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    router.push('/shop'); // Fallback if buy-again section is hidden
                }
            } else {
                router.push(config.href);
            }
        }
    };

    if (loading) return (
        <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-50 rounded-3xl border border-slate-100" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MISSION_CONFIG.map((config) => {
                const mission = userMissions[config.type] || { progress: 0, is_completed: false };
                const progressPercent = (mission.progress / config.target) * 100;

                return (
                    <div
                        key={config.type}
                        className={cn(
                            "p-6 rounded-[2rem] border-2 transition-all group flex flex-col justify-between min-h-[180px]",
                            mission.is_completed ? "bg-primary/5 border-primary/20" : "bg-white border-slate-50 hover:border-primary/20 hover:shadow-xl"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                                mission.is_completed ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/5"
                            )}>
                                <config.icon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mb-1">{config.xp}</p>
                                {mission.is_completed ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                        <CheckCircle className="h-2.5 w-2.5" /> Complete
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                        <Zap className="h-2.5 w-2.5" /> Locked
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-900 mb-2 truncate">{config.label}</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tabular-nums">{mission.progress}/{config.target}</span>
                            </div>

                            {!mission.is_completed && (
                                <Button
                                    onClick={() => handleExecute(config)}
                                    className="w-full h-10 rounded-xl bg-white text-primary border-2 border-primary/10 hover:bg-primary hover:text-white font-black uppercase text-[8px] tracking-widest transition-all group/btn"
                                >
                                    {config.cta} <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
