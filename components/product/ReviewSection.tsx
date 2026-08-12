'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Star, MessageSquare, Send, Camera, X, PartyPopper, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  photo_urls?: string[];
  is_verified_owner?: boolean;
  admin_response?: string | null;
  created_at: string;
}

export default function ReviewSection({ productId, isLive = true }: { productId: number, isLive?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!supabase || !isLive) {
      setLoading(false);
      return;
    }
    try {
      // Get User Session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, isLive]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        if (selectedPhotos.length + files.length > 3) {
            alert("Max 3 photos allowed.");
            return;
        }
        setSelectedPhotos([...selectedPhotos, ...files]);
    }
  };

  const removePhoto = (idx: number) => {
      setSelectedPhotos(selectedPhotos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const photoUrls: string[] = [];
      const BUCKET_NAME = 'apexstores-assets';

      // 1. Upload Photos
      if (selectedPhotos.length > 0) {
          for (const file of selectedPhotos) {
              const filePath = `reviews/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
              const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
              if (uploadError) throw uploadError;
              const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
              photoUrls.push(urlData.publicUrl);
          }
      }

      // 2. Insert Review
      const { error } = await supabase.from('reviews').insert([
        {
          product_id: productId,
          customer_name: name.trim(),
          rating,
          comment: comment.trim(),
          photo_urls: photoUrls
        },
      ]);

      if (error) throw error;

      // 3. Update Mission Progress
      if (user) {
          try {
              const { data: { session } } = await supabase.auth.getSession();
              await fetch('/api/member/gamification', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': session ? `Bearer ${session.access_token}` : ''
                  },
                  body: JSON.stringify({
                      userId: user.id,
                      action: 'update-mission-progress',
                      payload: { missionType: 'review-product', increment: 1 }
                  }),
              });
          } catch (err) {
              console.warn("Mission update failed", err);
          }
      }

      // 4. Trigger Reward if Photo included
      if (selectedPhotos.length > 0 && user) {
          try {
              const res = await fetch('/api/member/reward-review', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      userId: user.id,
                      hasPhoto: true,
                      productName: 'Recent Purchase'
                  }),
              });
              const rewardRes = await res.json();
              if (rewardRes.success) {
                  setRewardClaimed(true);
                  setTimeout(() => setRewardClaimed(false), 5000);
              }
          } catch (err) {
              console.warn("Reward auto-claim failed", err);
          }
      }

      setMessage({ type: 'success', text: 'Thank you! Your verified review has been posted.' });
      setName('');
      setComment('');
      setRating(5);
      setSelectedPhotos([]);
      fetchReviews();
    } catch (err: unknown) {
      console.error('Error posting review:', err);
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to post review.' });
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
            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Customer Reviews</h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-5xl font-black text-foreground">
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

          <form onSubmit={handleSubmit} className="bg-slate-50 rounded-3xl p-6 space-y-4 relative overflow-hidden">
            {!isLive && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Legacy Mode Active</p>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                        &quot;Reviews are temporarily disabled for legacy gadgets. They will be enabled once synced to the Apex Cloud.&quot;
                    </p>
                </div>
            )}

            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">Write a Review</h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Your Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="rounded-xl border-none bg-white py-6"
                required
                disabled={!isLive}
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
                    disabled={!isLive}
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
                disabled={!isLive}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Photos (Optional)</label>
              <div className="flex flex-wrap gap-2">
                  {selectedPhotos.map((photo, i) => (
                      <div key={i} className="relative h-16 w-16 rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                          <Image src={URL.createObjectURL(photo)} alt="" fill className="object-cover" />
                          <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg z-10" disabled={!isLive}><X className="h-3 w-3" /></button>
                      </div>
                  ))}
                  {selectedPhotos.length < 3 && (
                      <label className={cn(
                          "h-16 w-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer bg-white",
                          !isLive ? "border-slate-100 text-slate-100 cursor-not-allowed" : "border-slate-200 text-slate-300 hover:border-primary/50 hover:text-primary"
                      )}>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={!isLive} />
                          <Camera className="h-5 w-5" />
                          <span className="text-[7px] font-black uppercase mt-1">Add</span>
                      </label>
                  )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isLive}
              className="w-full rounded-xl py-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              {isSubmitting ? 'Syncing...' : <><Send className="h-4 w-4 mr-2" /> Post Verified Review</>}
            </Button>

            {message && (
              <p className={`text-[10px] font-bold text-center mt-2 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {message.text}
              </p>
            )}

            {rewardClaimed && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-500 text-white flex items-center gap-3 animate-bounce shadow-xl shadow-emerald-500/20">
                    <PartyPopper className="h-5 w-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Boom! +50 Apex Points Earned</p>
                </div>
            )}
          </form>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : reviews.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[2rem] p-12 text-center border border-slate-100">
              <MessageSquare className="h-8 w-8 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No reviews yet for this gadget.</p>
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
                      <div className="flex items-center gap-3">
                        <p className="font-black text-foreground uppercase text-xs tracking-tight">{review.customer_name}</p>
                        {review.photo_urls && review.photo_urls.length > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100 shadow-sm">
                                <ShieldCheck className="h-2.5 w-2.5 fill-current" /> Verified Authentic
                            </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-400 font-bold">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recent'}
                          </p>
                          {review.is_verified_owner && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[8px] font-black uppercase border border-amber-100">
                                  <ShieldCheck className="h-2 w-2 fill-current" /> Verified Owner
                              </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-slate-100'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">{review.comment}</p>

                {review.photo_urls && review.photo_urls.length > 0 && (
                    <div className="flex gap-3">
                        {review.photo_urls.map((url, i) => (
                            <div key={i} className="h-24 w-24 rounded-2xl border border-slate-50 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm hover:scale-105 transition-transform cursor-zoom-in relative">
                                <Image src={url} alt="" fill className="object-contain p-2" />
                            </div>
                        ))}
                    </div>
                )}

                {review.admin_response && (
                    <div className="mt-6 p-6 bg-primary/5 rounded-2xl border-l-4 border-primary relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                <Zap className="h-3 w-3 fill-current" /> Apexstores Team Response
                            </p>
                            <p className="text-slate-700 text-sm font-medium italic leading-relaxed">
                                &quot;{review.admin_response}&quot;
                            </p>
                        </div>
                    </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
