'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';
import { Wine, ChevronRight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function BarGoodsCollection() {
    const [items, setItems] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchBarGoods() {
            if (!supabase) return;
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('category', 'bar-goods')
                .limit(4);

            if (data) setItems(data);
            setLoading(false);
        }
        fetchBarGoods();
    }, []);

    if (loading || items.length === 0) return null;

    return (
        <section className="bg-slate-50 py-24 border-y border-slate-100 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
                    <div className="space-y-4">
                        <Badge className="bg-primary/5 text-primary border-none font-black uppercase text-[9px] px-3 py-1 rounded-full">
                            <Package className="h-3 w-3 mr-2 inline-flex mb-0.5" /> Essential Arsenal
                        </Badge>
                        <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                            Build Your <span className="text-primary italic">Bar.</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-lg max-w-xl">
                            &quot;Beyond the bottle. Upgrade your extraction ritual with premium glassware and elite bar accessories.&quot;
                        </p>
                    </div>
                    <Link href="/shop/category/bar-goods" className="text-[10px] font-black text-primary underline underline-offset-4 uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2">
                        View Arsenal <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
            <Wine className="absolute -bottom-10 -left-10 h-64 w-64 text-primary/5 -rotate-12" />
        </section>
    );
}
