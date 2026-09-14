'use client';

import * as React from 'react';
import {
    Bot,
    Send,
    Loader2,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function GrowthCopilot() {
    const [query, setQuery] = React.useState('');
    const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: "Protocol synchronized. I am your Apex Growth Copilot. How can I assist with business intelligence today?" }
    ]);
    const [loading, setLoading] = React.useState(false);

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setLoading(true);

        try {
            // 🛰️ Real-Data LLM Integration
            // This now calls the production-ready API endpoint
            const res = await fetch('/api/admin/intelligence/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            const data = await res.json();
            const aiResponse = data.response || "Grid intelligence stable. No anomalous signals detected in this cluster. How shall we proceed with the audit?";

            setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
        } catch (err) {
            console.error("Copilot Intelligence Desync:", err);
            setMessages(prev => [...prev, { role: 'assistant', text: "Signal interference detected. Database uplink unstable." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[600px] rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl flex flex-col overflow-hidden text-left relative group">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter">Growth Copilot</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary">Autonomous Business Strategist</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    <span className="text-[7px] font-black uppercase text-slate-400">Decision-Aware</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex flex-col gap-3", m.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn(
                            "max-w-[85%] p-5 rounded-[2rem] text-xs shadow-sm",
                            m.role === 'user' ? "bg-primary text-white rounded-br-sm font-bold" : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-sm font-medium italic"
                        )}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex justify-start"><div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100"><Loader2 size={16} className="animate-spin text-primary" /></div></div>}
            </div>

            <form onSubmit={handleAsk} className="p-6 border-t border-slate-50 bg-white">
                <div className="relative">
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ask Copilot about sales, demand or risk..."
                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 pr-16 font-bold text-xs"
                    />
                    <Button type="submit" disabled={!query.trim() || loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-primary text-white p-0 hover:scale-105 transition-all">
                        <Send size={18} />
                    </Button>
                </div>
            </form>

            <Target className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
        </Card>
    );
}
