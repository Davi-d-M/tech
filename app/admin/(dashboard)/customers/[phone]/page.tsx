'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  Crown,
  Star,
  Package,
  DollarSign,
  TrendingUp,
  History as HistoryIcon,
  Phone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  Gem,
  Loader2,
  MapPin,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
  product_id: number;
  quantity: number;
  payment_method: string;
  customer_name: string;
}

interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  birth_date: string | null;
  referral_code: string | null;
  created_at: string;
  is_partner?: boolean;
  credit_limit?: number;
  relationship_manager?: string;
}

interface ProductInfo {
  id: number;
  name: string;
  category: string | null;
}

export default function CustomerIntelligence() {
  const { phone } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [referrals, setReferrals] = useState<{ id: number; total_price: number; created_at: string }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string; created_at: string; is_verified_owner: boolean }[]>([]);
  const [supportTickets, setSupportTickets] = useState<{ id: number; subject: string; status: string; created_at: string }[]>([]);
  const [loyaltyLedger, setLoyaltyLedger] = useState<{ id: number; amount: number; description: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!supabase || !phone) return;

    try {
      const initialRes = await supabase.from('profiles').select('*').eq('phone_number', phone).maybeSingle();
      const profileData = initialRes.data as CustomerProfile;

      const [ordersRes, productsRes, referralsRes, reviewsRes, ticketsRes, ledgerRes] = await Promise.all([
        supabase.from('orders').select('*').eq('customer_phone', phone).order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, category'),
        profileData?.referral_code ? supabase.from('orders').select('id, total_price, created_at').eq('referred_by_code', profileData.referral_code) : Promise.resolve({ data: [] }),
        supabase.from('reviews').select('*').or(`customer_phone.eq.${phone},customer_name.eq.${profileData?.full_name || 'NONE'}`).order('created_at', { ascending: false }),
        profileData?.id ? supabase.from('support_tickets').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        profileData?.id ? supabase.from('loyalty_ledger').select('*').eq('profile_id', profileData.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (profileData) setProfile(profileData);
      if (productsRes.data) setProducts(productsRes.data as ProductInfo[]);
      if (referralsRes.data) setReferrals(referralsRes.data as { id: number; total_price: number; created_at: string }[]);
      if (reviewsRes.data) setReviews(reviewsRes.data as { id: string; rating: number; comment: string; created_at: string; is_verified_owner: boolean }[]);
      if (ticketsRes.data) setSupportTickets(ticketsRes.data);
      if (ledgerRes.data) setLoyaltyLedger(ledgerRes.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Delivered');
    const totalSpend = delivered.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const avgOrder = delivered.length > 0 ? totalSpend / delivered.length : 0;

    // Age Calculation
    let age = "Unknown";
    if (profile?.birth_date) {
        const birth = new Date(profile.birth_date);
        const now = new Date();
        let calculatedAge = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            calculatedAge--;
        }
        age = `${calculatedAge} Years`;
    }

    // Risk Score
    const cancelled = orders.filter(o => o.status === 'Cancelled' || o.status === 'Payment Failed');
    const riskRatio = orders.length > 0 ? (cancelled.length / orders.length) : 0;
    let risk = "Very Low";
    let riskColor = "text-primary";
    if (riskRatio > 0.5) { risk = "High"; riskColor = "text-primary"; }
    else if (riskRatio > 0.2) { risk = "Moderate"; riskColor = "text-primary"; }

    // Favorite Brand / Category
    const catMap = new Map<string, number>();
    delivered.forEach(o => {
        const prod = products.find(p => p.id === o.product_id);
        if (prod?.category) {
            const category = prod.category;
            catMap.set(category, (catMap.get(category) || 0) + 1);
        }
    });
    const favCat = Array.from(catMap.entries()).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Loyalty Tier
    let tier = "Bronze";
    let TierIcon = Star;
    let tierColor = "text-slate-400 bg-slate-50 border-slate-100";
    if (totalSpend >= 100000) {
        tier = "Diamond";
        TierIcon = Gem;
        tierColor = "text-primary bg-primary/10 border-primary/20 shadow-primary/20 animate-pulse";
    }
    else if (totalSpend >= 50000) {
        tier = "Gold";
        TierIcon = Crown;
        tierColor = "text-primary bg-primary/10 border-primary/20";
    }
    else if (totalSpend >= 20000) {
        tier = "Silver";
        TierIcon = Star;
        tierColor = "text-primary bg-primary/10 border-primary/20";
    }

    return { totalSpend, avgOrder, risk, riskColor, favCat, tier, TierIcon, tierColor, age, referralCount: referrals.length };
  }, [orders, products, profile, referrals]);

  const timelineEvents = useMemo(() => {
    const events: { id: string; type: 'Order' | 'Support' | 'Loyalty' | 'Review'; title: string; subtitle: string; date: string; status?: string; value?: string; color?: string }[] = [];

    orders.forEach(o => {
        const prod = products.find(p => p.id === o.product_id);
        events.push({
            id: `ord-${o.id}`,
            type: 'Order',
            title: prod?.name || `Gadget #${o.product_id}`,
            subtitle: `Purchase via ${o.payment_method}`,
            date: o.created_at,
            status: o.status,
            value: formatPrice(o.total_price),
            color: 'primary'
        });
    });

    supportTickets.forEach(t => {
        events.push({
            id: `tix-${t.id}`,
            type: 'Support',
            title: t.subject,
            subtitle: `Support Ticket #${t.id}`,
            date: t.created_at,
            status: t.status,
            color: 'rose'
        });
    });

    loyaltyLedger.forEach(l => {
        events.push({
            id: `loy-${l.id}`,
            type: 'Loyalty',
            title: l.description,
            subtitle: 'Points Adjustment',
            date: l.created_at,
            value: `${l.amount > 0 ? '+' : ''}${l.amount} Pts`,
            color: 'emerald'
        });
    });

    reviews.forEach(r => {
        events.push({
            id: `rev-${r.id}`,
            type: 'Review',
            title: `${r.rating} Star Review`,
            subtitle: r.comment,
            date: r.created_at,
            color: 'amber'
        });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, products, supportTickets, loyaltyLedger, reviews]);

  const { role, permissions } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Scanning Vault...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-4">
          <Link href="/admin/customers" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground text-2xl font-black uppercase shadow-inner">
                {profile?.full_name?.substring(0, 2) || orders[0]?.customer_name?.substring(0, 2) || '??'}
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">
                  {profile?.full_name || orders[0]?.customer_name || 'Anonymous User'}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                  <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2", stats.tierColor)}>
                      <stats.TierIcon className="h-3 w-3" /> {stats.tier} Loyalty
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined {new Date(profile?.created_at || orders[orders.length - 1]?.created_at || new Date()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => window.open(`tel:${phone}`, '_self')} variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-xl transition-all">
                <Phone className="h-4 w-4 mr-2" /> Direct Call
            </Button>
            <Button onClick={() => window.open(`https://wa.me/${phone}`, '_blank')} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                WhatsApp VIP
            </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
          {[
              { label: 'Lifetime Spend', val: formatPrice(stats.totalSpend), icon: DollarSign, color: 'primary' },
              { label: 'Total Orders', val: `${orders.length} Purchases`, icon: Package, color: 'primary' },
              { label: 'Average Order', val: formatPrice(stats.avgOrder), icon: TrendingUp, color: 'primary' },
              { label: 'Favorite Category', val: stats.favCat, icon: Tag, color: 'primary' },
          ].map((item) => (
              <Card key={item.label} className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className={`h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-6 w-6" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter truncate">{item.val}</h3>
              </Card>
          ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
              <Card className="p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white">
                  <h2 className="text-xl font-black text-foreground uppercase mb-8 flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" /> Intelligence Data
                  </h2>
                  <div className="space-y-6">
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Risk Score</span>
                          <span className={cn("text-xs font-black uppercase", stats.riskColor)}>{stats.risk}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Age</span>
                          <span className="text-xs font-black text-foreground uppercase">{stats.age}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Birthday</span>
                          <span className="text-xs font-black text-foreground uppercase">{profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' }) : 'Not Logged'}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Latitude</span>
                          <span className="text-xs font-black text-foreground uppercase">
                              {role === 'owner' || permissions.can_view_sensitive_rider_data ? (profile?.latitude?.toFixed(6) || 'N/A') : 'PROTECTED'}
                          </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Longitude</span>
                          <span className="text-xs font-black text-foreground uppercase">
                              {role === 'owner' || permissions.can_view_sensitive_rider_data ? (profile?.longitude?.toFixed(6) || 'N/A') : 'PROTECTED'}
                          </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</span>
                          <span className="text-xs font-black text-foreground uppercase truncate max-w-[150px]">{profile?.address || 'No Address'}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preferred Method</span>
                          <span className="text-xs font-black text-foreground uppercase">{orders[0]?.payment_method || 'M-Pesa'}</span>
                      </div>
                      {profile?.is_partner && (
                          <div className="pt-6 mt-2 space-y-4 animate-in zoom-in-95">
                              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase text-indigo-600">Credit Limit</p>
                                      <span className="text-sm font-black text-indigo-700">{formatPrice(profile.credit_limit || 0)}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-indigo-100">
                                      <div className="h-full bg-indigo-500 w-[20%]" />
                                  </div>
                              </div>
                              <div className="flex justify-between items-center px-2">
                                  <p className="text-[9px] font-black uppercase text-slate-400">Account Manager</p>
                                  <span className="text-[10px] font-bold text-foreground">{profile.relationship_manager || 'Global Team'}</span>
                              </div>
                          </div>
                      )}
                  </div>
              </Card>

              <div className="bg-white rounded-[3rem] p-10 border-2 border-primary/10 text-foreground relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all">
                  <Zap className="h-10 w-10 text-primary mb-6 animate-pulse fill-current" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Engagement Index</h3>
                  <p className="text-slate-500 font-medium leading-relaxed italic text-sm group-hover:text-foreground transition-colors">&quot;Recommended Action: Send early-access WhatsApp alert for restocks.&quot;</p>
                  <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-primary/5 rounded-full blur-3xl"></div>
              </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
              {profile?.latitude && profile?.longitude && (
                  <Card className="rounded-[3rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <MapPin className="h-6 w-6 text-primary" />
                              <h2 className="text-xl font-black text-foreground uppercase">Tactical Drop Point</h2>
                          </div>
                          <Button
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`, '_blank')}
                            variant="outline"
                            className="h-10 px-4 rounded-xl text-[8px] font-black uppercase border-slate-200"
                          >
                              <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open Navigation
                          </Button>
                      </div>
                      <div className="h-64 bg-slate-50 relative group">
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                              <div className="h-16 w-16 rounded-full bg-primary/20 animate-ping absolute" />
                              <MapPin className="h-12 w-12 text-primary relative z-10" />
                              <div className="text-center">
                                  <p className="text-[10px] font-black uppercase text-foreground">Coordinates Locked</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}</p>
                              </div>
                          </div>
                      </div>
                  </Card>
              )}

              <Card className="rounded-[3rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                  <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <HistoryIcon className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Customer Timeline</h2>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-full">{timelineEvents.length} Events</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[800px] overflow-y-auto no-scrollbar">
                      {timelineEvents.length === 0 ? (
                          <div className="p-20 text-center opacity-30">
                              <HistoryIcon className="h-10 w-10 mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No activity logged.</p>
                          </div>
                      ) : timelineEvents.map((event) => {
                          const Icon = event.type === 'Order' ? Package :
                                       event.type === 'Support' ? MessageSquare :
                                       event.type === 'Loyalty' ? Zap : Star;

                          return (
                              <div key={event.id} className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-slate-50/50 transition-all group">
                                  <div className="flex items-center gap-6">
                                      <div className={cn(
                                          "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                          event.color === 'primary' ? "bg-primary text-white shadow-primary/20" :
                                          event.color === 'rose' ? "bg-rose-500 text-white shadow-rose-500/20" :
                                          event.color === 'emerald' ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                          "bg-amber-500 text-white shadow-amber-500/20"
                                      )}>
                                          <Icon className="h-6 w-6" />
                                      </div>
                                      <div className="text-left">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{event.type}</span>
                                              <span className="text-[10px] font-bold text-slate-300">•</span>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(event.date).toLocaleDateString()}</span>
                                          </div>
                                          <h4 className="font-black text-foreground uppercase text-sm tracking-tight">{event.title}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic">{event.subtitle}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-8 w-full sm:w-auto justify-between">
                                      <div className="text-right">
                                          {event.value && <p className="text-lg font-black text-foreground">{event.value}</p>}
                                          {event.status && (
                                              <span className={cn(
                                                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                  event.status === 'Delivered' || event.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                  event.status === 'Open' || event.status === 'Pending' ? "bg-primary/10 text-primary border-primary/10" :
                                                  "bg-slate-50 text-slate-400 border-slate-100"
                                              )}>
                                                  {event.status}
                                              </span>
                                          )}
                                      </div>
                                      {event.type === 'Order' ? (
                                          <Link href="/admin/orders">
                                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all"><ChevronRight className="h-4 w-4" /></Button>
                                          </Link>
                                      ) : event.type === 'Support' ? (
                                          <Link href="/admin/messages">
                                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-rose-500 group-hover:text-white transition-all"><ChevronRight className="h-4 w-4" /></Button>
                                          </Link>
                                      ) : null}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </Card>

          </div>
      </div>
    </div>
  );
}
