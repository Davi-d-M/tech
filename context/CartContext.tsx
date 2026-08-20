"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  base_price: number;
  image: string;
  quantity: number;
  size?: string;
  wholesale_price?: number;
  wholesale_min_qty?: number;
}

interface CartContextProps {
  cart: CartItem[];
  compareList: any[];
  addToCart: (item: CartItem) => void;
  addBundleToCart: (items: CartItem[]) => void;
  toggleCompare: (item: any) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    // Meta Tracking
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
            content_name: item.name,
            content_ids: [item.id],
            content_type: 'product',
            value: item.price,
            currency: 'KES'
        });
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevCart.map((cartItem) => {
          if (cartItem.id === item.id) {
              const newQty = cartItem.quantity + (item.quantity || 1);
              let effectivePrice = cartItem.base_price;

              if (cartItem.wholesale_price && cartItem.wholesale_min_qty && newQty >= cartItem.wholesale_min_qty) {
                  effectivePrice = cartItem.wholesale_price;
              }

              return { ...cartItem, quantity: newQty, price: effectivePrice };
          }
          return cartItem;
        });
      }

      let initialPrice = item.base_price || item.price;
      const qty = item.quantity || 1;
      if (item.wholesale_price && item.wholesale_min_qty && qty >= item.wholesale_min_qty) {
          initialPrice = item.wholesale_price;
      }

      return [...prevCart, { ...item, base_price: item.base_price || item.price, price: initialPrice, quantity: qty }];
    });
  };

  const addBundleToCart = (items: CartItem[]) => {
    setCart((prevCart) => {
      let newCart = [...prevCart];
      items.forEach(item => {
          const existingItem = newCart.find(c => c.id === item.id);
          if (existingItem) {
              newCart = newCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
          } else {
              newCart.push({ ...item, quantity: 1 });
          }
      });
      return newCart;
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
            const newQty = Math.max(1, quantity);
            let effectivePrice = item.base_price;

            if (item.wholesale_price && item.wholesale_min_qty && newQty >= item.wholesale_min_qty) {
                effectivePrice = item.wholesale_price;
            }

            return { ...item, quantity: newQty, price: effectivePrice };
        }
        return item;
      })
    );
  };

  const toggleCompare = (item: any) => {
      setCompareList(prev => {
          const exists = prev.find(p => p.id === item.id);
          if (exists) return prev.filter(p => p.id !== item.id);
          if (prev.length >= 2) return [prev[1], item]; // Max 2 items
          return [...prev, item];
      });
  };

  return (
    <CartContext.Provider
      value={{ cart, compareList, addToCart, addBundleToCart, toggleCompare, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
