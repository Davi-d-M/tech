'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from './ProductCard';
import { History, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

export default function PersonalizedFeed() {
    const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFeed() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                let productIds: number[] = [];

                if (session) {
                    // Fetch from Database
                    const { data } = await supabase
                        .from('browsing_history')
                        .select('product_id')
                        .eq('user_id', session.user.id)
                        .order('viewed_at', { ascending: false })
                        .limit(4);

                    if (data) productIds = data.map(item => item.product_id);
                } else {
                    // Fetch from LocalStorage
                    if (typeof window !== 'undefined') {
                        productIds = JSON.parse(localStorage.getItem('apex_history') || '[]');
                    }
                }

                if (productIds.length > 0) {
                    const { data: products } = await supabase
                        .from('products')
                        .select('*')
                        .in('id', productIds);

                    if (products) {
                        // Maintain order from productIds
                        const orderedProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
                        setViewedProducts(orderedProducts);
                    }
                }
            } catch (err) {
                console.error("Feed Error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadFeed();
    }, []);

    if (loading || viewedProducts.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
                <div className="space-y-4">
                    <Badge className="bg-amber-50 text-amber-600 border-none font-black uppercase text-[9px] px-3 py-1 rounded-full">
                        <History className="h-3 w-3 mr-2" /> Recently Viewed
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                        Suggested <span className="text-primary italic">for You.</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Because you looked at these gadgets, we think you&apos;ll love our premium collection.
                    </p>
                </div>
                <Link href="/shop" className="text-[10px] font-black text-primary underline underline-offset-4 uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2">
                    Back to Catalog <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {viewedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
