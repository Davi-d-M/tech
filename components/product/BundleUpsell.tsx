'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
}

interface BundleUpsellProps {
  mainProduct: Product;
  bundleProductId: number;
  discountPercent: number;
}

export default function BundleUpsell({ mainProduct, bundleProductId, discountPercent }: BundleUpsellProps) {
    const [bundleProduct, setBundleProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const { addBundleToCart } = useCart();

    useEffect(() => {
        async function fetchBundleProduct() {
            if (!supabase || !bundleProductId) return;
            const { data } = await supabase
                .from('products')
                .select('id, name, price, image_url')
                .eq('id', bundleProductId)
                .single();
            if (data) setBundleProduct(data as Product);
            setLoading(false);
        }
        fetchBundleProduct();
    }, [bundleProductId]);

    if (loading || !bundleProduct) return null;

    const mainPrice = mainProduct.price;
    const bundlePrice = bundleProduct.price;
    const totalOriginal = mainPrice + bundlePrice;
    const discountAmount = (totalOriginal * discountPercent) / 100;
    const finalPrice = totalOriginal - discountAmount;

    const handleAddBundle = () => {
        setAdded(true);
        addBundleToCart([
            { ...mainProduct, image: mainProduct.image_url, quantity: 1 },
            { ...bundleProduct, image: bundleProduct.image_url, quantity: 1, price: bundleProduct.price * (1 - discountPercent/100) }
        ]);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="mt-12 bg-slate-50 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 relative overflow-hidden text-left">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                <div className="space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                        <Plus className="h-3 w-3" /> Perfect Match
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                        Buy Together &amp; <span className="text-primary italic">Save {discountPercent}%</span>
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Complete your setup. Add <span className="text-slate-900 font-black uppercase tracking-tight">{bundleProduct.name}</span> to your order and get an instant elite discount.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-2xl bg-white border border-slate-100 p-4 flex items-center justify-center shadow-sm relative">
                            <Image src={mainProduct.image_url} alt={mainProduct.name} fill className="object-contain p-2" />
                        </div>
                        <Plus className="h-6 w-6 text-slate-300" />
                        <div className="h-24 w-24 rounded-2xl bg-white border border-slate-100 p-4 flex items-center justify-center shadow-sm relative">
                            <Image src={bundleProduct.image_url} alt={bundleProduct.name} fill className="object-contain p-2" />
                        </div>
                    </div>

                    <div className="text-center sm:text-right space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 line-through tracking-widest">Regular Price: {formatPrice(totalOriginal)}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">Bundle Price: {formatPrice(finalPrice)}</p>
                        </div>
                        <Button
                            onClick={handleAddBundle}
                            disabled={added}
                            className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all ${added ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
                        >
                            {added ? <><Check className="h-4 w-4 mr-2" /> Bundle Added</> : <><Zap className="h-4 w-4 mr-2" /> Add Both to Bag</>}
                        </Button>
                    </div>
                </div>
            </div>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0"></div>
        </div>
    );
}
