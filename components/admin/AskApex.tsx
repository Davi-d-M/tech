'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Sparkles,
    Send,
    Loader2,
    X,
    Bot,
    TrendingUp,
    Users,
    Package,
    DollarSign,
    Mic,
    MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';

export default function AskApex() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant', text: string | React.ReactNode }[]>([]);
    const [isListening, setIsListening] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    const startVoiceCommand = () => {
        // @ts-expect-error - WebkitSpeechRecognition is a browser global
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice Protocol not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: unknown) => {
            const transcript = (event as { results: { [key: number]: { [key: number]: { transcript: string } } } }).results[0][0].transcript;
            setQuery(transcript);
            // Auto-submit after voice
            setTimeout(() => {
                const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
                handleAsk(fakeEvent, transcript);
            }, 500);
        };
        recognition.start();
    };

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleAsk = async (e: React.FormEvent, voiceQuery?: string) => {
        e.preventDefault();
        const textToAsk = voiceQuery || query;
        if (!textToAsk.trim() || isLoading) return;

        const userQuery = textToAsk.trim();
        setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
        setQuery('');
        setIsLoading(true);

        try {
            // Apex Intelligence: Local Data-Driven Response Engine
            const response = await processQueryLocally(userQuery);
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', text: "Data link interrupted. Please retry, bro." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const processQueryLocally = async (q: string): Promise<string | React.ReactNode> => {
        if (!supabase) return "Intelligence system offline.";

        const lowQuery = q.toLowerCase();

        // 1. TOP CUSTOMERS (Real Data)
        if (lowQuery.includes('best customer') || lowQuery.includes('top customer')) {
            const { data } = await supabase.from('orders').select('customer_name, total_price').eq('status', 'Delivered');
            if (data && data.length > 0) {
                const spendingMap = new Map<string, number>();
                data.forEach(o => spendingMap.set(o.customer_name, (spendingMap.get(o.customer_name) || 0) + o.total_price));
                const top = Array.from(spendingMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 3);
                return (
                    <div className="space-y-2">
                        <p className="font-bold text-xs uppercase text-primary">Elite Tier Shoppers Identified:</p>
                        {top.map(([name, val], i) => (
                            <div key={name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="font-black text-[10px] text-foreground">{i+1}. {name}</span>
                                <span className="font-black text-[10px] text-primary">{formatPrice(val)}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            return "No delivered missions found in history to calculate top shoppers, bro.";
        }

        // 2. PROFIT / REVENUE (Real Data)
        if (lowQuery.includes('profit') || lowQuery.includes('revenue') || lowQuery.includes('how much')) {
            const { data } = await supabase.from('orders').select('total_price').eq('status', 'Delivered');
            const total = data?.reduce((s, o) => s + (o.total_price || 0), 0) || 0;

            // Calculate Profit Node (assuming 15% avg margin if ledger is empty)
            const { data: ledger } = await supabase.from('financial_ledger').select('amount');
            const netProfit = ledger?.reduce((s, l) => s + l.amount, 0) || (total * 0.15);

            return (
                <div className="space-y-4">
                    <p className="text-xs font-medium italic">&quot;Establishing financial uplink... Data confirmed.&quot;</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[8px] font-black text-emerald-600 uppercase">Revenue</p>
                            <p className="text-sm font-black text-foreground">{formatPrice(total)}</p>
                        </div>
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-[8px] font-black text-primary uppercase">Net Profit</p>
                            <p className="text-sm font-black text-foreground">{formatPrice(netProfit)}</p>
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Total Contribution Margin: {((netProfit/total) * 100).toFixed(1)}%</p>
                </div>
            );
        }

        // 3. LOW STOCK (Real Data)
        if (lowQuery.includes('stock') || lowQuery.includes('inventory') || lowQuery.includes('restock')) {
            const { data: critical } = await supabase.from('products').select('name, stock').lte('stock', 5).order('stock', { ascending: true });

            if (critical && critical.length > 0) {
                return (
                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-rose-500 flex items-center gap-2">
                            <Package size={14} /> Critical Depletion:
                        </p>
                        <div className="space-y-2">
                            {critical.slice(0, 3).map(p => (
                                <div key={p.name} className="flex justify-between items-center bg-rose-50 p-2 rounded-lg border border-rose-100">
                                    <span className="text-[10px] font-bold text-foreground truncate max-w-[120px]">{p.name}</span>
                                    <span className="text-[10px] font-black text-rose-600">{p.stock} Left</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] font-medium italic text-slate-400">Initialize procurement for {critical.length} assets now, bro.</p>
                    </div>
                );
            }
            return "Inventory levels are stabilized across all nodes. No critical stock-outs detected, bro. 📦";
        }

        // 4. ORDERS / MISSIONS (Real Data)
        if (lowQuery.includes('orders') || lowQuery.includes('sales') || lowQuery.includes('mission')) {
            const { data: recent } = await supabase.from('orders').select('id, status').order('created_at', { ascending: false }).limit(5);
            const { count: pending } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['Created', 'Payment Pending', 'Paid']);

            return (
                <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-indigo-600">Pipeline Pulse:</p>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                        <p className="text-2xl font-black text-indigo-700">{pending || 0}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1">Active Missions In Queue</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-slate-400 ml-1">Latest Transmissions</p>
                        {recent?.map(o => (
                            <div key={o.id} className="flex justify-between text-[10px] bg-white p-2 rounded-lg border border-slate-100">
                                <span className="font-bold">Order #{o.id}</span>
                                <span className="font-black text-primary uppercase">{o.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // DEFAULT
        return (
            <div className="space-y-3">
                <p className="text-sm font-medium italic leading-relaxed">
                    &quot;I am synced to the live database, bro. I can analyze your **revenue**, identify **low stock**, or brief you on **top customers**. What mission shall we run?&quot;
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500">Revenue Analysis</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500">Stock Velocity</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500">Rider Health</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-10 right-10 z-[200]">
            {!isOpen ? (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all p-0 flex items-center justify-center animate-bounce"
                >
                    <Sparkles className="h-8 w-8" />
                </Button>
            ) : (
                <Card className="w-[400px] h-[600px] rounded-[3rem] bg-white border border-slate-100 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                    {/* Header */}
                    <div className="p-8 bg-primary text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black uppercase tracking-tighter">Ask Apex</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Operations Intelligence</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors relative z-10"
                        >
                            <X size={24} />
                        </button>
                        <Sparkles className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12 z-0" />
                    </div>

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-inner">
                                    <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Mission Briefing</h4>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic px-10">
                                        &quot;I am your operational co-pilot. Ask me anything about your revenue, customers, or logistics status.&quot;
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full px-4">
                                    {[
                                        { label: 'Top Customers', icon: Users },
                                        { label: 'Total Revenue', icon: DollarSign },
                                        { label: 'Low Stock', icon: Package },
                                        { label: 'Profit Analysis', icon: TrendingUp },
                                    ].map(suggest => (
                                        <button
                                            key={suggest.label}
                                            onClick={() => setQuery(suggest.label)}
                                            className="p-4 rounded-2xl bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-500 hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <suggest.icon size={12} />
                                            {suggest.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((m, idx) => (
                                <div key={idx} className={cn(
                                    "flex",
                                    m.role === 'user' ? "justify-end" : "justify-start"
                                )}>
                                    <div className={cn(
                                        "max-w-[85%] p-5 rounded-[1.8rem] text-sm shadow-sm transition-all",
                                        m.role === 'user'
                                            ? "bg-primary text-white rounded-br-sm"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-bl-sm font-medium leading-relaxed italic"
                                    )}>
                                        {m.text}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-5 rounded-[1.8rem] rounded-bl-sm border border-slate-100 shadow-sm">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleAsk} className="p-6 bg-white border-t border-slate-50">
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Type mission query..."}
                                    className={cn(
                                        "h-16 rounded-2xl bg-slate-50 border-slate-100 pr-16 font-bold text-sm text-foreground focus:ring-4 focus:ring-primary/5 transition-all",
                                        isListening && "animate-pulse border-primary/50 ring-4 ring-primary/5"
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={!query.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-primary text-white p-0 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                            <Button
                                type="button"
                                onClick={startVoiceCommand}
                                className={cn(
                                    "h-16 w-16 rounded-2xl transition-all shadow-xl flex items-center justify-center p-0",
                                    isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-50 text-slate-400 hover:text-primary border border-slate-100"
                                )}
                            >
                                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
}
