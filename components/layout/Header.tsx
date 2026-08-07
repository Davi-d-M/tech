"use client";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getLocalSession } from "@/lib/localAuth";
import { supabase } from "../../lib/supabaseClient";
import { Menu, Search, ShoppingCart, Heart, X, Smartphone, Zap, Package, User as UserIcon, Bell, CheckCircle, ChevronRight, History, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { formatPrice, cn } from "@/lib/utils";
import { useSettings } from "@/lib/useSettings";

interface SearchResult {
  id: number;
  name: string;
  price: number;
  image_url: string;
}

interface RecentView {
  id: number;
  name: string;
  image: string;
}

function UserMenu({ isMobileMenu = false }: { isMobileMenu?: boolean }) {
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);

  const fetchProfile = async (userId: string) => {
      if (!supabase) return;
      const { data } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).limit(1).maybeSingle();
      if (data) setPoints(data.loyalty_points);
  };

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setDisplayEmail(getLocalSession()?.email ?? null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session) {
        setDisplayEmail(session.user.email ?? null);
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setDisplayEmail(session?.user?.email ?? null);
        if (session) {
            fetchProfile(session.user.id);
        } else {
            setPoints(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (displayEmail) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2 group bg-slate-50 hover:bg-white p-1 pr-3 rounded-full border border-slate-100 transition-all hover:shadow-lg">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-foreground transition-colors",
                    isMobileMenu ? "inline-block" : "hidden lg:inline-block"
                )}>
                  {displayEmail?.split('@')?.[0] || 'Member'}
                </span>
                {points !== null && (
                    <Link href="/rewards" className="text-[8px] font-black text-primary uppercase tracking-tighter flex items-center gap-0.5 mt-0.5 hover:underline">
                        <Zap className="h-2 w-2 fill-current" /> {(points || 0).toLocaleString()} PTS
                    </Link>
                )}
            </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", isMobileMenu ? "flex-col w-full gap-2" : "gap-2 sm:gap-4")}>
      <Link
        href="/auth?mode=signin"
        className={cn(
            "text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors",
            !isMobileMenu && "hidden sm:inline-block"
        )}
      >
        Sign In
      </Link>
      <Link
        href="/auth?mode=signup"
        className={cn(
            "rounded-xl bg-primary text-white transition hover:bg-primary/90 shadow-lg shadow-primary/10 text-center active:scale-95",
            isMobileMenu ? "w-full py-4 text-xs font-black" : "hidden sm:inline-block px-5 py-2.5 text-[10px] font-black uppercase tracking-widest"
        )}
      >
        Join Now
      </Link>
      {/* Header-only Mobile Auth Icon */}
      {!isMobileMenu && (
          <Link
            href="/auth?mode=signin"
            className="sm:hidden h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all border border-slate-100 active:scale-95"
            aria-label="Sign In"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
      )}
    </div>
  );
}

