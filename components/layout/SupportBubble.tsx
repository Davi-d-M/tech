'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Zap, ChevronRight, Package, ArrowLeft, Search, Loader2, CheckCircle, Send } from 'lucide-react';
import { useSettings } from '@/lib/useSettings';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
    full_name: string;
}

export default function SupportBubble() {
    const { settings } = useSettings();
    const [showLabel, setShowLabel] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'menu' | 'track' | 'message' | 'ai'>('menu');
    const [trackId, setTrackId] = useState('');
    const [trackResult, setTrackResult] = useState<{ id: string; status: string } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Connection Pulse
    const [isAiOnline, setIsAiOnline] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // AI Chat State
    const [aiInput, setAiInput] = useState('');
    const [aiChat, setAiChat] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
    const [isAiTyping, setIsAiAiTyping] = useState(false);

    // Message Form State
    const [msgForm, setMsgForm] = useState({ name: '', email: '', body: '' });
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        // 👮 Check for Admin Session
        const hasAdminSession = document.cookie.includes('admin_session');
        setIsAdmin(hasAdminSession);

        async function checkUser() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
                if (data) setUserProfile(data);
            }
        }
        checkUser();

        // 🧠 AI Pulse Check
        async function checkAiPulse() {
            try {
                const res = await fetch('/api/support/ai-concierge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'ping' }),
                });
                const data = await res.json();
                // If it doesn't contain the "Tactical Silence" message, it's real
                setIsAiOnline(data.response && !data.response.includes('Tactical Silence'));
            } catch {
                setIsAiOnline(false);
            }
        }
        checkAiPulse();

        // Persistent dismissal check
        const dismissed = localStorage.getItem('support_label_dismissed') === 'true';
        if (dismissed) return;

        const timer = setTimeout(() => setShowLabel(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismissLabel = () => {
        setShowLabel(false);
        localStorage.setItem('support_label_dismissed', 'true');
    };

    const handleChat = () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const message = `Hello Apexstores! I have a question about this page: ${url}`;
        window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleQuickTrack = async () => {
        if (!trackId.trim() || !supabase) return;
        setIsSearching(true);
        const { data } = await supabase.from('orders').select('status, id').eq('id', trackId.trim()).single();
        setTrackResult(data);
        setIsSearching(false);
    };

    const handleAiQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiInput.trim()) return;

        const userMsg = aiInput.trim();
        setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);
        setAiInput('');
        setIsAiAiTyping(true);

        try {
            const res = await fetch('/api/support/ai-concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });
            const data = await res.json();
            if (data.response) {
                setAiChat(prev => [...prev, { role: 'ai', text: data.response }]);
            }
        } catch {
            setAiChat(prev => [...prev, { role: 'ai', text: "I apologize, my connection is temporarily unstable. Please try again in a moment." }]);
        } finally {
            setIsAiAiTyping(false);
        }
    };

    const handleSubmitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !msgForm.name || !msgForm.email || !msgForm.body) return;

        setIsSending(true);
        const { error } = await supabase.from('messages').insert([{
            name: msgForm.name.trim(),
            email: msgForm.email.trim(),
            subject: 'In-App Support Ticket',
            message: msgForm.body.trim(),
            status: 'New'
        }]);

        if (!error) {
            setSent(true);
            setMsgForm({ name: '', email: '', body: '' });
            setTimeout(() => {
                setSent(false);
                setMode('menu');
            }, 3000);
        }
        setIsSending(false);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col items-end gap-4">

            {/* Greeting Label */}
            {showLabel && !isOpen && (
                <div className="bg-white px-6 py-4 rounded-[1.8rem] border border-slate-100 shadow-2xl animate-in slide-in-from-right-4 duration-500 flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">
                        {(userProfile?.full_name as string)?.substring(0, 1) || settings?.branding?.owner_name?.substring(0, 1) || 'A'}
                    </div>
                    <div className="text-left">
                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight">{userProfile?.full_name || settings?.branding?.owner_name || 'Admin'}</p>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                            {userProfile?.full_name ? `How can we help you today, ${userProfile.full_name.split(' ')[0]}?` : "How can we help you today?"}
                        </p>
                    </div>
                    <button onClick={handleDismissLabel} className="text-slate-300 hover:text-rose-500 ml-4 transition-colors"><X className="h-3 w-3" /></button>
                </div>
            )}

            {/* Smart Dashboard */}
            {isOpen && (
                <div className="bg-white rounded-[2.5rem] w-80 shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-primary p-6 text-white flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Zap className="h-4 w-4 fill-current" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Apex Support</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                    </div>

                    <div className="p-6 space-y-4">
                        {mode === 'menu' ? (
                            <>
                                <button onClick={() => setMode('ai')} className="w-full p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all text-left flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm relative">
                                            <Zap className="h-4 w-4" />
                                            {isAdmin && (
                                                <div className={cn(
                                                    "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white",
                                                    isAiOnline ? "bg-emerald-500" : "bg-slate-300"
                                                )} />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-foreground">Apex AI Finder</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-primary/30" />
                                </button>
                                <button onClick={() => setMode('track')} className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all text-left flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm"><Package className="h-4 w-4" /></div>
                                        <span className="text-[10px] font-black uppercase text-foreground">Track My Order</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                </button>
                                <button onClick={handleChat} className="w-full p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all text-left flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><MessageCircle className="h-4 w-4" /></div>
                                        <span className="text-[10px] font-black uppercase text-foreground">Speak to Sales</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-primary/30" />
                                </button>
                            </>
                        ) : mode === 'ai' ? (
                            <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-[350px]">
                                <button onClick={() => setMode('menu')} className="text-[9px] font-black uppercase text-slate-400 hover:text-primary flex items-center gap-1 transition-colors">
                                    <ArrowLeft className="h-3 w-3" /> Back
                                </button>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide no-scrollbar">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black uppercase text-primary mb-1">Apex Assistant</p>
                                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">&quot;Hello! I&apos;m your Apex assistant. How can I help you find the perfect gadget today?&quot;</p>
                                    </div>

                                    {aiChat.map((chat, i) => (
                                        <div key={i} className={cn(
                                            "p-3 rounded-2xl border transition-all animate-in zoom-in-95",
                                            chat.role === 'user' ? "bg-white border-slate-100 ml-6" : "bg-primary/5 border-primary/10 mr-6"
                                        )}>
                                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{chat.role === 'user' ? 'You' : 'Apex AI'}</p>
                                            <p className="text-[10px] font-medium text-foreground leading-relaxed whitespace-pre-wrap">{chat.text}</p>
                                        </div>
                                    ))}

                                    {isAiTyping && (
                                        <div className="flex gap-1.5 p-2 items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150"></div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleAiQuery} className="relative mt-auto">
                                    <input
                                        value={aiInput}
                                        onChange={e => setAiInput(e.target.value)}
                                        placeholder="Ask about a gadget..."
                                        className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAiTyping}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-30 shadow-lg shadow-primary/20"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        ) : mode === 'track' ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <button onClick={() => { setMode('menu'); setTrackResult(null); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-primary flex items-center gap-1 transition-colors">
                                    <ArrowLeft className="h-3 w-3" /> Back
                                </button>
                                <div className="relative">
                                    <input
                                        value={trackId}
                                        onChange={e => setTrackId(e.target.value)}
                                        placeholder="Order ID..."
                                        className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <button
                                        onClick={handleQuickTrack}
                                        disabled={isSearching}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </button>
                                </div>
                                {trackResult && (
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-in zoom-in-95">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                        <p className="text-sm font-black text-foreground uppercase tracking-tight">{trackResult.status}</p>
                                        <Link href={`/track?id=${trackResult.id}`} className="text-[9px] font-black text-primary uppercase underline mt-2 block">Full Tracking Detail</Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <button onClick={() => { setMode('menu'); setSent(false); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-primary flex items-center gap-1 transition-colors">
                                    <ArrowLeft className="h-3 w-3" /> Back
                                </button>

                                {sent ? (
                                    <div className="py-10 text-center space-y-3 animate-in zoom-in-95">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
                                            <CheckCircle className="h-6 w-6" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-foreground tracking-tight">Message Received!</p>
                                        <p className="text-[9px] text-slate-400 font-medium px-4 leading-relaxed">Our elite team will reach out via email shortly.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitMessage} className="space-y-3">
                                        <input
                                            required
                                            value={msgForm.name}
                                            onChange={e => setMsgForm({...msgForm, name: e.target.value})}
                                            placeholder="Your Name"
                                            className="w-full h-10 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <input
                                            required
                                            type="email"
                                            value={msgForm.email}
                                            onChange={e => setMsgForm({...msgForm, email: e.target.value})}
                                            placeholder="Email Address"
                                            className="w-full h-10 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <textarea
                                            required
                                            value={msgForm.body}
                                            onChange={e => setMsgForm({...msgForm, body: e.target.value})}
                                            placeholder="How can we help?"
                                            rows={3}
                                            className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-primary resize-none"
                                        />
                                        <button
                                            disabled={isSending}
                                            className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                        >
                                            {isSending ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative border-4 border-white"
            >
                {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7 group-hover:rotate-12 transition-transform" />}
                {!isOpen && <span className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-white animate-pulse"></span>}
            </button>
        </div>
    );
}
