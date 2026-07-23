'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from '@/components/home/ProductCard';
import { formatPrice } from '@/lib/utils';
import fallbackProducts from '@/data/products.json';

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  stock?: number;
  sizes?: string[];
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);

      if (!supabase) {
          // Use JSON data if Supabase is not configured
          const transformedFallback = fallbackProducts.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              description: p.description,
              image_url: p.image,
              stock: 10,
              sizes: ['Standard']
          }));
          setProducts(transformedFallback);
          setLoading(false);
          return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Unable to load products from Supabase:', error.message);
          // Fallback handled below
        }

        if (data && data.length > 0) {
          setProducts(data as Product[]);
        } else {
            // Fallback to JSON if no data in DB
            const transformedFallback = fallbackProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                description: p.description,
                image_url: p.image,
                stock: 10,
                sizes: ['Standard']
            }));
            setProducts(transformedFallback);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Catalog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-slate-100 pb-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Our Collection</h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">Premium technology and authentic gadgets for every lifestyle.</p>
          </div>
          <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {products.length} Products Found
              </span>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">The warehouse is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((item) => (
              <ProductCard key={item.id} product={{
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  description: item.description,
                  image: item.image_url,
                  stock: item.stock,
                  sizes: item.sizes
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
