'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Activity as Zap,
    Rocket,
    Users,
    Target,
    BarChart3,
    TrendingUp,
    ChevronRight,
    Send,
    Camera as Instagram,
    MessageCircle,
    Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MarketingOverview() {
    const [stats, setStats] = React.useState({
        totalReach: 12480,
        activeCampaigns: 0,
        generatedOrders: 0,
        marketingROI: 4.7
    });
    const [recentCampaigns, setRecentCampaigns] = React.useState<{ id: string, name: string, type: string, status: string, reach?: number, conversions?: number, products?: { name: string } }[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchMarketingData() {
            if (!supabase) return;
            try {
                const [campRes, ordersRes, profilesRes] = await Promise.all([
                    supabase.from('marketing_campaigns').select('*, products(name)').order('created_at', { ascending: false }).limit(3),
                    supabase.from('orders').select('id, referred_by_code').not('referred_by_code', 'is', null),
                    supabase.from('profiles').select('id').not('referral_code', 'is', null)
                ]);

                if (campRes.data) {
                    setRecentCampaigns(campRes.data);
                    setStats(prev => ({
                        ...prev,
                        activeCampaigns: campRes.data.filter(c => c.status === 'Published' || c.status === 'Live').length,
                        generatedOrders: ordersRes.data?.length || 0,
                        totalReach: (profilesRes.data?.length || 0) * 12 // Simulated reach multiplier per creator
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMarketingData();
    }, []);

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Marketing Command</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Campaign Overview</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Multi-channel growth engine and tactical audience outreach.</p>
                </div>
                <Link href="/admin/marketing/create">
                    <Button className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <Rocket className="h-4 w-4" /> Initialize Campaign
                    </Button>
                </Link>
            </header>

            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                {[
                    { label: 'Total Tactical Reach', val: stats.totalReach.toLocaleString(), icon: Users, color: 'indigo' },
                    { label: 'Active Deployments', val: stats.activeCampaigns, icon: Send, color: 'primary' },
                    { label: 'Orders Generated', val: stats.generatedOrders, icon: Target, color: 'emerald' },
                    { label: 'Campaign ROI', val: `${stats.marketingROI}x`, icon: TrendingUp, color: 'primary' },
                ].map((item) => (
                    <Card key={item.label} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden h-full">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-sm",
                                    item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                    item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                    "bg-primary/5 text-primary"
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                {/* Channel Pulse */}
                <div className="lg:col-span-8 space-y-8 flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 shrink-0">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Recent Deployments</h2>
                        <Link href="/admin/marketing/list" className="text-[10px] font-black text-primary uppercase underline tracking-widest">View Mission Log</Link>
                    </div>

                    <div className="grid gap-4 flex-1">
                        {loading ? (
                             [...Array(3)].map((_, i) => (
                                <Card key={i} className="h-32 rounded-[3rem] border border-slate-100 animate-pulse bg-white"></Card>
                             ))
                        ) : recentCampaigns.length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-40">
                                <Rocket className="h-10 w-10 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No active deployments found.</p>
                            </div>
                        ) : recentCampaigns.map(camp => (
                            <Card key={camp.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all h-auto">
                                <div className="flex items-center gap-6 text-left">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground uppercase text-lg tracking-tighter leading-none">{camp.name}</h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{camp.type}</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                camp.status === 'Published' || camp.status === 'Live' ? "text-emerald-500" : "text-primary"
                                            )}>{camp.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12 text-right">
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Payload</p>
                                        <p className="text-sm font-black text-foreground uppercase">{camp.products?.name?.substring(0, 15) || 'Global'}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Automation & Insights */}
                <div className="lg:col-span-4 flex flex-col gap-10 h-full">
                    <Card className="p-10 rounded-[3.5rem] border border-slate-100 bg-white shadow-xl relative overflow-hidden group flex-1">
                        <div className="relative z-10 space-y-8 text-left h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Channel Mastery</h3>
                                    <div className="flex -space-x-2">
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border-2 border-slate-50 shadow-sm"><Instagram size={14} className="text-primary" /></div>
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border-2 border-slate-50 shadow-sm"><MessageCircle size={14} className="text-emerald-500" /></div>
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border-2 border-slate-50 shadow-sm"><Mail size={14} className="text-indigo-400" /></div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            <span>WhatsApp Conversion</span>
                                            <span className="text-emerald-500">12.4%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-emerald-500 w-[72%]"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            <span>Instagram Reach</span>
                                            <span className="text-primary">8.4K</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-primary w-[55%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link href="/admin/analytics" className="mt-auto">
                                <Button className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                    Analyze Funnel Details
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-border shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Users className="h-5 w-5" /></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">Personalization</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;Current category affinity maps show elite preference for Audio gadgets. Personalized &apos;Welcome Back&apos; triggers active for Gold tier.&quot;
                        </p>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Logic Active</span>
                            <span className="text-xs font-black text-foreground">84% Yield</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[3rem] bg-white border border-border shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><BarChart3 className="h-5 w-5" /></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">Yield Insight</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;Rider broadcasts on Saturday mornings see a 40% higher open rate. I recommend scheduling the Weekend Tech Drop for 09:30 AM tomorrow.&quot;
                        </p>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Confidence Score</span>
                            <span className="text-xs font-black text-foreground">92%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
