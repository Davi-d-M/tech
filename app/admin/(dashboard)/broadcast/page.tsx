'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Send,
  Mail,
  Activity as Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Users,
  Target,
  Clock,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatPrice } from '@/lib/utils';

export default function AdminBroadcastPage() {
    const [subscribers, setSubscribers] = React.useState<{ id: string | number; email: string; created_at: string }[]>([]);
    const [campaignOrders, setCampaignOrders] = React.useState<{ total_price: number }[]>([]);
    const [sending, setSending] = React.useState(false);
    const [channel, setChannel] = React.useState<'email' | 'whatsapp'>('email');
    const [audience, setAudience] = React.useState<'all' | 'new' | 'vip' | 'inactive'>('all');
    const [schedule, setSchedule] = React.useState<'now' | 'later'>('now');
    const [subject, setSubject] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [status, setStatus] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [resendActive, setResendActive] = React.useState<boolean | null>(null);

    const CAMPAIGN_TEMPLATES = [
        { id: 'flash', label: 'Flash Sale', content: `🚨 ALERT: Flash Sale active now! Get 20% OFF all accessories for the next 4 hours only. Shop now: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/shop` },
        { id: 'weekend', label: 'Weekend Drop', content: `The Weekend Drop is live! AirPods and chargers have been restocked. Shop: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}` },
        { id: 'loyalty', label: 'Reward Boost', content: `VIP rewards have been boosted! Complete your profile to unlock a KSh 500 voucher instantly. Link: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/profile` },
    ];

    const AUDIENCES = [
        { id: 'all', label: 'All Customers', icon: Users },
        { id: 'new', label: 'New Customers', icon: Sparkles },
        { id: 'vip', label: 'VIP Members', icon: Target },
        { id: 'inactive', label: 'Inactive (30d)', icon: Clock },
    ];

    const applyTemplate = (content: string) => {
        setMessage(content);
        if (channel === 'email') setSubject("Apexstores Tech Protocol 🚀");
    };

    React.useEffect(() => {
        async function fetchSubscribers() {
            if (!supabase) return;
            const { data } = await supabase.from('newsletter_subscribers').select('*');
            setSubscribers(data || []);
        }

        async function fetchCampaignROI() {
            if (!supabase) return;
            // Fetch orders attributed to referrals/campaigns
            const { data } = await supabase
                .from('orders')
                .select('total_price')
                .not('referred_by_code', 'is', null)
                .eq('status', 'Delivered');
            setCampaignOrders(data || []);
        }

        async function checkResend() {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setResendActive(data.resend === 'Configured');
            } catch {
                setResendActive(false);
            }
        }

        fetchSubscribers();
        fetchCampaignROI();
        checkResend();
    }, []);

    const totalCampaignRevenue = React.useMemo(() => {
        return campaignOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    }, [campaignOrders]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        setStatus(null);

        try {
            const response = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel, subject, message, audience, schedule }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to initiate campaign.");

            setStatus({ type: 'success', text: `Campaign "${audience.toUpperCase()}" deployed via ${channel.toUpperCase()}!` });
            setMessage('');
            setSubject('');
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: 'error', text: error.message || "Broadcast failed." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Marketing Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Campaign Builder</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Design and deploy high-impact messages to your audience.</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-card rounded-[3rem] border border-border p-10 shadow-sm space-y-10 relative overflow-hidden">

                        {/* 1. Launchpad Templates */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Campaign Launchpad</p>
                            <div className="flex flex-wrap gap-2">
                                {CAMPAIGN_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t.content)}
                                        className="px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-black uppercase text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-95"
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Configuration Grid */}
                        <div className="grid sm:grid-cols-2 gap-8">
                            {/* Audience Select */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Audience</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AUDIENCES.map(a => (
                                        <button
                                            key={a.id}
                                        onClick={() => setAudience(a.id as 'all' | 'new' | 'vip' | 'inactive')}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all text-left flex flex-col gap-2",
                                                audience === a.id ? "bg-primary/5 border-primary text-primary" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                                            )}
                                        >
                                            <a.icon size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{a.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Channel & Schedule */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dispatch Channel</label>
                                    <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                        <button onClick={() => setChannel('email')} className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", channel === 'email' ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}><Mail size={14} /> Email</button>
                                        <button onClick={() => setChannel('whatsapp')} className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", channel === 'whatsapp' ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}><Phone size={14} /> WhatsApp</button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Schedule Timing</label>
                                    <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-200">
                                        <button onClick={() => setSchedule('now')} className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", schedule === 'now' ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}><Zap size={14} /> Instant</button>
                                        <button onClick={() => setSchedule('later')} className={cn("flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all", schedule === 'later' ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground")}><Calendar size={14} /> Scheduled</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Composer */}
                        <form onSubmit={handleSend} className="space-y-6 pt-6 border-t border-border">
                            {channel === 'email' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Subject</label>
                                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Flash Sale: 20% OFF Everything!" className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-sm font-bold text-foreground" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Body</label>
                                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement here..." rows={8} className="rounded-[2rem] bg-slate-50 border-slate-200 text-sm font-medium resize-none p-8 text-foreground" />
                            </div>

                            <Button disabled={sending || subscribers.length === 0 || (channel === 'email' && resendActive === false)} className="w-full h-20 rounded-[1.5rem] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {sending ? <><Loader2 className="h-5 w-5 animate-spin mr-3" /> Engaging...</> : <><Send className="h-5 w-5 mr-3" /> Launch Campaign</>}
                            </Button>
                        </form>

                        {channel === 'email' && resendActive === false && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Email service inactive: RESEND_API_KEY is missing.</p>
                            </div>
                        )}

                        {status && (
                            <div className={cn("p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in fade-in zoom-in-95", status.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600")}>
                                {status.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                                <p className="text-[11px] font-black uppercase tracking-widest">{status.text}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Marketing Reach Summary */}
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <Zap className="h-8 w-8 mb-8 text-primary animate-pulse" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-6 text-foreground">Audience Intel</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Total Reach</span>
                                    <span className="text-4xl font-black text-foreground tracking-tighter leading-none">{subscribers.length}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Open Rate</p>
                                        <p className="text-xl font-black text-foreground tracking-tighter">72.4%</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">CTR</p>
                                        <p className="text-xl font-black text-foreground tracking-tighter">18.9%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                    </Card>

                    {/* Campaign Performance Pulse */}
                    <div className="bg-card rounded-[3rem] border border-border p-10 shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">ROI Extraction</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-left">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Revenue Generated</span>
                                <span className="text-lg font-black text-foreground">{formatPrice(totalCampaignRevenue)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (totalCampaignRevenue / 50000) * 100)}%` }}></div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Measured across delivered referral orders.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
