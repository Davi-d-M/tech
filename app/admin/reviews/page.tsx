'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  MessageSquare,
  ShieldCheck,
  Star,
  Plus,
  RefreshCcw,
  Trash2,
  EyeOff,
  Eye,
  Send,
  Loader2,
  Search,
  Zap,
  ShieldAlert,
  ExternalLink,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface Review {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  photo_urls: string[];
  is_verified_owner: boolean;
  is_hidden: boolean;
  admin_response: string | null;
  created_at: string;
}

interface Product {
    id: number;
    name: string;
}

export default function AdminReviewHub() {
  const { email: adminEmail } = useAdmin();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'visible' | 'hidden'>('all');
  const [scrubbing, setScrubbing] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Response handling
  const [respondingTo, setRespondingTo] = React.useState<number | null>(null);
  const [responseText, setResponseText] = React.useState('');
  const [isSavingResponse, setIsSavingResponse] = React.useState(false);

  const fetchReviews = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [reviewsRes, productsRes] = await Promise.all([
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('id, name')
      ]);

      if (reviewsRes.error) throw reviewsRes.error;
      setReviews(reviewsRes.data || []);
      setProducts(productsRes.data || []);
      setFetchError(false);
    } catch (err: unknown) {
      console.error(err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews();
  }, []);

  const promoteToMarketing = async (review: Review) => {
      if (!supabase) return;
      try {
          // This would ideally insert into a marketing_assets table
          await logAuditAction(adminEmail, 'PROMOTE_REVIEW_TO_MARKETING', { id: review.id });
          setMessage({ type: 'success', text: "Review boosted to Marketing Hub assets! 🚀" });
          setTimeout(() => setMessage(null), 3000);
      } catch (err) {
          console.error(err);
      }
  };

  const updateReview = async (id: number, updates: Partial<Review>, actionName: string) => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('reviews').update(updates).eq('id', id);
        if (error) throw error;

        await logAuditAction(adminEmail, actionName, { id, ...updates });
        setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err: unknown) {
        const error = err as Error;
        setMessage({ type: 'error', text: error.message });
        setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSaveResponse = async (id: number) => {
      setIsSavingResponse(true);
      await updateReview(id, { admin_response: responseText.trim() || null }, 'REPLY_TO_REVIEW');
      setRespondingTo(null);
      setResponseText('');
      setIsSavingResponse(false);
  };

  const deleteReview = async (id: number) => {
      if (!supabase) return;
      try {
          const { error } = await supabase.from('reviews').delete().eq('id', id);
          if (error) throw error;
          await logAuditAction(adminEmail, 'DELETE_REVIEW', { id });
          setReviews(prev => prev.filter(r => r.id !== id));
          setMessage({ type: 'success', text: 'Review expelled.' });
          setTimeout(() => setMessage(null), 3000);
      } catch (err: unknown) {
          console.error(err);
      }
  };

  const scrubPlaceholders = async () => {
      if (!supabase) return;
      setScrubbing(true);
      try {
          const placeholders = ['john doe', 'member', 'anonymous', 'anonymous user', '??', 'apex member'];
          const { data: toDelete, error: fetchErr } = await supabase
              .from('reviews')
              .select('id')
              .in('customer_name', placeholders);

          if (fetchErr) throw fetchErr;

          if (!toDelete || toDelete.length === 0) {
              setMessage({ type: 'error', text: "No suspicious placeholders detected." });
              setTimeout(() => setMessage(null), 3000);
              return;
          }

          const ids = toDelete.map(r => r.id);
          const { error: delErr } = await supabase.from('reviews').delete().in('id', ids);
          if (delErr) throw delErr;

          await logAuditAction(adminEmail, 'SCRUB_PLACEHOLDER_REVIEWS', { count: ids.length });
          setReviews(prev => prev.filter(r => !ids.includes(r.id)));
          setMessage({ type: 'success', text: `Successfully scrubbed ${ids.length} placeholder reviews.` });
          setTimeout(() => setMessage(null), 5000);
      } catch (err: unknown) {
          const error = err as Error;
          setMessage({ type: 'error', text: `Scrub Error: ${error.message}` });
          setTimeout(() => setMessage(null), 5000);
      } finally {
          setScrubbing(false);
      }
  };

  const filteredReviews = React.useMemo(() => {
      return reviews.filter(r => {
          const matchesSearch = (r.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = statusFilter === 'all' ? true :
                               statusFilter === 'visible' ? !r.is_hidden : r.is_hidden;
          return matchesSearch && matchesStatus;
      });
  }, [reviews, searchQuery, statusFilter]);

  const getProductName = (id: number) => products.find(p => p.id === id)?.name || `Gadget #${id}`;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Community Feedback</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Moderate customer reviews and personally respond to the Apex community.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={scrubPlaceholders} disabled={scrubbing} variant="outline" className="rounded-xl h-12 px-6 border-rose-100 bg-white text-rose-600 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all">
                {scrubbing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Scrub Placeholders
            </Button>
            <Button onClick={fetchReviews} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg">
                <RefreshCcw className="h-4 w-4 mr-2" /> Sync Feed
            </Button>
        </div>
      </header>

      {message && (
          <div className={cn(
              "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
          )}>
              <Zap className="h-5 w-5" />
              <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
          </div>
      )}

      {/* Security Error Box */}
      {fetchError && (
          <div className="p-6 rounded-[2rem] border-2 bg-rose-50 border-rose-100 text-rose-700 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 shadow-xl mb-8">
              <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
              <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-tight mb-1">Moderation Lock Detected</p>
                  <p className="text-xs font-medium leading-relaxed italic">If you cannot verify or hide reviews, your database security is blocking the action.</p>
                  <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-rose-200/50 space-y-3">
                      <p className="text-[10px] font-bold uppercase text-rose-900 font-black">Copy this exact code (No Backslashes):</p>
                      <code className="text-[10px] block bg-slate-50 text-slate-600 p-4 rounded-xl break-all select-all font-mono leading-relaxed border border-slate-100">
                          ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;<br/>
                          ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;<br/>
                          DROP POLICY IF EXISTS &quot;Allow all for reviews&quot; ON reviews;<br/>
                          CREATE POLICY &quot;Allow all for reviews&quot; ON reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
                      </code>
                      <a
                          href="https://supabase.com/dashboard/project/_/editor"
                          target="_blank"
                          className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-rose-600 hover:underline"
                      >
                          Open SQL Editor <ExternalLink className="h-3 w-3" />
                      </a>
                  </div>
              </div>
          </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or comment..."
                className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          </div>
          <div className="flex gap-2">
              {[
                  { id: 'all', label: 'All Reviews' },
                  { id: 'visible', label: 'Live' },
                  { id: 'hidden', label: 'Hidden' }
              ].map(f => (
                  <Button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as 'all' | 'visible' | 'hidden')}
                    className={cn(
                        "rounded-xl h-14 px-6 font-black uppercase text-[10px] tracking-widest transition-all",
                        statusFilter === f.id ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white border-slate-100 text-slate-400 hover:text-foreground"
                    )}
                  >
                      {f.label}
                  </Button>
              ))}
          </div>
      </div>

      {loading ? (
          <div className="p-32 text-center flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Listening to the crowd...</p>
          </div>
      ) : filteredReviews.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center gap-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-100"><MessageSquare className="h-10 w-10" /></div>
              <p className="text-lg font-black text-slate-300 uppercase tracking-tight italic">No reviews found in this category.</p>
          </div>
      ) : (
          <div className="grid gap-8">
              {filteredReviews.map(review => (
                  <div key={review.id} className={cn(
                      "bg-white rounded-[2.5rem] border p-10 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden",
                      review.is_hidden ? "opacity-60 grayscale border-dashed" : "border-slate-100"
                  )}>
                      <div className="flex flex-col lg:flex-row justify-between gap-10">

                          <div className="flex-1 space-y-6">
                              {/* Customer Identity */}
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground font-black text-xs uppercase shadow-inner">
                                          {(review.customer_name || '??').substring(0, 2)}
                                      </div>
                                      <div>
                                          <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{review.customer_name}</h3>
                                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{getProductName(review.product_id)}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="flex text-amber-500">
                                          {[...Array(5)].map((_, i) => (
                                              <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-current" : "text-slate-100")} />
                                          ))}
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</span>
                                  </div>
                              </div>

                              {/* Comment Content */}
                              <div className="pl-16 space-y-4">
                                  <p className="text-slate-700 font-medium leading-relaxed italic text-lg">&quot;{review.comment}&quot;</p>

                                  {review.photo_urls && review.photo_urls.length > 0 && (
                                      <div className="flex gap-3">
                                          {review.photo_urls.map((url, i) => (
                                              <div key={i} className="h-20 w-20 rounded-2xl border border-slate-50 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img src={url} alt="" className="max-h-full w-auto object-contain" />
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  <div className="flex items-center gap-4 pt-2">
                                      <button
                                        onClick={() => updateReview(review.id, { is_verified_owner: !review.is_verified_owner }, 'TOGGLE_VERIFICATION')}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                                          review.is_verified_owner
                                            ? "bg-primary/5 text-primary border-primary/20 shadow-sm"
                                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                        )}
                                      >
                                          <ShieldCheck className="h-3 w-3" /> {review.is_verified_owner ? 'Verified Owner' : 'Mark Verified'}
                                      </button>

                                      <button
                                        onClick={() => updateReview(review.id, { is_hidden: !review.is_hidden }, 'TOGGLE_MODERATION')}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                                          review.is_hidden
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                            : "bg-white text-slate-400 border-slate-100 hover:text-rose-500 hover:border-rose-100"
                                        )}
                                      >
                                          {review.is_hidden ? <><Eye className="h-3 w-3" /> Unhide</> : <><EyeOff className="h-3 w-3" /> Hide from Site</>}
                                      </button>

                                      <button
                                        onClick={() => promoteToMarketing(review)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[8px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-slate-200"
                                      >
                                          <Rocket className="h-3 w-3 text-primary" /> Boost to Marketing
                                      </button>
                                  </div>
                              </div>
                          </div>

                          {/* Admin Interaction Side */}
                          <div className="lg:w-80 space-y-4">
                              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 min-h-[150px] flex flex-col">
                                  <div className="flex items-center justify-between mb-4">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                          <Zap className="h-3 w-3 fill-current text-primary" /> Team Response
                                      </p>
                                      {respondingTo !== review.id && review.admin_response && (
                                          <button onClick={() => { setRespondingTo(review.id); setResponseText(review.admin_response || ''); }} className="text-[8px] font-black uppercase text-primary hover:underline">Edit</button>
                                      )}
                                  </div>

                                  {respondingTo === review.id ? (
                                      <div className="space-y-3 flex-1 animate-in fade-in duration-300">
                                          <Textarea
                                            autoFocus
                                            value={responseText}
                                            onChange={e => setResponseText(e.target.value)}
                                            placeholder="Type your response..."
                                            className="min-h-[100px] rounded-xl border-slate-200 bg-white text-xs font-medium resize-none shadow-inner"
                                          />
                                          <div className="flex gap-2">
                                              <Button
                                                onClick={() => handleSaveResponse(review.id)}
                                                disabled={isSavingResponse}
                                                className="flex-1 rounded-xl h-10 bg-primary text-white font-black uppercase text-[8px] shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
                                              >
                                                  {isSavingResponse ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-2" /> Commit</>}
                                              </Button>
                                              <Button
                                                onClick={() => setRespondingTo(null)}
                                                variant="outline"
                                                className="rounded-xl h-10 px-4 border-slate-200 font-black uppercase text-[8px]"
                                              >
                                                  X
                                              </Button>
                                          </div>
                                      </div>
                                  ) : review.admin_response ? (
                                      <p className="text-xs font-bold text-slate-600 leading-relaxed flex-1 italic">
                                          &quot;{review.admin_response}&quot;
                                      </p>
                                  ) : (
                                      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 border-2 border-dashed border-slate-200 rounded-2xl opacity-40 hover:opacity-100 transition-opacity">
                                          <button onClick={() => setRespondingTo(review.id)} className="flex flex-col items-center gap-2 group">
                                              <Plus className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Add Official Response</span>
                                          </button>
                                      </div>
                                  )}
                              </div>

                              <Button
                                onClick={() => deleteReview(review.id)}
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 font-black uppercase text-[8px] tracking-widest transition-all"
                              >
                                  <Trash2 className="h-3 w-3 mr-2" /> Expel Review
                              </Button>
                          </div>

                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
