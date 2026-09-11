'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Clock, AlertCircle, MapPin, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LiveOrderTracker from '@/components/order/LiveOrderTracker';

interface OrderDetails {
  id: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  created_at: string;
  payment_method: string;
  rider_name?: string | null;
  rider_phone?: string | null;
}

function TrackingContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const fetchOrder = async (query: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isIdSearch = !isNaN(Number(query));

      let dbQuery = supabase
        .from('orders')
        .select('*');

      if (session) {
        // Logged In: Only allow fetching their OWN orders
        dbQuery = dbQuery.eq('user_id', session.user.id);
        if (isIdSearch) {
          dbQuery = dbQuery.eq('id', query);
        } else {
          dbQuery = dbQuery.eq('customer_phone', query);
        }
      } else {
        // Guest: Only allow very specific search (ID + recent)
        // Note: For guests, we strictly search by ID to prevent phone number guessing
        if (isIdSearch) {
          dbQuery = dbQuery.eq('id', query);
        } else {
          setError("Please log in to track by phone number or enter an Order ID.");
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !data) {
        setError("Order not found or access denied. Ensure you are logged in to the correct account.");
        setOrder(null);
      } else {
        setOrder(data as OrderDetails);
      }
    } catch (err) {
      console.error("Track Error:", err);
      setError("Unauthorized access attempt flagged.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Auto-load logic (Member memory & Deep Link)
  useEffect(() => {
    const urlId = searchParams.get('id');

    async function initialLoad() {
        if (urlId) {
            setSearchQuery(urlId);
            fetchOrder(urlId);
            return;
        }

        // Check if member is logged in
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Fetch member's profile for phone
                const { data: profile } = await supabase.from('profiles').select('phone_number').eq('id', session.user.id).single();
                const searchId = profile?.phone_number || session.user.email;
                if (searchId) fetchOrder(searchId);
            }
        }
    }
    initialLoad();
  }, [searchParams]);

  // 2. Real-time "Magic" Listener
  useEffect(() => {
    if (!supabase || !order) return;

    const channel = supabase
        .channel(`track-order-${order.id}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${order.id}`,
            },
            (payload) => {
                setOrder(payload.new as OrderDetails);
            }
        )
        .subscribe();

    return () => {
        if (supabase) {
            supabase.removeChannel(channel);
        }
    };
  }, [order]);

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase mb-4">Track Order</h1>
            <p className="text-slate-500 font-medium text-lg italic">Real-time visibility into your delivery.</p>
        </div>

        <Card className="rounded-[3rem] border-slate-100 shadow-2xl shadow-slate-200/50 mb-16 overflow-hidden">
            <CardContent className="p-10 bg-slate-50/50">
                <form onSubmit={(e) => { e.preventDefault(); fetchOrder(searchQuery); }} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter Order ID or Phone"
                            className="h-16 rounded-[1.5rem] border-white bg-white pl-14 text-sm font-bold shadow-sm"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                    </div>
                    <Button type="submit" disabled={loading} className="h-16 px-12 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        {loading ? 'Searching...' : 'Locate Order'}
                    </Button>
                </form>
                {error && <p className="mt-6 text-rose-600 text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</p>}
            </CardContent>
        </Card>

        {order ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <LiveOrderTracker orderId={order.id} />

                <div className="mt-12 text-center space-y-6">
                    <p className="text-slate-400 text-sm font-medium italic">Apexstores guarantees zero-defect dispatch for every gadget.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" className="rounded-xl h-12 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400 hover:text-foreground">
                                ← Store Home
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="rounded-xl h-12 px-8 font-black uppercase text-[9px] tracking-widest border-slate-200 hover:bg-slate-50">
                                Technical Support
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: MapPin, text: 'Nairobi Fast Dispatch', color: 'primary' },
                    { icon: ShieldCheck, text: 'Verified Authenticity', color: 'emerald-500' },
                    { icon: Clock, text: 'Live Status Updates', color: 'indigo-500', live: true }
                ].map((feature, i) => (
                    <div
                        key={i}
                        className="group p-8 rounded-3xl border border-slate-100 bg-white text-center space-y-4 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 hover:border-primary/20 transition-all duration-500 cursor-default relative overflow-hidden"
                    >
                        <div className={cn(
                            "h-14 w-14 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                            feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                            feature.color === 'emerald-500' ? 'bg-emerald-50 text-emerald-500' :
                            'bg-indigo-50 text-indigo-500'
                        )}>
                            <feature.icon className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{feature.text}</p>
                            {feature.live && (
                                <div className="flex items-center justify-center gap-1.5 pt-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-tighter">Live Monitor</span>
                                </div>
                            )}
                        </div>
                        {/* Subtle background glow on hover */}
                        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-slate-50 rounded-full blur-3xl group-hover:bg-primary/5 transition-all duration-700"></div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="p-24 text-center font-black uppercase text-slate-400 animate-pulse">Syncing Tracking Data...</div>}>
            <TrackingContent />
        </Suspense>
    );
}
