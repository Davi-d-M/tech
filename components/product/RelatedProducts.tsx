'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { Product } from "@/types/product";
import Link from "next/link";
import { Plus, Check, Sparkles } from 'lucide-react';
import { useCart } from "@/context/CartContext";
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import Image from 'next/image';

interface RelatedProductsProps {
  product: Product;
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRelated() {
        if (!supabase) return;
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', product.id)
            .limit(4);
        setRelated(data || []);
    }
    fetchRelated();
  }, [product.id, product.category]);

  const handleQuickAdd = async (e: React.MouseEvent, p: Product) => {
      e.preventDefault();
      e.stopPropagation();
      setAddingId(p.id);

      addToCart({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image || p.image_url || '',
          quantity: 1,
          size: 'Standard'
      });

      setTimeout(() => setAddingId(null), 2000);
  };

  return (
    <div className="mt-20 pt-16 border-t border-slate-100">
      <div className="flex items-end justify-between mb-12">
        <div className="text-left">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Elite Curations</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Complete Your Setup</h2>
        </div>
        <Link href="/shop" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-2">
            View All Collections →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {related.map((p) => (
            <Card
              key={p.id}
              className="group relative overflow-hidden bg-white border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2.5rem] text-left border-none shadow-sm"
            >
              <Link href={`/shop/${p.id}`}>
                <div className="aspect-square overflow-hidden bg-slate-50 p-8 flex items-center justify-center relative">
                  <Image
                    src={p.image || p.image_url || '/placeholder.jpg'}
                    alt={p.name}
                    fill
                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        onClick={(e) => handleQuickAdd(e, p)}
                        disabled={addingId === p.id}
                        className={cn(
                            "rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all",
                            addingId === p.id ? "bg-emerald-500 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
                        )}
                      >
                          {addingId === p.id ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          {addingId === p.id ? 'Added' : 'Quick Add'}
                      </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-primary">
                        {formatPrice(p.price)}
                    </p>
                    <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{p.category}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
      </div>
    </div>
  );
}
