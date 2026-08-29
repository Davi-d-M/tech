'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Truck, Users, Package, ArrowRight, X, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CommandPaletteProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

interface SearchResult {
    id: string | number;
    title: string;
    subtitle: string;
    type: 'order' | 'product' | 'customer' | 'rider';
    url: string;
    image?: string;
    meta?: string;
}

export default function GlobalCommandPalette({ isOpen, setIsOpen }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (!supabase) return;
            setLoading(true);
            try {
                // Multi-Table Tactical Scan
                const [orders, products, riders] = await Promise.all([
                    supabase.from('orders').select('id, customer_name, total_price').ilike('customer_name', `%${query}%`).limit(3),
                    supabase.from('products').select('id, name, price, image_url').ilike('name', `%${query}%`).limit(3),
                    supabase.from('rider_status').select('rider_name, rider_phone').ilike('rider_name', `%${query}%`).limit(2)
                ]);

                const formatted: SearchResult[] = [];

                products.data?.forEach(p => formatted.push({
                    id: p.id,
                    title: p.name,
                    subtitle: 'Product Inventory',
                    type: 'product',
                    url: `/admin/upload?edit=${p.id}`,
                    image: p.image_url,
                    meta: formatPrice(p.price)
                }));

                orders.data?.forEach(o => formatted.push({
                    id: o.id,
                    title: `Order #${o.id}`,
                    subtitle: o.customer_name,
                    type: 'order',
                    url: '/admin/orders',
                    meta: formatPrice(o.total_price)
                }));

                riders.data?.forEach((r: { rider_name: string; rider_phone: string }) => formatted.push({
                    id: r.rider_phone,
                    title: r.rider_name,
                    subtitle: 'Delivery Fleet',
                    type: 'rider',
                    url: '/admin/dispatch',
                    meta: r.rider_phone
                }));

                setResults(formatted);
                setActiveIndex(0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        router.push(result.url);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[activeIndex]) {
            handleSelect(results[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-background/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="max-w-2xl w-full bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden animate-in slide-in-from-top-4 duration-500">

                <div className="p-6 border-b border-border flex items-center gap-4">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search Orders, Products, Riders..."
                        className="flex-1 bg-transparent border-none outline-none text-sm font-black uppercase tracking-widest text-foreground placeholder:text-muted"
                    />
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4 no-scrollbar">
                    {results.length === 0 ? (
                        <div className="py-12 text-center space-y-4">
                            <Zap className="h-10 w-10 text-secondary mx-auto" />
                            <p className="text-[10px] font-black uppercase text-muted tracking-[0.3em]">
                                {query.length < 2 ? "Awaiting Tactical Query..." : "No matches found in grid."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((result, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    className={cn(
                                        "w-full flex items-center gap-6 p-4 rounded-[1.8rem] transition-all text-left group",
                                        activeIndex === idx ? "bg-primary text-background shadow-xl shadow-primary/20 scale-[1.02]" : "hover:bg-secondary"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                        activeIndex === idx ? "bg-background/20 border-background/20" : "bg-background border-border"
                                    )}>
                                        {result.type === 'order' ? <ShoppingBag className="h-5 w-5" /> :
                                         result.type === 'rider' ? <Truck className="h-5 w-5" /> :
                                         result.type === 'product' ? (
                                             result.image ? <div className="h-8 w-8 relative"><Image src={result.image} fill className="object-contain" alt={result.title || ""} /></div> : <Package className="h-5 w-5" />
                                         ) : <Users className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-tight truncate text-foreground group-hover:text-foreground">{result.title}</p>
                                        <p className={cn(
                                            "text-[8px] font-black uppercase tracking-widest mt-1",
                                            activeIndex === idx ? "text-background/60" : "text-muted-foreground"
                                        )}>{result.subtitle}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-black text-foreground group-hover:text-foreground">{result.meta}</p>
                                        <ArrowRight className={cn(
                                            "h-4 w-4 ml-auto mt-1 transition-transform group-hover:translate-x-1",
                                            activeIndex === idx ? "text-background" : "text-muted"
                                        )} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {results.length > 0 && (
                    <div className="p-4 bg-secondary border-t border-border flex justify-between items-center text-[8px] font-black uppercase text-muted-foreground tracking-widest px-8">
                        <span>↑↓ Navigate</span>
                        <span>Enter Select</span>
                        <span>Esc Close</span>
                    </div>
                )}
            </div>
        </div>
    );
}
