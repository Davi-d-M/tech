'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  ShoppingBag,
  User,
  Phone,
  MessageSquare,
  RefreshCcw,
  Zap,
  Loader2,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  Target,
  History,
  MousePointer2,
  Search,
  XCircle,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface CartItem {
  id?: string | number;
  name: string;
  price?: number;
  quantity?: number;
  image_url?: string;
}

interface JourneyLogEntry {
  message?: string;
  m?: string;
  time?: string;
  t?: string;
}

interface AbandonedCart {
  id: number;
  customer_name: string;
  customer_phone: string;
  cart_items: CartItem[];
  total_price: number;
  updated_at: string;
  last_contacted_at?: string | null;
  recovery_status: 'Waiting' | 'Contacted' | 'Recovered' | 'Failed' | 'Ignored';
  recovery_channel?: string;
  ai_score: number;
  journey_log: JourneyLogEntry[];
  session_id: string;
}

interface ActiveVisitor {
    session_id: string;
    customer_name?: string;
    current_page: string;
    last_active_at: string;
    cart_value: number;
    status: 'Browsing' | 'Checkout' | 'Idle';
}

const CHANNEL_DATA: { name: string; value: number; color: string }[] = [];

export default function AdminAbandonedPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [visitors, setVisitors] = useState<ActiveVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [ghostStatus] = useState<'idle' | 'running' | 'warning'>('running');

  const stats = useMemo(() => {
      const potentialRevenue = carts.filter(c => c.recovery_status === 'Waiting' || c.recovery_status === 'Contacted').reduce((sum, c) => sum + Number(c.total_price || 0), 0);
      const recoveredToday = carts.filter(c => {
          if (c.recovery_status !== 'Recovered') return false;
          const hours = (Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60);
          return hours <= 24;
      }).reduce((sum, c) => sum + Number(c.total_price || 0), 0);

      const total = carts.length;
      const recovered = carts.filter(c => c.recovery_status === 'Recovered').length;
      const recoveryRate = total > 0 ? (recovered / total) * 100 : 0;

      return { potentialRevenue, recoveredToday, recoveryRate };
  }, [carts]);

  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [cartsRes, visitorsRes] = await Promise.all([
          supabase.from('abandoned_carts').select('*').order('updated_at', { ascending: false }),
          supabase.from('active_visitors').select('*').order('last_active_at', { ascending: false }).limit(20)
      ]);
      setCarts(cartsRes.data || []);
      setVisitors(visitorsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRecovery = async () => {
      setIsRecovering(true);
      try {
          const response = await fetch('/api/admin/recover-carts');
          await response.json();
          fetchData();
      } catch (err) {
          console.error(err);
      } finally {
          setIsRecovering(false);
      }
  };

  const updateStatus = async (id: number, status: AbandonedCart['recovery_status']) => {
      if (!supabase) return;
      const { error } = await supabase.from('abandoned_carts').update({ recovery_status: status }).eq('id', id);
      if (!error) {
          setCarts(prev => prev.map(c => c.id === id ? { ...c, recovery_status: status } : c));
      }
  };

  const filteredCarts = carts.filter(c =>
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer_phone.includes(searchQuery)
  );

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
              <div className={cn("h-2 w-2 rounded-full animate-pulse", ghostStatus === 'running' ? "bg-primary" : "bg-primary/50")}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ghost Worker: {ghostStatus.toUpperCase()}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Baggage Rescue</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">AI-powered recovery suite for high-intent abandoned tech bags.</p>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={handleManualRecovery}
                disabled={isRecovering}
                variant="outline"
                className="rounded-xl h-12 px-6 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
            >
                {isRecovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Force Global Rescue
            </Button>
            <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 bg-white border-slate-100 font-black uppercase text-[10px] tracking-widest"><RefreshCcw className="h-4 w-4 mr-2" /> Sync Grid</Button>
        </div>
      </header>

      {/* 1. EXECUTIVE RECOVERY HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
              { label: 'Rescue Potential', val: formatPrice(stats.potentialRevenue), icon: TrendingUp, color: 'primary' },
              { label: 'Recovered Today', val: formatPrice(stats.recoveredToday), icon: Zap, color: 'primary' },
              { label: 'Recovery Rate', val: `${stats.recoveryRate.toFixed(1)}%`, icon: Target, color: 'primary' },
              { label: 'Active Visitors', val: visitors.length, icon: Activity, color: 'primary' },
          ].map((item) => (
              <Card key={item.label} className="p-8 rounded-[2.5rem] border-2 border-primary/5 bg-white shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all relative overflow-hidden">
                  <div className={`h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:scale-110 shadow-sm`}>
                      <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tighter uppercase">{item.val}</h3>
                  </div>
              </Card>
          ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">

          <div className="lg:col-span-8 space-y-10">
              {/* 2. RECOVERY PERFORMANCE GRAPH */}
              <Card className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-sm h-[400px] flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                      <div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Revenue Rescue</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recovered vs. Lost Revenue</p>
                      </div>
                  </div>
                  <div className="flex-1 w-full -ml-4 relative z-10">
                      {carts.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={
                                  // Group by date
                                  Object.values(carts.reduce((acc: Record<string, { name: string; recovered: number; lost: number }>, c) => {
                                      const date = new Date(c.updated_at).toLocaleDateString();
                                      if (!acc[date]) acc[date] = { name: date, recovered: 0, lost: 0 };
                                      if (c.recovery_status === 'Recovered') {
                                          acc[date].recovered += Number(c.total_price || 0);
                                      } else {
                                          acc[date].lost += Number(c.total_price || 0);
                                      }
                                      return acc;
                                  }, {}))
                              }>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                  <Tooltip
                                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }}
                                      labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#94a3b8', marginBottom: '0.5rem' }}
                                  />
                                  <Area type="monotone" dataKey="recovered" stroke="#F5A000" strokeWidth={4} fill="#F5A00010" name="Recovered" />
                                  <Area type="monotone" dataKey="lost" stroke="#f1f5f9" strokeWidth={4} fill="#f1f5f905" name="Lost/Pending" />
                              </AreaChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Awaiting Recovery Data...</div>
                      )}
                  </div>
              </Card>

              {/* 3. ABANDONED CART TABLE */}
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-2 text-left">
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Rescue Inventory</h2>
                      <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search Customer or Phone..."
                            className="h-12 rounded-2xl bg-white border-slate-100 pl-12 text-[10px] font-black uppercase tracking-widest w-80 shadow-sm"
                          />
                      </div>
                  </div>

                  <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                      {isLoading ? (
                          <div className="p-32 text-center flex flex-col items-center gap-4 flex-1">
                              <Loader2 className="h-12 w-12 text-primary animate-spin" />
                              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Accessing Bag Logs...</p>
                          </div>
                      ) : filteredCarts.length === 0 ? (
                          <div className="p-32 text-center flex flex-col items-center gap-8 bg-white rounded-[3rem] shadow-inner border border-slate-50 flex-1">
                              <ShoppingBag className="h-20 w-20 text-slate-50" />
                              <div className="space-y-2">
                                  <p className="text-xl font-black text-slate-300 uppercase tracking-tight italic">No bags awaiting rescue.</p>
                                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">The checkout pipeline is healthy.</p>
                              </div>
                          </div>
                      ) : (
                          <div className="divide-y divide-slate-50">
                              {filteredCarts.map((cart) => (
                                  <div key={cart.id} className="p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 hover:bg-slate-50/50 transition-all group">
                                      <div className="flex items-center gap-8 flex-1 text-left">
                                          <div className={cn(
                                              "h-20 w-20 rounded-[2.5rem] flex items-center justify-center text-slate-900 text-xl font-black uppercase shadow-inner relative transition-transform group-hover:scale-105 border border-slate-100",
                                              cart.recovery_status === 'Recovered' ? "bg-primary/10" : cart.recovery_status === 'Contacted' ? "bg-primary/5" : "bg-slate-50"
                                          )}>
                                              {cart.customer_name.substring(0, 2).toUpperCase()}
                                              <div className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-lg">
                                                  <span className={cn(
                                                      "text-[10px] font-black",
                                                      cart.ai_score > 80 ? "text-primary" : cart.ai_score > 40 ? "text-primary/70" : "text-primary/40"
                                                  )}>{cart.ai_score}%</span>
                                              </div>
                                          </div>
                                          <div className="min-w-0">
                                              <div className="flex items-center gap-3 mb-2">
                                                  <h3 className="font-black text-slate-900 uppercase text-lg tracking-tight group-hover:text-primary transition-colors leading-none">{cart.customer_name}</h3>
                                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-200">{cart.recovery_status}</span>
                                              </div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                  <Phone className="h-3 w-3" /> {cart.customer_phone}
                                                  <span className="text-slate-200">|</span>
                                                  <Clock className="h-3 w-3" /> Left {new Date(cart.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                              <div className="flex gap-2 mt-4">
                                                  {cart.cart_items.map((item, i) => (
                                                      <span key={i} className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-[9px] font-black text-slate-500 uppercase shadow-sm">{item.name}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>

                                      <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                                          <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(cart.total_price)}</p>
                                          <div className="flex gap-2">
                                              <Button onClick={() => setSelectedCart(cart)} variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-primary border border-transparent hover:border-primary/20">Journey</Button>
                                              <Button
                                                onClick={() => window.open(`https://wa.me/${cart.customer_phone.replace(/\D/g, '')}`, '_blank')}
                                                className="h-12 px-8 rounded-[1rem] bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                              >
                                                  <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
              {/* 4. LIVE VISITOR FEED */}
              <Card className="p-8 rounded-[3rem] border border-slate-100 bg-slate-50 shadow-inner relative overflow-hidden flex flex-col h-[600px]">
                      <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#F5A000]"></div>
                              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Live Ops Center</h3>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-white text-slate-400 px-3 py-1 rounded-full border border-slate-100 tracking-[0.2em]">{visitors.length} Active</span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-2">
                          {visitors.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                                  <MousePointer2 className="h-10 w-10 animate-bounce text-slate-300" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Waiting for incoming signal...</p>
                              </div>
                          ) : visitors.map(v => (
                              <div key={v.session_id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:shadow-xl transition-all cursor-default">
                                  <div className="flex items-center gap-4">
                                      <div className={cn(
                                          "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                                          v.status === 'Checkout' ? "bg-primary animate-pulse" : v.status === 'Browsing' ? "bg-primary/40" : "bg-slate-400"
                                      )}>
                                          <User className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 text-left">
                                          <p className="text-xs font-black uppercase tracking-tight text-slate-900">{v.customer_name || 'Anonymous'}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{v.current_page}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[11px] font-black text-primary">{formatPrice(v.cart_value)}</p>
                                      <p className="text-[8px] font-black text-slate-600 uppercase mt-1">
                                          {Math.floor((Date.now() - new Date(v.last_active_at).getTime()) / 1000)}s ago
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Real-time GPS Sync Enabled</p>
                      </div>
                  <Zap className="absolute -bottom-20 -left-20 h-64 w-64 text-primary/5 rotate-12" />
              </Card>

              {/* 5. RECOVERY CHANNELS PIE (Real Data Only) */}
              {CHANNEL_DATA.length > 0 && (
                  <Card className="p-8 rounded-[3.5rem] border border-slate-100 bg-white shadow-sm space-y-8">
                      <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-primary" /> Channel Efficiency
                      </h3>
                      <div className="h-[250px] w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={CHANNEL_DATA}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {CHANNEL_DATA.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <Tooltip
                                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                      itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                  />
                              </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <p className="text-2xl font-black text-slate-900 leading-none">62%</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">WhatsApp</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-4">
                          {CHANNEL_DATA.map(c => (
                              <div key={c.name} className="text-center">
                                  <div className="h-1.5 w-full bg-slate-50 rounded-full mb-2">
                                      <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }}></div>
                                  </div>
                                  <p className="text-[8px] font-black uppercase text-slate-400">{c.name}</p>
                              </div>
                          ))}
                      </div>
                  </Card>
              )}

              {/* 6. AI INSIGHTS */}
              <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-4 flex items-center gap-2">
                      <Activity className="h-4 w-4" /> AI Operations
                  </h3>
                  <Card className="p-8 rounded-[3rem] bg-slate-50 border border-slate-100 text-slate-900 shadow-inner relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                          <Flame className="h-10 w-10 text-primary animate-pulse" />
                          <div className="space-y-2">
                              <p className="text-sm font-bold italic leading-relaxed text-slate-500">&quot;Friday evenings have the highest abandonment rate. Automated 10% coupons are now active for bags over 5k.&quot;</p>
                          </div>
                          <div className="pt-4 border-t border-slate-200">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current AI Strategy</p>
                              <p className="text-xs font-black text-primary uppercase mt-1">Aggressive Conversion Mode</p>
                          </div>
                      </div>
                  </Card>
              </div>
          </div>
      </div>

      {/* 7. JOURNEY MODAL */}
      {selectedCart && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-500/10 backdrop-blur-md p-6" onClick={() => setSelectedCart(null)}>
              <Card className="max-w-2xl w-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                  <div className="p-10 space-y-10 text-left">
                      <header className="flex justify-between items-start">
                          <div className="flex items-center gap-6">
                              <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 text-2xl font-black shadow-inner">
                                  {selectedCart.customer_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedCart.customer_name}</h2>
                                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Baggage ID: #{selectedCart.id}</p>
                              </div>
                          </div>
                          <button onClick={() => setSelectedCart(null)} className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm border border-slate-100"><XCircle className="h-6 w-6" /></button>
                      </header>

                      <div className="space-y-8">
                          <div className="flex items-center gap-3">
                              <History className="h-6 w-6 text-primary" />
                              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Recovery Timeline</h3>
                          </div>

                          <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-1 before:bg-slate-50 before:rounded-full">
                              {selectedCart.journey_log && selectedCart.journey_log.length > 0 ? selectedCart.journey_log.map((step: { message?: string; m?: string; time?: string; t?: string }, i: number) => (
                                  <div key={i} className="relative group">
                                      <div className={cn(
                                          "absolute -left-10 top-0 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 bg-primary"
                                      )}>
                                          <Target className="h-2.5 w-2.5 text-white" />
                                      </div>
                                      <div className="text-left">
                                          <p className="text-xs font-black text-slate-900 uppercase leading-none">{step.message || step.m}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{step.time || step.t}</p>
                                      </div>
                                  </div>
                              )) : (
                                  <div className="py-10 text-center opacity-30">
                                      <History className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-[10px] font-black uppercase">No journey logs recorded</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="pt-10 border-t border-slate-100 flex gap-4">
                           <Button
                            onClick={() => updateStatus(selectedCart.id, 'Ignored')}
                            variant="outline"
                            className="flex-1 h-16 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                           >
                               Mark Ignored
                           </Button>
                           <Button className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">Manual Call Rescue</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
}
