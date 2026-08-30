'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Star, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACHIEVEMENT_CONFIG: Record<string, { title: string; desc: string; icon: React.ElementType; color: string }> = {
    'first-purchase': { title: 'Initiate Confirmed', desc: 'First tactical acquisition completed.', icon: Zap, color: 'text-amber-500' },
    'vip-shopper': { title: 'Elite Status Unlocked', desc: 'Welcome to the inner circle of high-velocity tech.', icon: Trophy, color: 'text-primary' },
    'gadget-hunter': { title: 'Collection Legend', desc: 'Your arsenal of tech is officially elite.', icon: Star, color: 'text-indigo-500' },
    'referral-commander': { title: 'Growth Agent', desc: 'Recruited new members to the Apex Grid.', icon: ShieldCheck, color: 'text-emerald-500' },
};

export default function AchievementPopup() {
    const [active, setActive] = React.useState<{ key: string; visible: boolean } | null>(null);

    React.useEffect(() => {
        const handleUnlock = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const key = detail.key;
            setActive({ key, visible: true });

            // Auto-hide after 5s
            setTimeout(() => {
                setActive(null);
            }, 6000);
        };

        window.addEventListener('apex-achievement-unlocked', handleUnlock);
        return () => window.removeEventListener('apex-achievement-unlocked', handleUnlock);
    }, []);

    if (!active) return null;

    const config = ACHIEVEMENT_CONFIG[active.key] || {
        title: 'Achievement Unlocked',
        desc: 'New mission milestone reached.',
        icon: Star,
        color: 'text-primary'
    };

    return (
        <AnimatePresence>
            {active.visible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="fixed top-24 right-8 z-[200] max-w-sm w-full"
                >
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 flex items-center gap-6 relative overflow-hidden group">
                        {/* Animated background pulse */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className={cn(
                            "h-16 w-16 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center shrink-0 border border-slate-50",
                            config.color
                        )}>
                            <config.icon className="h-8 w-8 animate-bounce" />
                        </div>

                        <div className="flex-1 text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">New Merit Badge</p>
                            <h3 className="text-lg font-black uppercase text-foreground leading-tight">{config.title}</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 italic">&quot;{config.desc}&quot;</p>
                        </div>

                        <button
                            onClick={() => setActive(null)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="absolute bottom-0 left-0 h-1 bg-primary animate-progress-shrink" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
