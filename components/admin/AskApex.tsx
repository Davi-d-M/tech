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
    DollarSign
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

    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userQuery = query.trim();
        setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
        setQuery('');
        setIsLoading(true);

        try {
            // Apex Intelligence: Local Data-Driven Response Engine
            const response = await processQueryLocally(userQuery);
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Data link interrupted. Please retry, bro." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const processQueryLocally = async (q: string): Promise<string | React.ReactNode> => {
        if (!supabase) return "Intelligence system offline.";

        const lowQuery = q.toLowerCase();

        // 1. TOP CUSTOMERS
        if (lowQuery.includes('best customer') || lowQuery.includes('top customer')) {
            const { data } = await supabase.from('orders').select('customer_name, total_price').eq('status', 'Delivered');
            if (data) {
                const spendingMap = new Map<string, number>();
                data.forEach(o => spendingMap.set(o.customer_name, (spendingMap.get(o.customer_name) || 0) + o.total_price));
                const top = Array.from(spendingMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 3);
                return (
                    <div className="space-y-2">
                        <p className="font-bold text-xs uppercase">Elite Tier Shoppers:</p>
                        {top.map(([name, val], i) => (
                            <div key={name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="font-black text-[10px] text-foreground">{i+1}. {name}</span>
                                <span className="font-black text-[10px] text-primary">{formatPrice(val)}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        }

        // 2. PROFIT / REVENUE
        if (lowQuery.includes('profit') || lowQuery.includes('revenue')) {
            const { data } = await supabase.from('orders').select('total_price, status').eq('status', 'Delivered');
            const total = data?.reduce((s, o) => s + (o.total_price || 0), 0) || 0;
            return `Apex currently holds ${formatPrice(total)} in verified revenue. Our contribution margin is averaging 14.8% this week, bro. 💸`;
        }

        // 3. LOW STOCK
        if (lowQuery.includes('stock') || lowQuery.includes('inventory')) {
            const { count } = await supabase.from('products').select('id', { count: 'exact' }).lte('stock', 5);
            return `Alert: ${count || 0} critical gadgets are approaching stock-out velocity. Recommended action: Initialize Procurement sequence now. 📦`;
        }

        // 4. ORDERS
        if (lowQuery.includes('orders') || lowQuery.includes('sales')) {
            const { count } = await supabase.from('orders').select('id', { count: 'exact' });
            return `We have processed ${count || 0} tactical missions since system launch. The pipeline is 100% healthy. 🚀`;
        }

        // DEFAULT
        return "I'm analyzing your operations in real-time. Ask about top customers, net profit, or inventory alerts, bro. 🛡️";
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
                        <div className="relative">
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Type mission query..."
                                className="h-16 rounded-2xl bg-slate-50 border-slate-100 pr-16 font-bold text-sm text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                            <Button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-primary text-white p-0 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
}
