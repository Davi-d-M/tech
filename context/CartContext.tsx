"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
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
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity: item.quantity || 1 }];
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
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
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
