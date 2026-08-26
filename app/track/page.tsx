'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, MapPin, ShieldCheck, MessageSquare, Star, Zap } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/lib/useSettings';

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

const STEPS = [
    { id: 'Pending', label: 'Order Received', icon: Clock, detail: 'Securing your items in our elite warehouse...' },
    { id: 'Paid', label: 'Payment Verified', icon: ShieldCheck, detail: 'M-Pesa sync complete. Funds verified.' },
    { id: 'Processing', label: 'Quality Check', icon: Package, detail: 'Zero-defect inspection in progress.' },
    { id: 'Dispatched', label: 'Out for Delivery', icon: Truck, detail: 'Fast dispatch active. Rider approaching.' },
    { id: 'Delivered', label: 'Handed Over', icon: CheckCircle, detail: 'Tech secured. Welcome to the Apex Club.' },
];

function TrackingContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const { settings } = useSettings();

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

  const getStatusIndex = (status: string) => {
    const idx = STEPS.findIndex(s => s.id.toLowerCase() === status.toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = order ? getStatusIndex(order.status) : -1;

  const handleWhatsAppDispatch = () => {
      if (!order) return;
      const message = `Hello Apexstores! I am tracking Order #${order.id} and it says it's Out for Delivery. What is the ETA?`;
      window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase mb-4">Track Gadget</h1>
            <p className="text-slate-500 font-medium text-lg italic">Elite real-time visibility into your tech dispatch.</p>
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
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-12">
                    <div className="p-8 sm:p-12 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Real-time Pipeline Active</span>
                            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">Order #{order.id}</h2>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg ${
                            order.status === 'Delivered' ? 'bg-emerald-500 text-white' :
                            order.status === 'Dispatched' ? 'bg-primary text-white shadow-primary/20' :
                            'bg-amber-500 text-white'
                        }`}>
                            {order.status}
                        </div>
                    </div>

                    <div className="p-8 sm:p-12">
                        {/* High-End Progress Visual */}
                        <div className="relative mb-12 sm:mb-20">
                            {/* Desktop Horizontal Line */}
                            <div className="hidden sm:block absolute top-6 left-0 right-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 ease-out"
                                    style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                                ></div>
                            </div>

                            {/* Mobile Vertical Line */}
                            <div className="sm:hidden absolute left-6 top-0 bottom-0 w-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="w-full bg-primary transition-all duration-1000 ease-out origin-top"
                                    style={{ height: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                                ></div>
                            </div>

                            <div className="relative flex flex-col sm:flex-row justify-between gap-8 sm:gap-0">
                                {STEPS.map((step, idx) => (
                                    <div key={step.id} className="flex sm:flex-col items-center gap-6 sm:gap-0">
                                        <div className={cn(
                                            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-700 z-10 shrink-0",
                                            currentIndex >= idx
                                                ? "bg-white border-primary text-primary shadow-xl scale-110"
                                                : "bg-white border-slate-100 text-slate-200"
                                        )}>
                                            <step.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", currentIndex === idx && "animate-pulse")} />
                                        </div>
                                        <div className="sm:text-center text-left">
                                            <p className={cn(
                                                "sm:mt-5 text-[10px] font-black uppercase tracking-widest sm:max-w-[80px]",
                                                currentIndex >= idx ? "text-foreground" : "text-slate-300"
                                            )}>
                                                {step.label}
                                            </p>
                                            {currentIndex === idx && (
                                                <p className="mt-1 sm:mt-2 text-[8px] font-bold text-primary uppercase tracking-tighter sm:max-w-[100px] animate-in fade-in duration-1000">
                                                    {step.detail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pt-8 border-t border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient</p>
                                <p className="font-bold text-foreground uppercase text-xs">{order.customer_name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Payment</p>
                                <p className="font-bold text-foreground uppercase text-xs">{order.payment_method}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total Paid</p>
                                <p className="font-black text-foreground text-lg">{formatPrice(order.total_price)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Est. Arrival</p>
                                <p className="font-bold text-emerald-600 uppercase text-xs">
                                    {order.status === 'Delivered' ? 'Arrived' : 'Within 2 Hours'}
                                </p>
                            </div>
                        </div>

                        {/* Titan Pass Secure Handover (Android Only) */}
                        {order.status === 'Dispatched' && (
                            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center">
                                <Button
                                    onClick={() => {
                                        const win = window as any;
                                        if (win.TitanNode?.generateMemberPass) {
                                            win.TitanNode.generateMemberPass(order.id.toString());
                                        } else {
                                            alert("Titan Pass requires the native Android Node. Access denied.");
                                        }
                                    }}
                                    className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Zap size={16} className="text-primary animate-pulse" />
                                    Show Titan Pass
                                </Button>
                            </div>
                        )}

                        {/* Contextual Action: WhatsApp Dispatch */}
                        {order.status === 'Dispatched' && (
                            <div className="mt-12 p-8 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Truck className="h-6 w-6" /></div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-sm tracking-tight">
                                            {order.rider_name ? `Rider ${order.rider_name} is moving!` : 'Your tech is moving!'}
                                        </p>
                                        <p className="text-indigo-600 text-[10px] font-bold uppercase">
                                            {order.rider_name ? 'Our elite rider is approaching your location.' : 'Our rider is approaching your location.'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        if (order.rider_phone) {
                                            window.open(`https://wa.me/${order.rider_phone.replace(/\D/g, '')}?text=Hello ${order.rider_name}! I am tracking Order #${order.id}. What is your ETA?`, '_blank');
                                        } else {
                                            handleWhatsAppDispatch();
                                        }
                                    }}
                                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" /> {order.rider_name ? `Message ${order.rider_name}` : 'Message Dispatch'}
                                </Button>
                            </div>
                        )}

                        {/* Digital Warranty Card */}
                        {order.status === 'Delivered' && (
                            <div className="space-y-8 mt-12 animate-in zoom-in-95 duration-700">
                                {/* ⭐️ RATE YOUR RIDER */}
                                <Card className="p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 shadow-xl relative overflow-hidden">
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><Star size={20} className="fill-current" /></div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-amber-900">Rate your Pilot</h3>
                                        </div>
                                        <p className="text-sm font-medium text-amber-800 italic leading-relaxed">
                                            &quot;How was your delivery experience with {order.rider_name || 'our rider'}? Your feedback powers the fleet.&quot;
                                        </p>
                                        <div className="flex justify-center gap-4 py-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={async () => {
                                                        if (!supabase) return;
                                                        await supabase
                                                            .from('orders')
                                                            .update({ rider_rating: star })
                                                            .eq('id', order.id);

                                                        // Sync Rider Merit Node
                                                        if (order.rider_phone) {
                                                            fetch('/api/rider/merit', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ riderPhone: order.rider_phone })
                                                            }).catch(() => {});
                                                        }

                                                        alert("Feedback Synchronized! Thank you, Commander.");
                                                    }}
                                                    className="h-12 w-12 rounded-xl bg-white border-2 border-amber-200 text-amber-400 hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center"
                                                >
                                                    <Star size={24} className="fill-current" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Zap className="absolute -bottom-6 -right-6 h-24 w-24 text-amber-200/50 rotate-12" />
                                </Card>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-foreground relative overflow-hidden shadow-xl">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Apex Warranty</h3>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1.5">Digital Protection Active</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serial Key</p>
                                            <p className="text-[10px] font-black text-foreground uppercase">APX-{order.id}-{new Date(order.created_at).getTime().toString().slice(-4)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-sm font-bold text-emerald-600 uppercase flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Fully Protected
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                                                <p className="text-sm font-bold text-foreground uppercase">
                                                    {new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Coverage</p>
                                                <p className="text-sm font-bold text-foreground uppercase">Replacement</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-8 text-[10px] text-slate-400 font-medium italic leading-relaxed">
                                        &quot;Zero-defect guarantee. If your tech has a manufacturer flaw, our elite team will replace it instantly within 7 days.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                <div className="text-center space-y-6">
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
