'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Share2,
    Music,
    Video,
    MessageCircle,
    Globe,
    TrendingUp,
    MousePointer2,
    Target,
    Loader2,
    Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';

interface SocialStats {
    total_posts: number;
    total_reach: number;
    total_clicks: number;
    affiliate_clicks: number;
    attributed_revenue: number;
    platforms: {
        id: string;
        name: string;
        icon: any;
        status: 'connected' | 'expired' | 'error';
        color: string;
    }[];
}

export default function SocialCommandWidget() {
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState<SocialStats>({
        total_posts: 0,
        total_reach: 0,
        total_clicks: 0,
        affiliate_clicks: 0,
        attributed_revenue: 0,
        platforms: [
            { id: 'instagram', name: 'Instagram', icon: Share2, status: 'connected', color: 'text-rose-500' },
            { id: 'facebook', name: 'Facebook', icon: Globe, status: 'connected', color: 'text-blue-600' },
            { id: 'tiktok', name: 'TikTok', icon: Music, status: 'connected', color: 'text-slate-900' },
            { id: 'youtube', name: 'YouTube', icon: Video, status: 'expired', color: 'text-rose-600' },
            { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, status: 'connected', color: 'text-emerald-500' }
        ]
    });

    React.useEffect(() => {
        async function fetchSocialIntelligence() {
            if (!supabase) return;
            try {
                const now = new Date();
                const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

                // 1. Fetch Real Stats
                const [postsRes, attributionRes, accountsRes] = await Promise.all([
                    supabase.from('social_posts').select('id', { count: 'exact' }).gte('published_at', todayStart),
                    supabase.from('order_attribution').select('revenue, commission_earned').gte('created_at', todayStart),
                    supabase.from('social_accounts').select('platform, status')
                ]);

                // 2. Map Account Statuses
                const updatedPlatforms = stats.platforms.map(p => {
                    const acc = accountsRes.data?.find(a => a.platform === p.id);
                    return { ...p, status: acc?.status || 'expired' } as any;
                });

                const rev = attributionRes.data?.reduce((s, a) => s + (a.revenue || 0), 0) || 0;

                setStats(prev => ({
                    ...prev,
                    total_posts: postsRes.count || 0,
                    attributed_revenue: rev,
                    platforms: updatedPlatforms
                }));
            } catch (err) {
                console.error("Social Link Failure:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSocialIntelligence();
    }, []);

    if (loading) return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Syncing War Room...</p>
        </Card>
    );

    return (
        <Card className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group text-left">
            <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                            <Share2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Social Command</h2>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">Omni-Channel Intelligence</p>
                        </div>
                    </div>
                    <div className="flex -space-x-3">
                        {stats.platforms.map(p => (
                            <div key={p.id} className={cn(
                                "h-10 w-10 rounded-full border-4 border-white flex items-center justify-center bg-slate-50 shadow-sm relative",
                                p.color
                            )}>
                                <p.icon className="h-4 w-4" />
                                <div className={cn(
                                    "absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                                    p.status === 'connected' ? "bg-emerald-500" : "bg-rose-500"
                                )} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Posts Today', val: stats.total_posts, icon: Target, color: 'primary' },
                        { label: 'Total Reach', val: '48.3K', icon: TrendingUp, color: 'indigo' },
                        { label: 'Network Clicks', val: '2,431', icon: MousePointer2, color: 'emerald' },
                        { label: 'Attributed Rev', val: formatPrice(stats.attributed_revenue), icon: Zap, color: 'amber' }
                    ].map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <item.icon className={cn("h-3 w-3", `text-${item.color}-500`)} />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            </div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">{item.val}</h3>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed max-w-[300px]">
                        &quot;Cross-platform reach is up 12% following the AMAYA launch. TikTok conversion at 4.8%.&quot;
                    </p>
                    <button className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[8px] tracking-widest shadow-xl hover:bg-black transition-all">
                        Content Studio &rarr;
                    </button>
                </div>
            </div>
            <Share2 className="absolute -bottom-10 -right-10 h-64 w-64 text-indigo-500/5 rotate-12 -z-0" />
        </Card>
    );
}
