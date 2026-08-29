"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  rating?: number;
}

interface WishlistContextProps {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }

    async function checkUser() {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUserId(session.user.id);
            // Sync with DB
            const { data } = await supabase.from('wishlist_items').select('product_id').eq('user_id', session.user.id);
            if (data && data.length > 0) {
                // Fetch product details for these IDs if needed, but for now we just sync IDs
                // In a real app we'd fetch full items. Let's assume we fetch them:
                const ids = data.map(item => item.product_id);
                const { data: products } = await supabase.from('products').select('id, name, price, image_url').in('id', ids);
                if (products) {
                    setWishlist(products.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image_url
                    })));
                }
            }
        }
    }
    checkUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = async (item: WishlistItem) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((w) => w.id === item.id);
      if (exists) return prevWishlist;
      return [...prevWishlist, item];
    });

    if (userId && supabase) {
        await supabase.from('wishlist_items').upsert({ user_id: userId, product_id: item.id });
    }
  };

  const removeFromWishlist = async (id: number) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== id));

    if (userId && supabase) {
        await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', id);
    }
  };

  const isInWishlist = (id: number) => {
    return wishlist.some((item) => item.id === id);
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem("wishlist");
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
