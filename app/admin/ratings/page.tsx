'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, Save, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  rating: number;
}

export default function AdminRatingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRatings = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, rating')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching ratings:', err);
      setMessage({ type: 'error', text: 'Failed to load ratings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const updateRating = (id: number, newRating: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, rating: newRating } : p));
  };

  const handleSave = async (product: Product) => {
    if (!supabase) return;
    setSavingId(product.id);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('products')
        .update({ rating: product.rating })
        .eq('id', product.id);

      if (error) throw error;
      setMessage({ type: 'success', text: `Updated rating for ${product.name}` });
    } catch (err: any) {
      console.error('Error saving rating:', err);
      setMessage({ type: 'error', text: 'Failed to save rating.' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Manage Product Ratings
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base mt-2">
              Set the star rating (0-5) for each item in your catalog.
            </p>
          </div>
          <Button onClick={fetchRatings} variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No products found.</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{product.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => updateRating(product.id, star)}
                              className={`transition-colors ${star <= product.rating ? 'text-amber-500' : 'text-slate-200'}`}
                            >
                              <Star className={`h-5 w-5 ${star <= product.rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                          <span className="ml-2 font-black text-slate-600 dark:text-slate-400">{product.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          className="rounded-lg h-9 px-4 font-bold shadow-sm"
                          disabled={savingId === product.id}
                          onClick={() => handleSave(product)}
                        >
                          {savingId === product.id ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save</>}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
