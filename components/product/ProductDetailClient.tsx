'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, ShoppingCart, Share2, ArrowLeft, Zap, ChevronLeft, ChevronRight, Layers, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, cn, getReferralLink } from '@/lib/utils';
import ReviewSection from '@/components/product/ReviewSection';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import BundleUpsell from './BundleUpsell';
import RestockNotifyButton from './RestockNotifyButton';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/lib/useSettings';
import UrgencyPopup from './UrgencyPopup';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  sizes?: string[];
  description?: string;
  image_url?: string;
  video_url?: string; // New field
  images?: string[];
  category?: string;
  stock?: number;
  variant_stock?: Record<string, number>;
  tech_specs?: Record<string, string>;
  bundle_product_id?: number;
  bundle_discount_percent?: number;
}

export default function ProductDetailClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>(
    (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) ? product.sizes[0] : 'Standard'
  );
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [justAdded, setJustAdded] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const { settings } = useSettings();

  // 1. Browsing History & Referral Fetch Logic
  React.useEffect(() => {
    async function initData() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Fetch Referral Code for sharing
                const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', session.user.id).single();
                if (profile) setReferralCode(profile.referral_code);

                // Log to Database for members
                await supabase.from('browsing_history').insert([{
                    user_id: session.user.id,
                    product_id: product.id
                }]);
            } else {
                // Log to LocalStorage for guests
                if (typeof window !== 'undefined') {
                    let history = [];
                    try {
                        history = JSON.parse(localStorage.getItem('apex_history') || '[]');
                    } catch {
                        history = [];
                    }
                    if (!Array.isArray(history)) history = [];
                    const newHistory = [product.id, ...history.filter((id: number) => id !== product.id)].slice(0, 5);
                    localStorage.setItem('apex_history', JSON.stringify(newHistory));
                }
            }
        } catch (err) {
            console.warn("History log failed:", err);
        }
    }
    initData();
  }, [product.id]);

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images.filter(img => typeof img === 'string' && img.length > 0)
    : [product.image_url || '/placeholder.jpg'];

  if (allImages.length === 0) allImages.push('/placeholder.jpg');

  const hasVideo = Boolean(product.video_url);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '/placeholder.jpg',
      quantity: quantity,
      size: selectedVariant,
    });

    setTimeout(() => {
        setIsAdding(false);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
    }, 500);
  };

  const handleWhatsAppOrder = () => {
    const message = `Hello Apexstores! I want to order:\n\n*Product:* ${product.name}\n*Variant:* ${selectedVariant}\n*Quantity:* ${quantity}\n*Price:* ${formatPrice(product.price * quantity)}\n\nIs this available?`;
    window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const handleShare = async (platform: string) => {
    const url = referralCode ? getReferralLink(referralCode, `/shop/${product.id}`) : (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = `Check out ${product.name} from Apexstores - ${formatPrice(product.price)} ${url}`;

    // Log Share Mission
    const { data: { session } } = await supabase!.auth.getSession();
    if (session) {
        fetch('/api/member/gamification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                userId: session.user.id,
                action: 'update-mission-progress',
                payload: { missionType: 'share-product', increment: 1 }
            }),
        });
    }

    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Product link copied!');
    }
  };

  return (
    <div className="bg-white min-h-screen text-foreground font-sans antialiased text-left">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-24">

          {/* Gallery */}
          <div className="space-y-6 sticky top-8">
            <div className="bg-slate-50 rounded-[3rem] p-10 flex items-center justify-center aspect-square border border-slate-100 overflow-hidden relative group">
                {hasVideo && activeImageIndex === 0 ? (
                    <video
                        src={product.video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onPlay={async () => {
                            const { data: { session } } = await supabase!.auth.getSession();
                            if (session) {
                                fetch('/api/member/gamification', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`
                                    },
                                    body: JSON.stringify({
                                        userId: session.user.id,
                                        action: 'update-mission-progress',
                                        payload: { missionType: 'watch-video', increment: 1 }
                                    }),
                                });
                            }
                        }}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <Image
                      src={(hasVideo ? allImages[activeImageIndex - 1] : allImages[activeImageIndex]) || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-contain p-10 transform hover:scale-110 transition-transform duration-700 ease-out"
                    />
                )}

                {(allImages.length + (hasVideo ? 1 : 0)) > 1 && (
                    <>
                        <button
                            onClick={() => setActiveImageIndex(i => (i === 0 ? (allImages.length + (hasVideo ? 1 : 0)) - 1 : i - 1))}
                            className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 backdrop-blur-sm shadow-xl flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => setActiveImageIndex(i => (i === (allImages.length + (hasVideo ? 1 : 0)) - 1 ? 0 : i + 1))}
                            className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 backdrop-blur-sm shadow-xl flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail Selector */}
            {(allImages.length + (hasVideo ? 1 : 0)) > 1 && (
                <div className="flex justify-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {hasVideo && (
                        <button
                            onClick={() => setActiveImageIndex(0)}
                            className={`h-20 w-20 rounded-2xl bg-white border-2 transition-all flex items-center justify-center shrink-0 overflow-hidden ${activeImageIndex === 0 ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-100 opacity-60'}`}
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video src={product.video_url} muted className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg"><Zap className="h-3 w-3 fill-current" /></div>
                                </div>
                            </div>
                        </button>
                    )}
                    {allImages.map((img, idx) => {
                        const actualIdx = hasVideo ? idx + 1 : idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(actualIdx)}
                                className={`h-20 w-20 rounded-2xl bg-slate-50 border-2 transition-all flex items-center justify-center p-2 shrink-0 relative ${activeImageIndex === actualIdx ? 'border-primary shadow-lg shadow-primary/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <Image src={img} alt="" fill className="object-contain p-2" />
                            </button>
                        );
                    })}
                </div>
            )}
          </div>

          <div className="flex flex-col justify-between h-full pt-4 text-left">
            <div>
              <div className="flex items-center gap-2 mb-6 text-left">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Elite Batch</span>
                {product.stock !== undefined && product.stock > 0 ? (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">In Stock</span>
                ) : (
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">Sold Out</span>
                )}
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground mb-6 leading-none uppercase text-left">
                {product.name}
              </h1>

              <div className="mb-8">
                  <UrgencyPopup stock={product.stock || 0} />
              </div>

              <div className="flex items-center space-x-2 mb-10 text-left">
                <div className="flex text-amber-500 font-bold tracking-tighter text-xl">
                  ★ ★ ★ ★ <span className="text-slate-200">★</span>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg ml-3">Verified Performance</span>
              </div>

              <div className="flex items-baseline gap-4 mb-10 text-left">
                <span className="text-5xl font-black text-foreground tracking-tighter">{formatPrice(product.price)}</span>
                {product.old_price && (
                  <span className="text-2xl text-slate-300 line-through font-bold">{formatPrice(product.old_price)}</span>
                )}
              </div>

              <div className="bg-slate-50 border-l-4 border-primary p-6 rounded-r-2xl mb-12 text-left">
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {product.description || "Premium gadget built for performance and durability. Tested for zero defects upon dispatch."}
                  </p>
              </div>

              {/* Technical Specifications */}
              {product.tech_specs && typeof product.tech_specs === 'object' && !Array.isArray(product.tech_specs) && Object.keys(product.tech_specs).length > 0 && (
                <div className="mb-12 text-left">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 ml-1 flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Technical Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(product.tech_specs).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">{key}</span>
                                <span className="text-xs font-black text-foreground">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* Variant Selector */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="mb-12 text-left">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 ml-1">
                    Select Configuration / Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((variant) => {
                      const vStock = product.variant_stock?.[variant] ?? 1; // Default to 1 if legacy
                      const isOutOfStock = vStock === 0;

                      return (
                        <button
                          key={variant}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedVariant(variant)}
                          className={cn(
                            "px-6 py-3 text-xs font-black uppercase tracking-widest rounded-2xl border-2 transition-all duration-300 relative",
                            selectedVariant === variant
                              ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-105'
                              : isOutOfStock
                                ? 'border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed grayscale'
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                          )}
                        >
                          {variant}
                          {isOutOfStock && (
                              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">Sold Out</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-12 flex items-center space-x-8 text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Quantity</span>
                <div className="flex items-center border-2 border-slate-100 rounded-[1.5rem] overflow-hidden bg-white shadow-inner">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-12 w-12 hover:bg-slate-50 font-black text-slate-400 border-r-2 border-slate-50 transition-colors">-</button>
                  <span className="px-10 font-black text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="h-12 w-12 hover:bg-slate-50 font-black text-slate-400 border-l-2 border-slate-50 transition-colors">+</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
                  {product.stock !== undefined && product.stock > 0 ? (
                      <>
                        <Button
                          onClick={handleAddToCart}
                          disabled={isAdding}
                          className={cn(
                            "h-20 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95",
                            justAdded ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                          )}
                        >
                            {isAdding ? 'Syncing...' : justAdded ? <><Check className="h-5 w-5 mr-3" /> Added!</> : <><ShoppingCart className="h-5 w-5 mr-3" /> Add to Bag</>}
                        </Button>
                        <Button onClick={handleWhatsAppOrder} className="h-20 rounded-[1.5rem] bg-primary/5 text-primary border-2 border-primary/10 font-black uppercase tracking-widest text-xs hover:bg-primary/10 shadow-sm active:scale-95 transition-all">
                            <MessageSquare className="h-5 w-5 mr-3" /> Quick WhatsApp
                        </Button>
                        <Button onClick={handleBuyNow} className="h-20 rounded-[1.5rem] bg-white text-foreground border-2 border-slate-100 font-black uppercase tracking-widest text-xs hover:bg-slate-50 shadow-sm sm:col-span-2 active:scale-95 transition-all">
                            Instant Checkout
                        </Button>
                      </>
              ) : (
                  <div className="col-span-full bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                      <RestockNotifyButton productId={product.id} productName={product.name} />
                  </div>
              )}
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-8 px-4 text-left">
                <button
                    onClick={() => {
                        if (isInWishlist(product.id)) {
                            removeFromWishlist(product.id);
                        } else {
                            addToWishlist({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image_url || '/placeholder.jpg'
                            });
                        }
                    }}
                    className={cn(
                        "text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-3",
                        isInWishlist(product.id) ? "text-rose-500" : "text-slate-400 hover:text-foreground"
                    )}
                >
                    {isInWishlist(product.id) ? '❤️ Saved' : '🤍 Wishlist'}
                </button>
                <button onClick={() => handleShare('copy')} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-foreground flex items-center gap-3 transition-colors">
                    <Share2 className="h-4 w-4" /> Share Tech
                </button>
            </div>
          </div>
        </div>

        <ReviewSection productId={product.id} />

        {/* AI-FRIENDLY Q&A SECTION */}
        <section className="border-t border-slate-100 pt-24 mb-24 text-left">
            <div className="flex items-center gap-3 mb-16">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><MessageSquare className="h-5 w-5" /></div>
                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Tech Questions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                {[
                    { q: "Is this unit 100% authentic?", a: "Affirmative. Every gadget in the Apex sector is verified for authenticity before dispatch. Serial numbers are valid and recognizable by manufacturer servers." },
                    { q: "What is the dispatch timeline for Nairobi?", a: "Most extractions within Nairobi CBD and outskirts are completed within 4-6 hours. Same-day delivery is our tactical standard." }
                ].map((faq, i) => (
                    <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:border-primary/20 transition-all">
                        <h3 className="font-black text-primary text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap className="h-3 w-3 fill-current" /> {faq.q}
                        </h3>
                        <p className="text-slate-600 font-medium leading-relaxed italic text-sm">&quot;{faq.a}&quot;</p>
                    </div>
                ))}
            </div>
            <div className="mt-12 text-center">
                <Link href="/blog/category/knowledge-base" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors underline underline-offset-4">Explore Full Knowledge Base &rarr;</Link>
            </div>
        </section>

        {product.bundle_product_id && (
            <BundleUpsell
                mainProduct={product as unknown as { id: number; name: string; price: number; image_url: string }}
                bundleProductId={product.bundle_product_id}
                discountPercent={product.bundle_discount_percent || 5}
            />
        )}

        {relatedProducts.length > 0 && (
          <section className="border-t border-slate-100 pt-24 mb-32 text-left">
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-16">You Might Also Need</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/shop/${item.id}`} className="group block text-left">
                  <div className="bg-slate-50 rounded-[2.5rem] aspect-square flex items-center justify-center p-8 mb-6 border border-transparent group-hover:border-slate-100 transition-all relative overflow-hidden shadow-sm hover:shadow-2xl">
                    <Image src={item.image_url || '/placeholder.jpg'} alt={item.name} fill className="object-contain p-8 transform group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest truncate group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-sm font-black text-slate-400 mt-2">{formatPrice(item.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
