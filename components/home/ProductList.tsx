'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from './ProductCard';
import {
  LayoutGrid,
  Smartphone,
  Speaker,
  BatteryCharging,
  Watch,
  Grid2X2,
  Search,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  description?: string;
  image_url?: string;
  image?: string;
  rating?: number;
  category?: string;
  stock?: number;
  sizes?: string[];
  is_new?: boolean;
}

const CATEGORIES = [
    { id: 'all', label: 'All Tech', icon: LayoutGrid },
    { id: 'airpods', label: 'AirPods', icon: Speaker },
    { id: 'chargers', label: 'Chargers', icon: BatteryCharging },
    { id: 'cases', label: 'Cases', icon: Smartphone },
    { id: 'watches', label: 'Watches', icon: Watch },
    { id: 'accessories', label: 'Others', icon: Grid2X2 },
];

export default function ProductList({ initialProducts }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // New Pro Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('all');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        if (!supabase) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch error:', error.message || error);
          setProducts([]);
        } else if (data && data.length > 0) {
          setProducts(data as Product[]);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    if (!initialProducts || initialProducts.length === 0) {
        fetchProducts();
    }
  }, [initialProducts]);

  // Listen for Global Search Event & URL Params
  useEffect(() => {
    // 1. Check URL Params on load
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const term = params.get('search');
        if (term) {
            setSearchQuery(term);
            setActiveCategory('all');
            setSelectedBrand('all');
        }
    }

    // 2. Listen for custom events (TOTAL FILTER RESET)
    const handleApexSearch = (e: Event) => {
        const customEvent = e as CustomEvent<{ query?: string }>;
        const query = customEvent.detail?.query || '';
        setSearchQuery(query);
        setActiveCategory('all');
        setSelectedBrand('all');
        setMinPrice('');
        setMaxPrice('');
        setInStockOnly(false);
    };

    window.addEventListener('apex-search', handleApexSearch);
    return () => window.removeEventListener('apex-search', handleApexSearch);
  }, []);

  // Extract unique brands (first word of product name)
  const brands = useMemo(() => {
      // Logic: Only show brands that exist in the active category
      const currentCategoryProds = activeCategory === 'all'
        ? products
        : products.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());

      const allBrands = currentCategoryProds.map(p => (p.name || '').trim().split(' ')[0]);
      return ['all', ...Array.from(new Set(allBrands))];
  }, [products, activeCategory]);

  const filteredProducts = useMemo(() => {
      let filtered = [...products];

      // 1. Category Filter
      if (activeCategory !== 'all') {
          filtered = filtered.filter(p => (p.category || '').toLowerCase() === (activeCategory || '').toLowerCase());
      }

      // 2. Search Filter
      if ((searchQuery || '').trim()) {
          const query = (searchQuery || '').toLowerCase();
          filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.description || '').toLowerCase().includes(query)
          );
      }

      // 3. Price Range Filter
      if (minPrice) {
          filtered = filtered.filter(p => p.price >= Number(minPrice));
      }
      if (maxPrice) {
          filtered = filtered.filter(p => p.price <= Number(maxPrice));
      }

      // 4. Stock Filter
      if (inStockOnly) {
          filtered = filtered.filter(p => (p.stock || 0) > 0);
      }

      // 5. Brand Filter
      if (selectedBrand !== 'all') {
          filtered = filtered.filter(p => (p.name || '').toLowerCase().startsWith(selectedBrand.toLowerCase()));
      }

      // 6. Sorting
      filtered.sort((a, b) => {
          if (sortBy === 'low-to-high') return a.price - b.price;
          if (sortBy === 'high-to-low') return b.price - a.price;
          return b.id - a.id; // Newest
      });

      return filtered;
  }, [products, activeCategory, searchQuery, sortBy, minPrice, maxPrice, inStockOnly, selectedBrand]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 text-left scroll-mt-32" id="catalog-start">

      {/* 1. Category Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-3 scrollbar-hide no-scrollbar">
          {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery(''); // Reset search when switching categories
                    setSelectedBrand('all'); // Reset brand
                }}
                className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0 border",
                    activeCategory === cat.id
                        ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                  <cat.icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-primary" : "text-slate-300")} />
                  {cat.label}
              </button>
          ))}
      </div>

      {/* 2. Pro Filters Bar */}
      <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">

          <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AirPods, chargers, cases..."
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 text-sm font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                  <div className="relative w-32">
                      <Input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min Ksh"
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-xs font-bold"
                      />
                  </div>
                  <span className="text-slate-300">—</span>
                  <div className="relative w-32">
                      <Input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max Ksh"
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-xs font-bold"
                      />
                  </div>
              </div>

              {/* Sort */}
              <div className="relative w-full lg:w-auto">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-14 w-full lg:w-64 pl-12 pr-6 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                      <option value="newest">Sort: Newest First</option>
                      <option value="low-to-high">Price: Low to High</option>
                      <option value="high-to-low">Price: High to Low</option>
                  </select>
              </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-50">
              {/* Brand Filter */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 shrink-0">
                      <Filter className="h-3 w-3" /> Brands:
                  </span>
                  {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                            selectedBrand === brand
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-slate-50 text-slate-400 border border-transparent hover:border-slate-100"
                        )}
                      >
                          {brand}
                      </button>
                  ))}
              </div>

              {/* Availability Toggle */}
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className="flex items-center gap-2 group"
              >
                  <div className={cn(
                      "transition-colors",
                      inStockOnly ? "text-primary" : "text-slate-300 group-hover:text-slate-400"
                  )}>
                      {inStockOnly ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">In Stock Only</span>
              </button>
          </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
              <div className="h-32 w-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform duration-700">
                <LayoutGrid className="h-12 w-12 text-slate-200" />
              </div>
              <div className="space-y-2 text-left sm:text-center px-6">
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">
                    Warehouse Silent
                  </h3>
                  <p className="text-slate-400 text-sm font-medium italic max-w-xs mx-auto">
                    &quot;We couldn&apos;t locate any gadgets matching those parameters. Try resetting your radar.&quot;
                  </p>
              </div>
              <button
                onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                    setMinPrice('');
                    setMaxPrice('');
                    setInStockOnly(false);
                    setSelectedBrand('all');
                }}
                className="mt-8 px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                  Clear All Filters
              </button>
          </div>
          {/* Background Decorative Zap */}
          <Zap className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50/50 rotate-12 -z-0" />
        </div>
      )}

      {error && (
        <div className="mt-12 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 font-bold text-xs text-center">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
