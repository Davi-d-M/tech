'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from './ProductCard';
import { Zap, ArrowRight, History, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
  description?: string;
}

export default function PersonalizedFeed() {
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [recommendedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [predictiveCategory, setPredictiveCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFeed() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                let viewedIds: number[] = [];

                // 1. GET RECENTLY VIEWED (Continue Shopping)
                if (typeof window !== 'undefined') {
                    try {
                        const localHistoryStr = localStorage.getItem('apex_recent_views');
                        if (localHistoryStr) {
                            const localHistory = JSON.parse(localHistoryStr);
                            if (Array.isArray(localHistory)) {
                                viewedIds = localHistory.map((item: { id: number }) => item.id).filter(Boolean);
                            }
                        }
                    } catch (err) {
                        console.error("Error reading localStorage apex_recent_views:", err);
                    }
                }

                if (viewedIds.length > 0) {
                    const { data: recents } = await supabase
                        .from('products')
                        .select('*')
                        .in('id', viewedIds.slice(0, 4));
                    if (recents) setRecentProducts(recents as Product[]);
                }

                // 2. GET PREDICTIVE DATA (Because you liked)
                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('next_purchase_category')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile?.next_purchase_category) {
                        setPredictiveCategory(profile.next_purchase_category);
                        let query = supabase
                            .from('products')
                            .select('*')
                            .eq('category', profile.next_purchase_category);

                        if (viewedIds.length > 0) {
                            query = query.not('id', 'in', `(${viewedIds.join(',')})`);
                        }

                        const { data: categorySuggestions } = await query.limit(4);
                        if (categorySuggestions) setSuggestedProducts(categorySuggestions as Product[]);
                    }
                }

                // 3. FALLBACK RECOMMENDATIONS
                if (recommendedProducts.length === 0) {
                    let query = supabase
                        .from('products')
                        .select('*')
                        .order('price', { ascending: false }); // High end tech

                    if (viewedIds.length > 0) {
                        query = query.not('id', 'in', `(${viewedIds.join(',')})`);
                    }

                    const { data: fallbacks } = await query.limit(4);
                    if (fallbacks) setSuggestedProducts(fallbacks as Product[]);
                }

            } catch (err) {
                console.error("Personalization Engine Error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadFeed();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return null;

    return (
        <div className="space-y-32 py-24">

            {/* SECTION 1: CONTINUE SHOPPING */}
            {recentProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left animate-in fade-in slide-in-from-left-8 duration-1000">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                        <div className="space-y-4">
                            <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-black uppercase text-[9px] px-3 py-1 rounded-full">
                                <History className="h-3 w-3 mr-2 inline-flex mb-0.5" /> Recent Footprint
                            </Badge>
                            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                                Continue <span className="text-primary italic">Shopping.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg max-w-xl">
                                &quot;Your session is live. Resume your evaluation of these elite gadgets.&quot;
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {recentProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* SECTION 2: RECOMMENDATIONS */}
            {recommendedProducts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left animate-in fade-in slide-in-from-right-8 duration-1000">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                        <div className="space-y-4">
                            <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[9px] px-3 py-1 rounded-full">
                                <Sparkles className="h-3 w-3 mr-2 inline-flex mb-0.5 fill-current" />
                                {predictiveCategory ? `Target: ${predictiveCategory}` : 'Autonomous Logic'}
                            </Badge>
                            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                                Suggested <span className="text-primary italic">for You.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg max-w-xl">
                                &quot;{predictiveCategory
                                    ? `Because of your interest in ${predictiveCategory}, we've mapped these essential upgrades.`
                                    : 'Apex intelligence has curated these high-velocity tech recommendations.'}&quot;
                            </p>
                        </div>
                        <Link href="/shop" className="text-[10px] font-black text-primary underline underline-offset-4 uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2">
                            Explore Full Catalog <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {recommendedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* AI MISSION BRIDGE */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="bg-primary/5 rounded-[4rem] p-12 lg:p-20 border border-primary/10 relative overflow-hidden group">
                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 text-left">
                            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={28} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-[0.9]">Upgrade Your <br/> <span className="text-primary italic">Tech Legacy.</span></h3>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                                    &quot;Elite performance isn&apos;t an accident. It&apos;s a choice. Build your setup with Apex verified hardware.&quot;
                                </p>
                            </div>
                            <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                Launch Gear Configurator
                            </Button>
                        </div>
                        <div className="bg-white/60 backdrop-blur-xl border border-primary/10 rounded-[3rem] p-10 space-y-6 text-left shadow-2xl">
                             <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                <span className="text-[10px] font-black uppercase text-slate-400">Personalized Configuration</span>
                             </div>
                             <p className="text-sm font-bold text-foreground leading-relaxed">
                                Our autonomous engine continuously optimizes your experience to ensure every recommendation is a high-utility asset for your lifestyle.
                             </p>
                             <div className="pt-6 border-t border-primary/5 flex gap-4">
                                <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400">Optimization</p><p className="text-xl font-black text-primary">Active</p></div>
                                <div className="space-y-1"><p className="text-[8px] font-black uppercase text-slate-400">Status</p><p className="text-xl font-black text-foreground">Elite</p></div>
                             </div>
                        </div>
                    </div>
                    <Zap className="absolute -bottom-20 -left-20 h-96 w-96 text-primary/5 rotate-45" />
                </div>
            </section>
        </div>
    );
}

