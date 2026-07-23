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
import products from "@/data/products.json";
import { cn, formatPrice } from "@/lib/utils";
import {
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  MessageSquare
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Product() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { productId } = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const product = products.find((p) => p.id === parseInt(productId as string));

  if (!product) {
    return <ProductNotFound />;
  }

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
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
    window.open(`https://wa.me/254142422908?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const toggleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        rating: product.rating,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <ProductBreadcrumb />

      <div className="grid lg:grid-cols-2 gap-12 mb-16 text-left">
        <div className="space-y-4">
          <div className="w-full max-w-[500px] mx-auto flex flex-col items-center">
            <div className="rounded-3xl shadow-sm overflow-hidden mb-4 w-full bg-slate-50 border border-slate-100 p-8 flex items-center justify-center aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-[400px] w-auto object-contain transform hover:scale-105 transition-transform duration-500"
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
                  i < Math.round(product.rating)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-slate-200'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              {product.rating ? product.rating.toFixed(1) : 'N/A'} Verified Reviews
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
          </div>

          <p className="text-slate-500 leading-relaxed text-lg font-medium border-l-4 border-primary/20 pl-6 py-2">
            {product.description}
          </p>

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
                  <span className="px-8 py-2 min-w-[60px] text-center font-black text-slate-900">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                size="lg"
                className={cn(
                  "h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all duration-300",
                  justAdded
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-slate-900 text-white hover:bg-slate-800"
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

            <div className="flex justify-between border-t border-slate-100 pt-6 px-2">
              <button
                onClick={toggleWishlist}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
                  isInWishlist(product.id) ? "text-rose-500" : "text-slate-400 hover:text-slate-900"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")}
                />
                {isInWishlist(product.id) ? "In Wishlist" : "Save for later"}
              </button>

              <button
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 flex items-center gap-2 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} />

      <Features />

      <RelatedProducts product={product} />
    </div>
  );
}
