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
  description: string;
  image_url: string;
  category: string;
  stock: number;
}

export default function DynamicProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState(false);

  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function loadProductData() {
      try {
        setLoading(true);

        if (!supabase) {
           setLoading(false);
           return;
        }

        const { data: productData, error: primaryError } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (primaryError || !productData) {
          console.error("Product fetch error:", primaryError?.message);
          setProduct(null);
          setLoading(false);
          return;
        }

        setProduct(productData as Product);

        const { data: related, error: relatedError } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category || 'electronics')
          .neq('id', productData.id)
          .limit(4);

        if (!relatedError && related) {
          setRelatedProducts(related as Product[]);
        }

      } catch (err) {
        console.error("System pipeline crash:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProductData();
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
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const message = `Hello Apexstores! I want to order:\n\n*Product:* ${product.name}\n*Quantity:* ${quantity}\n*Price:* ${formatPrice(product.price * quantity)}\n\nIs this available?`;
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

    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Link copied!');
    }
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Item Not Found</h1>
        <p className="text-slate-500 text-sm max-w-sm mb-6">The product profile you are looking for does not exist or has been modified.</p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans antialiased text-left">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <Link href="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start mb-20 text-left">
          
          <div className="bg-slate-50 rounded-[2rem] p-6 flex items-center justify-center aspect-square border border-slate-100 overflow-hidden sticky top-8">
            <img 
              src={product.image_url || "/placeholder.jpg"}
              alt={product.name}
              className="max-h-[380px] w-auto object-contain transform hover:scale-110 transition-transform duration-500 ease-out"
            />
          </div>

          <div className="flex flex-col justify-between h-full pt-4 text-left">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 uppercase">{product.name}</h1>
              
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-amber-500 font-bold text-base">★ ★ ★ ★ ☆</span>
                <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded ml-2 uppercase">Verified Tech</span>
              </div>

              <div className="text-2xl font-black text-slate-900 mb-6">
                {formatPrice(product.price)}
              </div>

              <p className="text-slate-500 text-sm leading-relaxed mb-8 border-l-2 border-primary/20 pl-4">{product.description}</p>

              <div className="mb-8 flex items-center space-x-6 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</span>
                <div className="flex items-center border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => setQuantity(p => Math.max(1, p - 1))}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 font-black border-r border-slate-100"
                  >
                    -
                  </button>
                  <span className="px-6 font-black text-sm text-slate-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(p => p + 1)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 font-black border-l border-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
                className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-lg disabled:bg-slate-200"
              >
                {isAdding ? 'Adding...' : <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>}
              </Button>
              <Button
                onClick={handleWhatsAppOrder}
                className="h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/10"
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Quick WhatsApp
              </Button>
              <Button
                onClick={handleBuyNow}
                className="h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 sm:col-span-2"
              >
                Checkout Now
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 mt-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-tighter">
              <div className="p-2 bg-slate-50 rounded-xl flex flex-col items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Fast Dispatch</div>
              <div className="p-2 bg-slate-50 rounded-xl flex flex-col items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Genuine Item</div>
              <div className="p-2 bg-slate-50 rounded-xl flex flex-col items-center gap-1"><RefreshCw className="h-3 w-3 text-rose-500" /> No Returns</div>
            </div>

          </div>
        </div>

        <ReviewSection productId={product.id} />

        <section className="border-t border-slate-100 pt-16 mt-12 text-left">
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Related Items</h2>
            <Link href="/" className="text-[10px] font-black text-primary underline uppercase tracking-widest">View All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/shop/${item.id}`} className="group block text-left">
                <div className="bg-slate-50 rounded-[1.5rem] aspect-square flex items-center justify-center p-6 mb-3 border border-transparent group-hover:border-slate-100 transition-all shadow-sm">
                  <img 
                    src={item.image_url || "/placeholder.jpg"}
                    alt={item.name} 
                    className="max-h-[140px] w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate">{item.name}</h3>
                <p className="text-[11px] font-black text-slate-400 mt-1">{formatPrice(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
