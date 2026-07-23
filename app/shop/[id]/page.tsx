'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { MessageSquare, ShoppingCart, Share2, ArrowLeft, Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import ReviewSection from '@/components/product/ReviewSection';

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  sizes?: string[]; // Used as variants
  description: string;
  image_url: string;
  category: string;
  stock: number;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('Standard');
  const [email, setEmail] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState(false);

  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!supabase) {
           setLoading(false);
           return;
        }

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (productError || !productData) {
          console.error("Error fetching product:", productError?.message);
          setLoading(false);
          return;
        }

        setProduct(productData as Product);
        if (productData.sizes && productData.sizes.length > 0) {
            setSelectedVariant(productData.sizes[0]);
        }

        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category || 'electronics')
          .neq('id', params.id)
          .limit(4);

        setRelatedProducts((related || []) as Product[]);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    setIsAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '/placeholder.jpg',
      quantity: quantity,
      size: selectedVariant,
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const message = `Hello Apexstores! I want to order:\n\n*Product:* ${product.name}\n*Variant:* ${selectedVariant}\n*Quantity:* ${quantity}\n*Price:* ${formatPrice(product.price * quantity)}\n\nIs this available?`;
    window.open(`https://wa.me/254142422908?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/shop/${params.id}`;
  };

  const handleShare = (platform: string) => {
    if (!product) return;
    const url = getShareUrl();
    const shareText = `Check out ${product.name} from Apexstores - ${formatPrice(product.price)} ${url}`;
    let shareLink = '';

    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(shareLink, '_blank');
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareLink, '_blank');
        break;
      default:
        navigator.clipboard.writeText(shareText);
        alert('Product link copied!');
    }
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Gadget...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <h1 className="text-2xl font-black">Item Not Found</h1>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans antialiased text-left">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <Link href="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start mb-24">
          
          {/* Product Image */}
          <div className="bg-slate-50 rounded-[2.5rem] p-8 flex items-center justify-center aspect-square border border-slate-100 overflow-hidden sticky top-8">
            <img 
              src={product.image_url || "/placeholder.jpg"}
              alt={product.name} 
              className="max-h-[450px] w-auto object-contain transform hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between h-full pt-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Authentic Tech</span>
                {product.stock > 0 ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">In Stock</span>
                ) : (
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">Sold Out</span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 mb-4 leading-none uppercase">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-2 mb-8">
                <div className="flex text-amber-500 font-bold tracking-tighter text-xl">
                  ★ ★ ★ ★ <span className="text-slate-200">★</span>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg ml-2">4.5 Ratings</span>
              </div>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-4xl font-black text-slate-900">{formatPrice(product.price)}</span>
                {product.old_price && (
                  <span className="text-xl text-slate-400 line-through font-bold">{formatPrice(product.old_price)}</span>
                )}
              </div>

              <p className="text-slate-500 leading-relaxed mb-10 text-lg font-medium border-l-4 border-primary/20 pl-6 py-2">
                {product.description || "High-performance premium gadget built for durability and modern connectivity."}
              </p>

              {/* Variant Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-10">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    Select Model / Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all duration-200 ${
                          selectedVariant === variant
                            ? 'border-primary bg-primary text-white shadow-xl shadow-primary/30 scale-105'
                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-12 flex items-center space-x-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Qty</span>
                <div className="flex items-center border-2 border-slate-100 rounded-[1.2rem] overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-slate-50 font-black text-slate-400 border-r-2 border-slate-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-8 font-black text-slate-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-4 py-2 hover:bg-slate-50 font-black text-slate-400 border-l-2 border-slate-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
                className="h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-xl disabled:bg-slate-200"
              >
                {isAdding ? 'Adding...' : <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>}
              </Button>
              <Button
                onClick={handleWhatsAppOrder}
                className="h-16 rounded-[1.5rem] bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Quick WhatsApp
              </Button>
              <Button
                onClick={handleBuyNow}
                className="h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary/90 shadow-xl shadow-primary/20 sm:col-span-2"
              >
                Checkout Now
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between border-t border-slate-100 pt-6 px-2">
                <button 
                    onClick={() => setIsWishlist(!isWishlist)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${isWishlist ? 'text-rose-500' : 'text-slate-400 hover:text-slate-900'}`}
                >
                    {isWishlist ? '❤️ In Wishlist' : '🤍 Save for later'}
                </button>
                <button 
                    onClick={() => setShowShareModal(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                    <Share2 className="h-3 w-3" /> Share Product
                </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-12 border-t border-slate-100 pt-8">
              <div className="text-center group">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Instant Dispatch</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Local Delivery</p>
              </div>
              <div className="text-center group">
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Authentic Tech</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">100% Genuine</p>
              </div>
              <div className="text-center group">
                <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Final Sale</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">No Returns</p>
              </div>
            </div>
          </div>
        </div>

        <ReviewSection productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-slate-100 pt-20 mb-24 text-left">
            <div className="flex justify-between items-baseline mb-12">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Related Gadgets</h2>
              <Link href="/" className="text-[10px] font-black text-primary underline uppercase tracking-widest hover:text-slate-900 transition-colors">
                View Catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/shop/${item.id}`} className="group block">
                  <div className="bg-slate-50 rounded-[2rem] aspect-square flex items-center justify-center p-6 mb-4 border border-transparent group-hover:border-slate-100 transition-all relative overflow-hidden shadow-sm hover:shadow-md">
                    <img 
                      src={item.image_url || "/placeholder.jpg"}
                      alt={item.name}
                      className="max-h-[160px] w-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm font-black text-slate-400 mt-1">
                    {formatPrice(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-6">Share This Gadget</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleShare('whatsapp')} className="h-16 rounded-2xl bg-emerald-50 text-emerald-600 font-black uppercase text-[10px] hover:bg-emerald-100 border border-emerald-100">WhatsApp</Button>
                    <Button onClick={() => handleShare('facebook')} className="h-16 rounded-2xl bg-indigo-50 text-indigo-600 font-black uppercase text-[10px] hover:bg-indigo-100 border border-indigo-100">Facebook</Button>
                    <Button onClick={() => handleShare('copy')} className="h-16 rounded-2xl bg-slate-50 text-slate-600 font-black uppercase text-[10px] hover:bg-slate-100 border border-slate-100 col-span-2 mt-2">Copy Direct Link</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