export default function Header() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { settings } = useSettings();
  const cartCount =
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentView[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('apex_recent_views');
        if (saved) {
            const parsed = JSON.parse(saved) as RecentView[];
            if (Array.isArray(parsed)) setRecentlyViewed(parsed.slice(0, 3));
        }
    } catch (e) {
        console.warn("Recent views parse error:", e);
    }
  }, [isSearchFocused]);

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
    setIsSearchFocused(false);
  }, [pathname]);

  // Handle Outside Click for Search Results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Search Logic (Hybrid DB + JSON)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = searchQuery.trim().toLowerCase();
      if (query.length >= 2) {
        let results: SearchResult[] = [];

        // 1. Search Supabase
        if (supabase) {
            const { data } = await supabase
              .from('products')
              .select('id, name, price, image_url')
              .ilike('name', `%${searchQuery}%`)
              .limit(5);
            if (data && data.length > 0) results = data as SearchResult[];
        }

        // 2. No Fallback
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleGlobalSearch = (term?: string) => {
      const finalTerm = term || searchQuery;
      if (!finalTerm.trim()) return;

      // Dispatch custom event to filter the ProductList component
      const event = new CustomEvent('apex-search', { detail: { query: finalTerm } });
      window.dispatchEvent(event);

      // Scroll to products
      const catalog = document.getElementById('catalog-start');
      if (catalog) {
          catalog.scrollIntoView({ behavior: 'smooth' });
      } else if (pathname !== '/') {
          router.push(`/?search=${encodeURIComponent(finalTerm)}`);
      }

      setIsSearchFocused(false);
      setIsSearchOpen(false);
  };

  const navItems = [
    { href: "/shop", label: "Shop" },
    { href: "/shop/category/new-arrivals", label: "New" },
    { href: "/shop/category/sale", label: "Sale" },
    { href: "/blog", label: "Library" },
    { href: "/warranty", label: "Warranty" },
    { href: "/track", label: "Track" }
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl shadow-slate-200/50"
          : "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 lg:space-x-12">
            <Link
              className="text-xl sm:text-2xl tracking-tighter font-black text-foreground hover:text-primary transition-colors flex items-center gap-2 uppercase"
              href="/"
              aria-label="Apexstores Home"
            >
              {settings?.branding?.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={settings.branding.logo_url} alt="Logo" className="h-6 sm:h-8 w-auto" />
              ) : (
                  <>
                    <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <span>Apex<span className="text-primary">stores</span></span>
                  </>
              )}
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
                      : "text-slate-500 hover:bg-slate-50 hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-4 relative" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search premium gadgets..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                className="w-full pl-12 pr-4 py-3.5 text-[11px] font-bold uppercase tracking-widest border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-slate-50/50 shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Discovery Hub (Focus but no query) - Mega Menu Style */}
            {isSearchFocused && searchQuery.length === 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[800px] bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 p-10 z-[70] ring-1 ring-primary/5">
                    <div className="grid grid-cols-12 gap-12">
                        <div className="col-span-7 space-y-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 flex items-center gap-2">
                                    <Zap className="h-3 w-3 fill-current" /> Popular Categories
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {['AirPods', 'Fast Charger', 'Samsung', 'iPhone', 'Case', 'Privacy Screen'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleGlobalSearch(tag)}
                                            className="px-6 h-16 rounded-2xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-100 flex items-center justify-between group/chip"
                                        >
                                            {tag}
                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover/chip:opacity-100 group-hover/chip:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-5 space-y-8 border-l border-slate-100 pl-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-2">
                                    <History className="h-3 w-3" /> Recent Activity
                                </p>
                                <div className="space-y-4">
                                    {recentlyViewed.length > 0 ? recentlyViewed.slice(0, 3).map(item => (
                                        <Link key={item.id} href={`/shop/${item.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                            <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.image} alt="" className="max-h-full w-auto object-contain" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-foreground truncate group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">Viewed Just Now</p>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="p-10 text-center space-y-3 opacity-20">
                                            <Search className="h-8 w-8 mx-auto" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">No history found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.5em]">Titan Hub Real-time Sync Active</p>
                    </div>
                </div>
            )}

            {/* Search Results Dropdown (Wider & Frosted) */}
            {searchResults.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[700px] bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 p-6 z-[70]">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Payload matches</p>
                        <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{searchResults.length} Units Found</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {searchResults.map((product) => (
                            <Link key={product.id} href={`/shop/${product.id}`} className="flex items-center gap-6 p-4 hover:bg-slate-50 transition-all rounded-[2rem] group border border-transparent hover:border-slate-100 hover:shadow-xl" onClick={() => setSearchResults([])}>
                                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.image_url} alt="" className="max-h-full w-auto object-contain" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-black uppercase text-foreground truncate tracking-tight">{product.name}</p>
                                    <p className="text-xs font-bold text-primary mt-1">{formatPrice(product.price)}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                    <button
                        onClick={() => handleGlobalSearch()}
                        className="w-full mt-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:bg-primary/5 transition-all rounded-b-[2rem] border-t border-slate-50 flex items-center justify-center gap-2 group/btn"
                    >
                        Initialize Full Search Protocol <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-full hover:bg-slate-50 transition-all active:scale-95"
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-50 transition-all active:scale-95"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-slate-600" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2 rounded-full hover:bg-slate-50 transition-all duration-200 group active:scale-95"
              aria-label="Wishlist"
            >
              <Heart className={`h-6 w-6 text-slate-600 transition-colors ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'group-hover:text-rose-500'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <div className="relative p-2 rounded-full hover:bg-slate-50 transition-all duration-200 group cursor-pointer active:scale-95" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                <Bell className="h-6 w-6 text-slate-600 group-hover:text-primary" />
                {hasUnread && <span className="absolute top-2 right-2 h-4 w-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">1</span>}

                {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[70] p-4 text-left">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notifications Hub</h3>
                            <button className="text-[9px] font-black text-primary uppercase hover:underline" onClick={(e) => { e.stopPropagation(); setHasUnread(false); setIsNotificationsOpen(false); }}>Mark all read</button>
                        </div>
                        <div className="space-y-3">
                            {hasUnread ? (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 group/item hover:border-primary/20 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0 border border-slate-100 group-hover/item:scale-110 transition-transform"><Zap className="h-5 w-5 fill-current" /></div>
                                    <div>
                                        <p className="text-[11px] font-black text-foreground uppercase leading-tight">Welcome to the Club!</p>
                                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-medium">Complete your profile setup to earn your first 100 points instantly.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center space-y-2">
                                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto opacity-20" />
                                    <p className="text-[10px] font-black uppercase text-slate-400">No new alerts, bro!</p>
                                </div>
                            )}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 group/item hover:border-primary/20 transition-all opacity-50 grayscale">
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0 border border-slate-100"><Package className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase leading-tight">Order Logged</p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-medium italic">Older notification read.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Real-time alerts active</p>
                        </div>
                    </div>
                )}
            </div>

            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-slate-50 transition-all duration-200 group active:scale-95"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6 text-slate-600 group-hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="flex items-center border-l border-slate-100 pl-2 sm:pl-4">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="lg:hidden mt-4 animate-in slide-in-from-top-4 duration-300 relative">
            <div className="flex gap-2">
                <div className="relative flex-1">
                <input
                    type="search"
                    placeholder="Search gadgets..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-[10px] font-black uppercase tracking-widest border-none bg-slate-50 rounded-2xl focus:ring-2 focus:ring-primary shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button onClick={() => setIsSearchOpen(false)} className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Mobile Search Results */}
            {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[60] p-2">
                    {searchResults.map((product) => (
                        <Link
                            key={product.id}
                            href={`/shop/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors rounded-2xl"
                        >
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={product.image_url} alt="" className="max-h-full w-auto object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase text-foreground truncate">{product.name}</p>
                                <p className="text-[9px] font-bold text-primary">{formatPrice(product.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
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
              <UserMenu isMobileMenu />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
