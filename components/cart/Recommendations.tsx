"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Loader2, Sparkles, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { useCart, CartItem } from '@/context/CartContext';

interface RecommendedProduct {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

export default function Recommendations() {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useCart();

  useEffect(() => {
    async function fetchRecommended() {
      if (!supabase) return;

      try {
        // Calculate average price of items in cart to find similar range
        const avgPrice = cart.length > 0
          ? cart.reduce((sum, item) => sum + item.price, 0) / cart.length
          : 5000; // Fallback to mid-range if empty

        const min = avgPrice * 0.7;
        const max = avgPrice * 1.3;

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .gte('price', min)
          .lte('price', max)
          .limit(4);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Recommendations failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommended();
  }, [cart]);

  if (loading) {
    return (
      <div className="mt-16 flex justify-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-20 space-y-10">
      <div className="flex items-center justify-between px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em]">
            <Sparkles size={14} /> Curated Selection
          </div>
          <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">You Might Also Like</h2>
        </div>
        <Link href="/shop" className="group flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors">
          View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={String(product.id)} className="group rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all overflow-hidden flex flex-col">
            <Link href={`/product/${product.id}`} className="block aspect-square bg-slate-50 relative overflow-hidden">
                <Image
                    src={product.image_url || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-primary shadow-sm">
                    <Zap size={14} className="fill-current" />
                </div>
            </Link>
            <CardContent className="p-6 flex-1 flex flex-col text-left">
              <div className="flex-1 space-y-1 mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{product.category}</p>
                <h3 className="text-sm font-black text-foreground uppercase truncate group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-lg font-black text-primary">{formatPrice(product.price)}</p>
              </div>
              <Button
                onClick={() => addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url,
                  quantity: 1
                } as CartItem)}
                className="w-full h-12 rounded-2xl bg-slate-50 text-foreground font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white border border-slate-100 group-hover:border-transparent transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={14} /> Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
