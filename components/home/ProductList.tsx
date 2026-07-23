'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from './ProductCard';
import fallbackProducts from '@/data/products.json';
import { LayoutGrid, Smartphone, Speaker, BatteryCharging, Watch, Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        if (!supabase) {
          setProducts(fallbackProducts as Product[]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch error:', error.message || error);
          setProducts(fallbackProducts as Product[]);
        } else if (data && data.length > 0) {
          setProducts(data as Product[]);
        } else {
          setProducts(fallbackProducts as Product[]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setProducts(fallbackProducts as Product[]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
      if (activeCategory === 'all') return products;
      return products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [products, activeCategory]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 text-left">

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-8 mb-12 gap-3 scrollbar-hide no-scrollbar">
          {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0 border",
                    activeCategory === cat.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20 scale-105"
                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                  <cat.icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-primary" : "text-slate-300")} />
                  {cat.label}
              </button>
          ))}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
          <div className="text-6xl mb-6 grayscale">📦</div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Category Empty
          </h3>
          <p className="text-slate-500 mt-2 font-medium">
            We're currently restocking items for this collection.
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-8 text-primary font-black uppercase tracking-widest text-[10px] underline underline-offset-4"
          >
              View All Products
          </button>
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
