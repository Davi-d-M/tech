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
    Plus,
    ChevronRight,
    Send,
    Camera as Instagram,
    MessageCircle,
    Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import Link from 'next/link';

export default function MarketingOverview() {
    const [stats, setStats] = useState({
        totalReach: 12480,
        activeCampaigns: 3,
        generatedOrders: 47,
        marketingROI: 4.7
    });

    const recentCampaigns = [
        { id: '1', name: 'AMAYA AM-05 Launch', type: 'Product Launch', status: 'Live', reach: 8421, conversions: 12 },
        { id: '2', name: 'Elite Audio Flash Sale', type: 'Flash Sale', status: 'Published', reach: 3200, conversions: 24 },
        { id: '3', name: 'Weekend Tech Protocol', type: 'Restock', status: 'Scheduled', reach: 0, conversions: 0 },
    ];

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Tactical Reach', val: stats.totalReach.toLocaleString(), icon: Users, color: 'indigo' },
                    { label: 'Active Deployments', val: stats.activeCampaigns, icon: Send, color: 'primary' },
                    { label: 'Orders Generated', val: stats.generatedOrders, icon: Target, color: 'emerald' },
                    { label: 'Campaign ROI', val: `${stats.marketingROI}x`, icon: TrendingUp, color: 'primary' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-card border-border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="relative z-10">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                "bg-primary/10 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Channel Pulse */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Recent Deployments</h2>
                        <Link href="/admin/marketing/list" className="text-[10px] font-black text-primary uppercase underline">View Full History</Link>
                    </div>

                    <div className="grid gap-4">
                        {recentCampaigns.map(camp => (
                            <Card key={camp.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-primary shadow-inner">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground uppercase text-lg tracking-tighter">{camp.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{camp.type}</span>
                                            <div className="h-1 w-1 rounded-full bg-border"></div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                camp.status === 'Live' ? "text-emerald-500" : "text-primary"
                                            )}>{camp.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12 text-right">
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reach</p>
                                        <p className="text-lg font-black text-foreground">{camp.reach.toLocaleString()}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Impact</p>
                                        <p className="text-lg font-black text-emerald-500">{camp.conversions} Sales</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Automation & Insights */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8 text-left">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Channel Mastery</h3>
                                <div className="flex -space-x-2">
                                    <div className="h-8 w-8 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center border-2 border-foreground"><Instagram size={14} className="text-primary" /></div>
                                    <div className="h-8 w-8 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center border-2 border-foreground"><MessageCircle size={14} className="text-emerald-500" /></div>
                                    <div className="h-8 w-8 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center border-2 border-foreground"><Mail size={14} className="text-indigo-400" /></div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-background/50">
                                        <span>WhatsApp Conversion</span>
                                        <span className="text-emerald-500">12.4%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[72%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-background/50">
                                        <span>Instagram Reach</span>
                                        <span className="text-primary">8.4K</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[55%]"></div>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-14 rounded-2xl bg-primary text-background font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                Analyze Funnel Details
                            </Button>
                        </div>
                    </Card>

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
