'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, RefreshCcw } from 'lucide-react';
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching ratings:', error);
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error saving rating:', error);
      setMessage({ type: 'error', text: 'Failed to save rating.' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">
              Trust Control
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Set the star rating (0-5) for each gadget in your catalog.
            </p>
          </div>
          <Button onClick={fetchRatings} variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200 bg-white">
            <RefreshCcw className="h-4 w-4" /> Sync
          </Button>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border animate-in fade-in zoom-in-95 ${
            message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary/10 text-primary border-primary/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Gadget Name</th>
                  <th className="px-8 py-5">Reputation</th>
                  <th className="px-8 py-5 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={3} className="px-8 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs italic">The library is empty.</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6 font-black text-foreground uppercase text-xs tracking-tight">{product.name}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => updateRating(product.id, star)}
                                className={`transition-all ${star <= product.rating ? 'text-amber-500 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                              >
                                <Star className={`h-5 w-5 ${star <= product.rating ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">{product.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button
                          size="sm"
                          className="rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/10"
                          disabled={savingId === product.id}
                          onClick={() => handleSave(product)}
                        >
                          {savingId === product.id ? 'Wait...' : 'Commit'}
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
