"use client";

import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { clearLocalSession, getLocalSession } from "@/lib/localAuth";
import { supabase } from "../../lib/supabaseClient";
import { Menu, Search, ShoppingCart, Heart, X, Smartphone, Zap, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { formatPrice } from "@/lib/utils";

function UserMenu() {
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setDisplayEmail(getLocalSession()?.email ?? null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setDisplayEmail(session?.user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setDisplayEmail(session?.user?.email ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) {
      clearLocalSession();
      setDisplayEmail(null);
      return;
    }

    await supabase.auth.signOut();
    setDisplayEmail(null);
  };

  if (displayEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-[10px] font-black uppercase tracking-widest text-slate-400 sm:inline-block">
          {displayEmail.split('@')[0]}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-600 transition hover:bg-rose-100 uppercase"
        >
          Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth?mode=signin"
        className="text-[10px] font-black uppercase tracking-widest text-slate-900"
      >
        Sign In
      </Link>
      <Link
        href="/auth?mode=signup"
        className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
      >
        Join
      </Link>
    </div>
  );
}

export default function Header() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const cartCount =
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [pathname]);

  // Handle Outside Click for Search Results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && supabase) {
        setIsSearching(true);
        const { data } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);
        setSearchResults(data || []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navItems = [
    { href: "/shop", label: "Shop" },
    { href: "/shop/category/new-arrivals", label: "New" },
    { href: "/shop/category/sale", label: "Sale" },
    { href: "/contact", label: "Contact" }
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl shadow-slate-900/5"
          : "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 lg:space-x-12">
            <Link
              className="text-2xl tracking-tighter font-black text-slate-900 hover:text-primary transition-colors flex items-center gap-2 uppercase"
              href="/"
              aria-label="Apexstores Home"
            >
              <Smartphone className="h-6 w-6 text-primary" />
              Apex<span className="text-primary">stores</span>
            </Link>

            <nav
              className="hidden md:flex items-center space-x-1"
              role="navigation"
              aria-label="Main navigation"
            >
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                    pathname === href
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-slate-50/50"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 p-2">
                    <p className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Results</p>
                    {searchResults.map((product) => (
                        <Link key={product.id} href={`/shop/${product.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors rounded-2xl group">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                                <img src={product.image_url} alt="" className="max-h-full w-auto object-contain group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase text-slate-900 truncate">{product.name}</p>
                                <p className="text-[10px] font-bold text-primary">{formatPrice(product.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-50 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-slate-600" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2 rounded-full hover:bg-slate-50 transition-all duration-200 group"
              aria-label="Wishlist"
            >
              <Heart className={`h-6 w-6 text-slate-600 transition-colors ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'group-hover:text-rose-500'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-slate-50 transition-all duration-200 group"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6 text-slate-600 group-hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-primary/30">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex items-center border-l border-slate-100 pl-4">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="lg:hidden mt-4 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <input
                type="search"
                placeholder="Search gadgets..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-4 text-[10px] font-black uppercase tracking-widest border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        )}

        {isMobileOpen && (
          <nav className="md:hidden mt-4 bg-slate-50 rounded-3xl p-4 animate-in zoom-in-95 duration-200" role="navigation">
            <div className="flex flex-col space-y-2">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`text-[11px] font-black uppercase tracking-widest py-3 px-4 rounded-2xl transition-all ${
                    pathname === href ? "bg-white shadow-sm text-primary" : "text-slate-500"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center">
              <UserMenu />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
