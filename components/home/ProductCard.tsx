"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { cn, formatPrice } from "@/lib/utils";
import { Check, Eye, Heart, ShoppingCart, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Product {
  id: number;
  image?: string;
  image_url?: string;
  name: string;
  price: number;
  old_price?: number;
  category?: string;
  stock?: number;
  sizes?: string[];
  description?: string;
  is_new?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  const { addToCart } = useCart();

  const imageUrl = product.image || product.image_url || '/placeholder.jpg';
  const isSale = product.old_price && Number(product.old_price) > Number(product.price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Require variant selection if variants are available
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedVariant) {
      alert('Please select a model/color before adding to cart');
      return;
    }

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageUrl,
      quantity: 1,
      size: selectedVariant || undefined,
    });

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <>
      <Card className="group overflow-hidden bg-white border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-[2rem] text-left">
      <div className="relative overflow-hidden aspect-square bg-slate-50 flex items-center justify-center p-6">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {isSale && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-500/30">Sale</span>
            )}
            {product.is_new && (
                <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">New</span>
            )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white shadow-xl hover:bg-white rounded-full",
            isLiked && "opacity-100 text-rose-500"
          )}
          onClick={handleToggleLike}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </Button>

        <Link href={`/product/${product.id}`} className="block relative w-full h-full">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <X className="h-12 w-12" />
              </div>
            )}

          <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <Button
              size="sm"
              className="bg-white text-slate-900 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest px-6 py-5 rounded-2xl shadow-2xl border-none scale-90 group-hover:scale-100 transition-transform duration-300"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickView(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick Look
            </Button>
          </div>
        </Link>
      </div>

      <CardContent className="p-6 space-y-4 text-left">
        <Link href={`/product/${product.id}`}>
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h2>
        </Link>

        <div className="flex items-end justify-between gap-2 border-b border-slate-50 pb-4">
          <div className="flex flex-col">
              {isSale && <span className="text-[10px] font-bold text-slate-400 line-through leading-none mb-1">{formatPrice(Number(product.old_price))}</span>}
              <span className="text-xl font-black text-slate-900 leading-none">
                {formatPrice(product.price)}
              </span>
          </div>
          {product.stock !== undefined && (
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                product.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}
            >
              {product.stock > 0 ? `${product.stock} In Stock` : 'Sold Out'}
            </span>
          )}
        </div>

        <Button
          className={cn(
            'w-full h-14 transition-all duration-300 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg',
            justAdded
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          )}
          onClick={handleAddToCart}
          disabled={isAdding || (product.stock !== undefined && product.stock === 0)}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Syncing...
            </div>
          ) : justAdded ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Added!
            </div>
          ) : product.stock === 0 ? (
            'Out of Stock'
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add to Bag
            </div>
          )}
        </Button>
      </CardContent>
    </Card>

    {/* Quick View Modal */}
    {showQuickView && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowQuickView(false)}>
        <Card className="max-w-3xl w-full bg-white max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0" onClick={e => e.stopPropagation()}>
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
              <div className="aspect-square overflow-hidden rounded-3xl bg-slate-50 flex items-center justify-center p-8 border border-slate-100">
                {!imageError ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="max-h-full w-auto object-contain hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">IMAGE MISSING</div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6 text-left">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
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
                      'w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl',
                      justAdded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    )}
                    onClick={handleAddToCart}
                    disabled={isAdding || (product.stock !== undefined && product.stock === 0)}
                  >
                    {isAdding ? 'Syncing...' : justAdded ? 'Added to Bag!' : 'Add to Bag'}
                  </Button>

                  <div className="grid grid-cols-3 gap-3 text-center text-[9px] font-black uppercase tracking-tighter text-slate-400 pt-4">
                      <div className="p-2 bg-slate-50 rounded-xl">Free Delivery</div>
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
