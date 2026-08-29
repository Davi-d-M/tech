'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Sale {
    name: string;
    item: string;
    time: string;
}

export default function SalesPopup() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [currentSale, setCurrentSale] = useState<Sale | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        async function fetchRealSales() {
            if (!supabase) return;
            try {
                // Fetch the latest 15 successful orders for rotation
                const { data } = await supabase
                    .from('orders')
                    .select('id, customer_name, note, created_at, product_id')
                    .or('status.eq.Paid,status.eq.Delivered,status.eq.Dispatched')
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (data && data.length > 0) {
                    processSalesData(data);
                }
            } catch (err) {
                console.error("Sales popup fetch error:", err);
            }
        }

        async function processSalesData(data: { product_id: number; customer_name: string; note: string; created_at: string }[]) {
            const prodIds = data.map(o => o.product_id);
            if (!supabase) return;
            const { data: prods } = await supabase.from('products').select('id, name').in('id', prodIds);

            const enriched: Sale[] = data.map(order => {
                const product = prods?.find((p: { id: number; name: string }) => p.id === order.product_id);
                const firstName = (order?.customer_name || 'Someone').split(' ')[0];
                const regionMatch = order.note?.match(/Region: ([^|]+)/);
                const location = regionMatch ? regionMatch[1].trim() : "Kenya";

                return {
                    name: `${firstName} from ${location}`,
                    item: product?.name || "Premium Tech",
                    time: getTimeAgo(order.created_at)
                };
            });
            setSales(enriched);
        }

        fetchRealSales();

        // Real-time Pulse Listener
        const channel = supabase
            ?.channel('realtime-sales-pulse')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                async (payload: { new: { product_id: number; customer_name: string; note: string } }) => {
                    if (!supabase) return;
                    // Enrich new order data
                    const { data: prod } = await supabase
                        .from('products')
                        .select('name')
                        .eq('id', payload.new.product_id)
                        .limit(1)
                        .maybeSingle();

                    const firstName = (payload?.new?.customer_name || 'Someone').split(' ')[0];
                    const regionMatch = payload.new.note?.match(/Region: ([^|]+)/);
                    const location = regionMatch ? regionMatch[1].trim() : "Kenya";

                    const newSale: Sale = {
                        name: `${firstName} from ${location}`,
                        item: prod?.name || "Premium Tech",
                        time: "Just now 🔥"
                    };

                    setCurrentSale(newSale);
                    setIsVisible(true);
                    setTimeout(() => setIsVisible(false), 7000);
                }
            )
            .subscribe();

        return () => {
            if (supabase && channel) supabase.removeChannel(channel);
        };
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    useEffect(() => {
        if (sales.length === 0) return;

        const showNextSale = () => {
            const randomSale = sales[Math.floor(Math.random() * sales.length)];
            setCurrentSale(randomSale);
            setIsVisible(true);

            setTimeout(() => {
                setIsVisible(false);
            }, 6000);
        };

        const initialDelay = setTimeout(showNextSale, 8000);
        const interval = setInterval(showNextSale, 45000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [sales]);

    if (!currentSale) return null;

    return (
        <div className={`fixed bottom-6 left-6 z-[100] max-w-[280px] w-full transition-all duration-700 ease-out ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}>
            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4 relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-[6000ms] ease-linear ${isVisible ? 'w-full' : 'w-0'}`}></div>

                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary shrink-0 border border-slate-100 shadow-inner">
                    <ShoppingBag className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none mb-1">Live Feed</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        <span className="font-bold text-slate-700">{currentSale.name}</span> bought <span className="text-primary font-black uppercase italic">{currentSale.item}</span>
                    </p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1.5">{currentSale.time}</p>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-slate-200 hover:text-slate-400 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
