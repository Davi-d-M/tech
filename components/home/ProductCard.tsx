"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { cn, formatPrice } from "@/lib/utils";
import { Check, Eye, Heart, ShoppingCart, X, ArrowUpDown, MessageSquare, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import RestockNotifyButton from "@/components/product/RestockNotifyButton";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/lib/useSettings";
import { Product } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { signalService } from "@/lib/signalService";

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

const TIER_RANK: Record<string, number> = {
    'Explorer': 0,
    'Silver': 1,
    'Gold': 2,
    'Diamond': 3,
    'Legend': 4
};

export default function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [userTier, setUserTier] = useState('Explorer');

  const { addToCart, toggleCompare, compareList } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  useEffect(() => {
      async function checkTier() {
          if (!supabase) return;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              const { data } = await supabase.from('profiles').select('loyalty_points').eq('id', session.user.id).maybeSingle();
              if (data) {
                  const pts = data.loyalty_points || 0;
                  if (pts >= 5000) setUserTier('Legend');
                  else if (pts >= 2000) setUserTier('Diamond');
                  else if (pts >= 1000) setUserTier('Gold');
                  else if (pts >= 500) setUserTier('Silver');
              }
          }
      }
      checkTier();
  }, []);

  const imageUrl = product.image || product.image_url || '/placeholder.jpg';
  const isSale = product.old_price && Number(product.old_price) > Number(product.price);
  const isComparing = compareList.some(p => p.id === product.id);

  const minTier = product.min_loyalty_tier || 'Explorer';
  const isLocked = TIER_RANK[userTier] < TIER_RANK[minTier];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLocked) return;

    // Require variant selection if variants are available
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedVariant) {
      alert('Please select a model/color before adding to cart');
      return;
    }

    setIsAdding(true);
    // await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      base_price: product.price,
      image: imageUrl,
      quantity: 1,
      size: selectedVariant || undefined,
      wholesale_price: product.wholesale_price,
      wholesale_min_qty: product.wholesale_min_qty
    });

    signalService.track({
        event_type: 'ADD_TO_BAG',
        target: product.id.toString(),
        metadata: { name: product.name, price: product.price, variant: selectedVariant }
    });

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: imageUrl,
      });
    }
  };

  return (
    <>
      <Card className="group overflow-hidden bg-white border-slate-100 hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 rounded-[2.5rem] text-left relative">
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {/* Image Wrapper with Safe Gutter */}
          <Link href={`/shop/${product.id}`} className="absolute inset-6 sm:inset-10 flex items-center justify-center">
            {!imageError ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-contain transition-transform duration-1000 group-hover:scale-110"
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200">
                <X className="h-16 w-16" />
              </div>
            )}

            {/* Quick Look Overlay - Responsive & Centered */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-10">
              <Button
                size="sm"
                data-track-click="QUICK_LOOK_MODAL"
                className="bg-white text-foreground hover:bg-slate-50 font-black uppercase text-[9px] tracking-widest px-6 py-4 rounded-2xl shadow-2xl border-none scale-90 group-hover:scale-100 transition-all duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickView(true);

                  signalService.track({
                      event_type: 'QUICK_VIEW',
                      target: product.id.toString(),
                      metadata: { name: product.name }
                  });
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick Look
              </Button>
            </div>
          </Link>

          {/* Action Icons - Tactical UI */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={isLocked}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white rounded-full h-9 w-9 sm:h-10 sm:w-10",
                isInWishlist(product.id) && "opacity-100 text-rose-500",
                isLocked && "hidden"
              )}
              onClick={handleToggleLike}
            >
              <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              disabled={isLocked}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white rounded-full text-slate-400 hover:text-primary h-9 w-9 sm:h-10 sm:w-10",
                isComparing && "opacity-100 text-primary ring-2 ring-primary/20",
                isLocked && "hidden"
              )}
              onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product);
              }}
              title="Compare"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badges */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-1.5">
              {isSale && (
                  <span className="bg-rose-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-500/20">Sale</span>
              )}
              {product.is_new && (
                  <span className="bg-primary text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">New</span>
              )}
          </div>
        </div>

      <CardContent className="p-5 sm:p-8 space-y-4 text-left min-w-0">
        <Link href={`/shop/${product.id}`} className="block min-w-0">
          <h2 className="font-black text-foreground text-xs sm:text-base uppercase tracking-tight line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[2.8em]">
            {product.name}
          </h2>
        </Link>

        {/* Pricing & Availability Grid */}
        <div className="flex flex-col gap-3 border-b border-slate-50 pb-5">
          <div className="flex items-center justify-between gap-4">
              <span className="text-xl sm:text-2xl font-black text-foreground leading-none tracking-tighter whitespace-nowrap shrink-0">
                {formatPrice(product.price)}
              </span>
              {product.stock !== undefined && (
                <span
                  className={cn(
                    "text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg w-fit shrink-0 border shadow-sm",
                    product.stock > 0 ? 'bg-primary/5 text-primary border-primary/10' : 'bg-rose-50 text-rose-600 border-rose-100'
                  )}
                >
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Sold Out'}
                </span>
              )}
          </div>
          {isSale && (
            <span className="text-[10px] font-bold text-slate-400 line-through leading-none opacity-60 tracking-widest">
              {formatPrice(Number(product.old_price))}
            </span>
          )}
        </div>

        {product.stock !== undefined && product.stock === 0 ? (
            <RestockNotifyButton productId={product.id} productName={product.name} />
        ) : (
            <div className="flex flex-col gap-2">
                <Button
                  data-track-click="ADD_TO_BAG_CARD"
                  className={cn(
                    'w-full h-14 sm:h-16 transition-all duration-300 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-xl active:scale-95',
                    isLocked ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 shadow-none' :
                    justAdded
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                  )}
                  onClick={handleAddToCart}
                  disabled={isAdding || isLocked}
                >
                  {isLocked ? (
                      <div className="flex items-center gap-2">
                        <Lock size={14} /> Locked
                      </div>
                  ) : isAdding ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sync...
                    </div>
                  ) : justAdded ? (
                    <div className="flex items-center gap-2">
                      <Check size={16} /> Added!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} /> Add to Bag
                    </div>
                  )}
                </Button>

                <Button
                    variant="outline"
                    className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl border-primary/10 text-primary hover:bg-primary/5 font-black uppercase text-[8px] sm:text-[9px] tracking-widest active:scale-95 transition-all"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const message = `Hello Apexstores! I want to order:\n\n*Product:* ${product.name}\n*Price:* ${formatPrice(product.price)}\n\nIs this available for dispatch?`;
                        window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                >
                    <MessageSquare size={14} className="mr-2" /> Buy via WhatsApp
                </Button>
            </div>
        )}
      </CardContent>
    </Card>

    {/* Quick View Modal */}
    {showQuickView && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-500/10 backdrop-blur-md p-4" onClick={() => setShowQuickView(false)}>
        <Card className="max-w-3xl w-full bg-white max-h-[90dvh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-50">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Preview</h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100"
              onClick={() => {
                setShowQuickView(false);
                setSelectedVariant("");
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <CardContent className="p-8 space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              {/* Product Image */}
              <div className="aspect-square overflow-hidden rounded-3xl bg-slate-50 flex items-center justify-center p-8 border border-slate-100 relative">
                {!imageError ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain hover:scale-110 transition-transform duration-500 p-8"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">IMAGE MISSING</div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6 text-left">
                <div>
                  <h1 className="text-3xl font-black text-foreground mb-2 uppercase tracking-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-black text-primary">
                        {formatPrice(product.price)}
                    </p>
                    {isSale && <p className="text-lg font-bold text-slate-300 line-through">{formatPrice(Number(product.old_price))}</p>}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="border-l-4 border-primary/20 pl-4 py-1">
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Variants */}
                {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                      Available Options:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedVariant(size)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl border text-xs font-black uppercase transition-all duration-200",
                            selectedVariant === size
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105'
                              : 'border-slate-100 text-slate-600 hover:border-slate-300 bg-white'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 pt-6">
                  <Button
                    className={cn(
                      'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all',
                      justAdded
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                    )}
                    onClick={handleAddToCart}
                    disabled={isAdding || (product.stock !== undefined && product.stock === 0)}
                  >
                    {isAdding ? 'Syncing...' : justAdded ? 'Added to Bag!' : 'Add to Bag'}
                  </Button>

                  <div className="grid grid-cols-2 gap-3 text-center text-[9px] font-black uppercase tracking-tighter text-slate-400 pt-4">
                      <div className="p-2 bg-slate-50 rounded-xl">Verified Tech</div>
                      <div className="p-2 bg-slate-50 rounded-xl">Secure Pay</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}
