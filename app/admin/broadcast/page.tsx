'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Send,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminBroadcastPage() {
    const [subscribers, setSubscribers] = useState<{ id: string | number; email: string; created_at: string }[]>([]);
    // const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [resendActive, setResendActive] = useState<boolean | null>(null);

    const CAMPAIGN_TEMPLATES = [
        { id: 'flash', label: 'Flash Sale', content: `🚨 ALERT: Elite Flash Sale active now! Get 20% OFF all premium accessories for the next 4 hours only. Secure yours: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}/shop` },
        { id: 'weekend', label: 'Weekend Drop', content: `Yo bro! Our Weekend Drop is live. Restocked AirPods Pro and MagSafe kits. Nairobi fast dispatch active until 6 PM. Shop: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}` },
        { id: 'christmas', label: 'Christmas', content: `🎄 Holiday Tech Protocol: Give the gift of performance. Exclusive Christmas bundles now available with free delivery across Nairobi. Explore: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}` },
        { id: 'black-friday', label: 'Black Friday', content: `🌑 DARK OPS: Black Friday is here. Unbeatable prices on all armor-grade cases and super chargers. Limited payload. Extract here: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com'}` }
    ];

    const applyTemplate = (content: string) => {
        setMessage(content);
        if (channel === 'email') setSubject("New Apexstores Tech Alert 🚀");
    };

    useEffect(() => {
        async function fetchSubscribers() {
            if (!supabase) return;
            const { data } = await supabase.from('newsletter_subscribers').select('*');
            setSubscribers(data || []);
            // setLoading(false);
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
        checkResend();
    }, []);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        setStatus(null);

        try {
            const response = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel, subject, message }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to send broadcast.");

            setMessage('');
            setSubject('');
        } catch (err: unknown) {
            const error = err as Error;
            setStatus({ type: 'error', text: error.message || "Failed to send broadcast." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-left">
            <header className="border-b border-slate-200 pb-8">
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Broadcast Center</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Send mass updates, flash sale alerts, and news to your community.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-12 text-left">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Campaign Launchpad</p>
                            <div className="flex flex-wrap gap-2">
                                {CAMPAIGN_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t.content)}
                                        className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-black uppercase text-slate-500 hover:border-primary hover:text-primary transition-all active:scale-95"
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm">
                            <button
                                onClick={() => setChannel('email')}
                                className={cn(
                                    "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    channel === 'email' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Mail className="h-3.5 w-3.5" /> Email
                            </button>
                            <button
                                onClick={() => setChannel('whatsapp')}
                                className={cn(
                                    "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    channel === 'whatsapp' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Phone className="h-3.5 w-3.5" /> WhatsApp
                            </button>
                        </div>

                        <form onSubmit={handleSend} className="space-y-6">
                            {channel === 'email' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Line</label>
                                    <Input
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="Flash Sale: 20% OFF Everything!"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-sm font-bold"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Content</label>
                                <Textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    rows={8}
                                    className="rounded-2xl bg-slate-50 border-slate-100 text-sm font-medium resize-none p-6"
                                />
                            </div>

                            <Button disabled={sending || subscribers.length === 0 || (channel === 'email' && resendActive === false)} className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Dispatching...</> : <><Send className="h-4 w-4 mr-2" /> Send to {subscribers.length} People</>}
                            </Button>
                        </form>

                        {channel === 'email' && resendActive === false && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Email service inactive: RESEND_API_KEY is missing.
                                </p>
                            </div>
                        )}


                        {status && (
                            <div className={cn(
                                "p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in zoom-in-95",
                                status.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/10 border-primary/20 text-primary"
                            )}>
                                {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                <p className="text-[10px] font-black uppercase tracking-widest">{status.text}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <Zap className="h-8 w-8 mb-6 text-white/50" />
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Marketing Reach</h3>
                                <p className="text-5xl font-black mb-4">{subscribers.length}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Verified Subscribers</p>
                            </div>
                            <Link href="/admin/subscribers">
                                <Button variant="ghost" className="h-10 px-4 rounded-xl text-white/50 hover:text-white hover:bg-white/10 font-black uppercase text-[8px] tracking-widest">
                                    View All
                                </Button>
                            </Link>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Recent Campaigns</h4>
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 font-bold uppercase italic text-center py-4">No recent history.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
