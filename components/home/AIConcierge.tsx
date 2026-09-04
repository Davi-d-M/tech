'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Bot,
    Send,
    X,
    Sparkles,
    Loader2,
    ShoppingBag,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/lib/useSettings';
import Image from 'next/image';
import Link from 'next/link';

interface Suggestion {
    id: number;
    name: string;
    price: number;
    image_url: string;
}

export default function AIConcierge() {
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant', text: string, suggestions?: Suggestion[] }[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const { addBundleToCart } = useCart();

    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // Disable logic based on Admin settings
    if ((settings as unknown as { features: { ai_concierge_enabled: boolean } })?.features?.ai_concierge_enabled === false) return null;

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMsg = query.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/support/ai-concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });

            const data = await res.json();
            let aiText = data.response || "System connection unstable. Re-initiating connection...";

            // Intelligence Node: Detect Product IDs in response [PROD-123]
            const productMatches = aiText.match(/\[PROD-(\d+)\]/g);
            let suggestedProducts: Suggestion[] = [];

            if (productMatches && supabase) {
                const ids = productMatches.map((m: string) => m.match(/\d+/)![0]);
                const { data: prods } = await supabase
                    .from('products')
                    .select('id, name, price, image_url')
                    .in('id', ids);

                if (prods) {
                    suggestedProducts = prods.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image_url: p.image_url
                    }));
                }

                // Clean up the text - remove the technical IDs for a cleaner UI
                aiText = aiText.replace(/\[PROD-\d+\]/g, '').trim();
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: aiText,
                suggestions: suggestedProducts.length > 0 ? suggestedProducts : undefined
            }]);
        } catch (err) {
            console.error("AI Link Failure:", err);
            setMessages(prev => [...prev, { role: 'assistant', text: "Signal interference detected. Please try again in 30 seconds." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAll = (items: Suggestion[]) => {
        const cartItems = items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            base_price: i.price,
            image: i.image_url,
            quantity: 1
        }));
        addBundleToCart(cartItems);
        setMessages(prev => [...prev, { role: 'assistant', text: "Items added to your bag. Ready for checkout! 🚀" }]);
    };

    return (
        <div className="fixed bottom-10 left-10 z-[200]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group border-4 border-white"
                >
                    <Bot className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </button>
            ) : (
                <Card className="w-[400px] h-[650px] rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 text-left">
                    <div className="p-8 bg-primary text-white relative overflow-hidden flex justify-between items-center shadow-lg">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20"><Bot size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">AI Concierge</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Elite Shopping Agent</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors relative z-10"><X size={24} /></button>
                        <Sparkles className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12" />
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 py-10">
                                <div className="h-24 w-24 rounded-[3rem] bg-white flex items-center justify-center shadow-inner animate-pulse"><Sparkles className="h-10 w-10 text-primary" /></div>
                                <div className="space-y-4 px-10">
                                    <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground">Assistant Brief</h4>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                        &quot;I am your personal shopping assistant. Tell me what setup you need or your budget, and I will bundle it for you.&quot;
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full px-4">
                                    {['Gaming Setup', 'Home Office', 'Under 5k', 'Best Sellers'].map(opt => (
                                        <button key={opt} onClick={() => setQuery(opt)} className="p-4 rounded-2xl bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-500 hover:border-primary hover:text-primary transition-all shadow-sm">
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((m, idx) => (
                                <div key={idx} className={cn("flex flex-col gap-4", m.role === 'user' ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm",
                                        m.role === 'user' ? "bg-primary text-white rounded-br-sm" : "bg-white text-slate-700 border border-slate-100 rounded-bl-sm font-medium italic"
                                    )}>
                                        {m.text}
                                    </div>
                                    {m.suggestions && m.suggestions.length > 0 && (
                                        <div className="w-full space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                            {m.suggestions.map(s => (
                                                <div key={s.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex items-center gap-4 shadow-sm group hover:border-primary/20 transition-all">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 p-2 border border-slate-100 shrink-0">
                                                        <Image src={s.image_url} alt="" width={56} height={56} className="h-full w-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black uppercase truncate text-foreground">{s.name}</p>
                                                        <p className="text-sm font-black text-primary">{formatPrice(s.price)}</p>
                                                    </div>
                                                    <Link href={`/shop/${s.id}`}><ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary" /></Link>
                                                </div>
                                            ))}
                                            <Button onClick={() => handleAddAll(m.suggestions!)} className="w-full h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black uppercase text-[10px] tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                <ShoppingBag size={14} className="mr-2" /> Add Bundle to Bag
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {isLoading && <div className="flex justify-start"><div className="bg-white p-5 rounded-[2rem] rounded-bl-sm border border-slate-100 shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>}
                    </div>

                    <form onSubmit={handleAsk} className="p-6 bg-white border-t border-slate-50">
                        <div className="relative">
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Ask about a gadget..."
                                className="h-16 rounded-[1.5rem] bg-slate-50 border-slate-100 pr-16 font-bold text-sm text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
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
