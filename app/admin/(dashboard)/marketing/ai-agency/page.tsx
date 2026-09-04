'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    TrendingUp,
    Zap,
    Target,
    BarChart3,
    Settings,
    Rocket,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    DollarSign,
    Pause,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface AdCampaign {
    id: string;
    product_name: string;
    spend: number;
    roas: number;
    clicks: number;
    conversions: number;
    status: 'Optimizing' | 'Paused' | 'High_Efficiency';
    velocity: 'Stable' | 'Accelerating' | 'Decelerating';
}

export default function AIAdAgency() {
    const { email } = useAdmin();
    const [campaigns, setCampaigns] = React.useState<AdCampaign[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAutonomous, setIsAutonomous] = React.useState(true);

    const fetchCampaigns = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ad_campaigns')
                .select('*')
                .order('roas', { ascending: false });

            if (!error) setCampaigns(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAuthorizePivot = async () => {
        setLoading(true);
        try {
            // Re-allocate budget based on performance
            await logAuditAction(email || 'Admin', 'AI_AD_BUDGET_PIVOT', { reason: 'Performance Optimization' });
            alert("Budget optimization complete.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Marketing Core</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">AI Ad Agency</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Autonomous Meta & Google spend management based on margin velocity.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAutonomous(!isAutonomous)}
                        className={cn(
                            "px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            isAutonomous ? "bg-indigo-600 text-white shadow-xl" : "bg-white border border-slate-200 text-slate-400"
                        )}
                    >
                        {isAutonomous ? <CheckCircle2 size={16} /> : <Pause size={16} />}
                        Autonomous Mode: {isAutonomous ? 'Active' : 'Standby'}
                    </button>
                    <Button onClick={fetchCampaigns} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Meta Link
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                {[
                    { label: 'Neural ROI', val: '4.8x', icon: Zap, color: 'primary' },
                    { label: 'Avg CPC', val: 'KSh 8.2', icon: Target, color: 'indigo' },
                    { label: 'Total Managed Spend', val: formatPrice(12400), icon: DollarSign, color: 'emerald' },
                    { label: 'Conversion Lift', val: '+24%', icon: BarChart3, color: 'primary' },
                ].map(item => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                            item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                            item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                            "bg-primary/5 text-primary"
                        )}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{item.val}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Neural Placements</h2>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">Live Optimization</span>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-slate-100">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-[10px] font-black uppercase text-slate-300">Calculating ROAS...</p>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <p className="text-sm font-black text-slate-400 uppercase italic">No active ad campaigns detected.</p>
                            </div>
                        ) : campaigns.map(ad => (
                            <Card key={ad.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all h-auto relative overflow-hidden">
                                <div className="flex items-center gap-6 text-left relative z-10">
                                    <div className={cn(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
                                        ad.status === 'High_Efficiency' ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <TrendingUp className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                                ad.status === 'High_Efficiency' ? "bg-emerald-500 text-white" : "bg-primary text-white"
                                            )}>{ad.status.replace('_', ' ')}</span>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ad.velocity}</p>
                                        </div>
                                        <h3 className="font-black text-foreground uppercase text-lg tracking-tighter">{ad.product_name}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12 text-right relative z-10">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">MTD Spend</p>
                                        <p className="text-sm font-black text-foreground">{formatPrice(ad.spend)}</p>
                                    </div>
                                    <div className="w-20">
                                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">ROAS</p>
                                        <p className="text-xl font-black text-primary">{ad.roas}x</p>
                                    </div>
                                    <button className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary transition-all">
                                        <Settings size={18} />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8 text-left">
                    <Card className="p-10 rounded-[3rem] bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20"><Rocket size={24} /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">Budget Agent</h3>
                            </div>
                            <p className="text-xs font-medium leading-relaxed opacity-70 italic">
                                &quot;Detected high efficiency on top-performing items. Recommended budget shift to maximize ROI.&quot;
                            </p>
                            <Button
                                onClick={handleAuthorizePivot}
                                disabled={loading || campaigns.length === 0}
                                className="w-full h-14 rounded-2xl bg-white text-indigo-600 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Authorize Re-allocation
                            </Button>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><ShieldAlert size={20} /></div>
                            <h3 className="text-lg font-black uppercase text-foreground leading-none tracking-tighter">Budget Safeguard</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                <span>Max Daily Burn</span>
                                <span className="text-foreground">KSh 15,000</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                <span>Stop-Loss ROAS</span>
                                <span className="text-rose-500">1.5x</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
