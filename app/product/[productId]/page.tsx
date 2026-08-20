"use client";

import Features from "@/components/product/Features";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductNotFound from "@/components/product/ProductNotFound";
import RelatedProducts from "@/components/product/RelatedProducts";
import ReviewSection from "@/components/product/ReviewSection";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { supabase } from "@/lib/supabaseClient";
import { type User } from "@supabase/supabase-js";
import { cn, formatPrice } from "@/lib/utils";
import type { Product as ProductType } from "@/types/product";
import {
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  MessageSquare,
  Crown,
  BookOpen,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RestockRadar from "@/components/product/RestockRadar";
import { useSettings } from "@/lib/useSettings";

interface Tutorial {
    title: string;
    slug: string;
    excerpt: string;
}

export default function Product() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { productId } = useParams();
  const { settings } = useSettings();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [liveProduct, setLiveProduct] = useState<ProductType | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [isProductLive, setIsProductLive] = useState(false);
  const [reviewStats, setReviewStats] = useState({ count: 0, rating: 0 });

  useEffect(() => {
    async function loadData() {
        if (!supabase || !productId) {
            setIsLiveLoading(false);
            return;
        }

        try {
            // 1. Fetch main product from DB
            const { data: dbProd } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (dbProd) {
                setLiveProduct(dbProd);
                setIsProductLive(true);

                // Fetch real review stats
                const { data: revs } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('product_id', productId)
                    .eq('is_hidden', false);

                if (revs && revs.length > 0) {
                    setReviewStats({
                        count: revs.length,
                        rating: Number((revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1))
                    });
                }
            } else {
                setLiveProduct(null);
                setIsProductLive(false);
            }
        } catch (err) {
            console.warn("Live fetch error:", err);
            setLiveProduct(null);
            setIsProductLive(false);
        } finally {
            setIsLiveLoading(false);
        }
    }

    async function checkUser() {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
    }

    async function fetchRelatedTutorials() {
        if (!supabase) return;
        const { data } = await supabase
            .from('blog_posts')
            .select('title, slug, excerpt')
            .eq('is_published', true)
            .limit(2);

        setTutorials(data || []);
    }

    loadData();
    checkUser();
    fetchRelatedTutorials();
  }, [productId]);

  // Track Recent View (Effect separate for stability)
  useEffect(() => {
    if (liveProduct) {
        const saved = localStorage.getItem('apex_recent_views');
        let views = saved ? JSON.parse(saved) : [];
        views = views.filter((v: Record<string, unknown>) => v.id !== liveProduct.id);
        views.unshift({ id: liveProduct.id, name: liveProduct.name, image: liveProduct.image_url || liveProduct.image });
        localStorage.setItem('apex_recent_views', JSON.stringify(views.slice(0, 10)));
    }
  }, [liveProduct]);

  if (isLiveLoading) {
    return (
        <div className="container mx-auto px-4 py-32 flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Retrieving Tech Data...</p>
        </div>
    );
  }

  if (!liveProduct) {
    return <ProductNotFound />;
  }

  const product = liveProduct; // Alias for UI code below

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalPrice = user ? Math.floor(product.price * 0.95) : product.price;

    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      base_price: product.price,
      image: product.image || product.image_url || '',
      quantity: quantity,
    });

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push("/cart"), 500);
  };

  const handleWhatsAppOrder = () => {
    const message = `Hello Apexstores! I want to order:\n\n*Product:* ${product.name}\n*Quantity:* ${quantity}\n*Price:* ${formatPrice(product.price * quantity)}\n\nIs this available?`;
    window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const toggleWishlist = async () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.image_url || '',
        rating: product.rating,
      });

      // Update Mission
      if (user) {
          fetch('/api/member/gamification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: user.id,
                  action: 'update-mission-progress',
                  payload: { missionType: 'wishlist-items', increment: 1 }
              }),
          });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <ProductBreadcrumb />

      <div className="grid lg:grid-cols-2 gap-12 mb-16 text-left">
        <div className="space-y-4">
          <div className="w-full max-w-[500px] mx-auto flex flex-col items-center">
            <div className="rounded-3xl shadow-sm overflow-hidden mb-4 w-full bg-slate-50 border border-slate-100 p-8 flex items-center justify-center aspect-square text-left relative">
              <Image
                src={product.image_url || product.image || '/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-contain transform hover:scale-105 transition-transform duration-500 p-8"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 text-left">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase leading-none">
            {product.name}
          </h1>
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(reviewStats.rating || product.rating || 0)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-slate-200'
                }`}
              />
            ))}
            {reviewStats.count > 0 && (
                <span className="ml-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  {reviewStats.count} Verified Reviews
                </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span className={cn(
                    "text-4xl font-black text-foreground",
                    user && "text-slate-400 text-2xl line-through decoration-2"
                )}>
                {formatPrice(product.price)}
                </span>
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-primary animate-pulse">
                            {formatPrice(Math.floor(product.price * 0.95))}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Crown className="h-3 w-3" /> Member Price
                        </span>
                    </div>
                )}
            </div>
            {!user && (
                <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Join the Club for 5% off member pricing →
                </Link>
            )}
          </div>

          <p className="text-slate-500 leading-relaxed text-lg font-medium border-l-4 border-primary/20 pl-6 py-2">
            {product.description}
          </p>

          {/* Pro Tip Card */}
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 animate-in fade-in slide-in-from-right-4 duration-1000">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                  <Lightbulb className="h-6 w-6 fill-current" />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Apex Pro Tip</p>
                  <p className="text-sm font-bold text-amber-900/80 leading-snug">
                      {product.category === 'airpods' ? "Reset your AirPods by holding the back button for 15 seconds until the light flashes amber." :
                       product.category === 'chargers' ? "Use a 20W brick to hit 50% charge in just 30 minutes on most modern iPhones." :
                       "Keep your gadget clean with a microfiber cloth to maintain that premium mirror finish."}
                  </p>
              </div>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange("decrement")}
                    disabled={quantity <= 1}
                    className="h-12 w-12 rounded-none border-r border-slate-50 hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-8 py-2 min-w-[60px] text-center font-black text-foreground">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange("increment")}
                    className="h-12 w-12 rounded-none border-l border-slate-50 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {product.stock !== undefined && product.stock > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className={cn(
                      "h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all duration-300",
                      justAdded
                        ? "bg-green-600 text-white hover:bg-green-600"
                        : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                    )}
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </div>
                    ) : justAdded ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Added!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={handleWhatsAppOrder}
                    className="h-16 rounded-[1.5rem] bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Quick WhatsApp
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleBuyNow}
                    className="h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary/90 shadow-xl shadow-primary/20 sm:col-span-2"
                  >
                    Checkout Now
                  </Button>
                </div>
            ) : (
                <RestockRadar productId={product.id} productName={product.name} />
            )}

            <div className="flex justify-between border-t border-slate-100 pt-6 px-2">
              <button
                onClick={toggleWishlist}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
                  isInWishlist(product.id) ? "text-rose-500" : "text-slate-400 hover:text-foreground"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")}
                />
                {isInWishlist(product.id) ? "In Wishlist" : "Save for later"}
              </button>

              <button
                onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.href : '';
                    const shareText = `Check out ${product.name} from Apexstores! ${url}`;

                    if (navigator.share) {
                        navigator.share({
                            title: product.name,
                            text: shareText,
                            url: url,
                        }).catch(e => console.warn("Share failed", e));
                    } else {
                        navigator.clipboard.writeText(shareText);
                        alert('Product link copied to clipboard!');
                    }
                }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} isLive={isProductLive} />

      {/* Educational Hub */}
      {tutorials.length > 0 && (
          <div className="mt-24 bg-slate-50 rounded-[3.5rem] p-8 sm:p-16 text-foreground border border-slate-100 relative overflow-hidden shadow-inner">
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><BookOpen className="h-6 w-6" /></div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Master Your Tech</h2>
                  </div>
                  <p className="text-slate-500 text-lg font-medium max-w-xl mb-12 italic">&quot;Don&apos;t just own it, bro. Lead the pack with these elite setup guides from the Apex Library.&quot;</p>

                  <div className="grid sm:grid-cols-2 gap-6">
                      {tutorials.map((t) => (
                          <Link key={t.slug} href={`/blog/${t.slug}`} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-xl transition-all">
                              <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{t.title}</h3>
                              <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-6">{t.excerpt}</p>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                  Access Guide <ArrowRight className="h-3 w-3" />
                              </div>
                          </Link>
                      ))}
                  </div>
              </div>
              {/* Subtle tech background glow */}
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
          </div>
      )}

      <Features />

      <RelatedProducts product={product} />
    </div>
  );
}
