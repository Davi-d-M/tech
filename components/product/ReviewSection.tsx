'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, User, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ReviewSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          product_id: productId,
          customer_name: name.trim(),
          rating,
          comment: comment.trim(),
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Thank you! Your review has been posted.' });
      setName('');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      console.error('Error posting review:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to post review.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-slate-100 pt-16 text-left">
      <div className="grid lg:grid-cols-3 gap-12">

        {/* Review Summary & Form */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Customer Reviews</h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-5xl font-black text-slate-900">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                  : '5.0'}
              </div>
              <div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{reviews.length} Verified Reviews</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-50 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">Write a Review</h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Your Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="rounded-xl border-none bg-white py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rating</label>
              <div className="flex gap-2 bg-white p-3 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`transition-colors ${star <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                  >
                    <Star className={`h-6 w-6 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Comment</label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What do you think about this gadget?"
                className="rounded-xl border-none bg-white min-h-[100px] resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl py-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              {isSubmitting ? 'Posting...' : <><Send className="h-4 w-4 mr-2" /> Post Review</>}
            </Button>

            {message && (
              <p className={`text-[10px] font-bold text-center mt-2 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : reviews.length === 0 ? (
            <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
              <MessageSquare className="h-8 w-8 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                      {review.customer_name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{review.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-slate-100'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">{review.comment}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
