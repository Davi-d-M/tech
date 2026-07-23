'use client';

import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { ShoppingCart, Trash2, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image || '/placeholder.jpg',
      quantity: 1
    });
    removeFromWishlist(item.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 text-left">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Wishlist</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Saved items you love.</p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-500 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Button>
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">You haven't added any products to your wishlist yet. Start exploring and save your favorites!</p>
            <Link href="/">
              <Button className="rounded-xl px-8 py-6 font-bold shadow-lg">Discover Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 sm:gap-6 group text-left">
                <div className="h-24 w-24 sm:h-32 sm:w-32 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-50">
                  <img
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{item.name}</h3>
                  <p className="text-primary font-black text-lg mt-1">{formatPrice(item.price)}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      className="rounded-lg h-9 px-4 font-bold bg-slate-900 hover:bg-primary transition-colors flex items-center gap-2"
                      onClick={() => handleMoveToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-9 px-4 font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
