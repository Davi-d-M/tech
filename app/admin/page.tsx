'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Plus,
  DollarSign,
  Activity,
  History as HistoryIcon,
  Zap,
  ArrowUpRight,
  Database,
  Globe,
  Smartphone,
  CheckCircle2,
  Loader2,
  Package,
  Truck,
  Send
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAdmin } from '@/context/AdminContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface OrderRecord {
  id: number;
  total_price: number;
  unit_price?: number;
  unit_cost?: number;
  status: string;
  created_at: string;
  customer_name: string;
  product_id: number;
  quantity: number;
  payment_method: string;
}

interface ProductRecord {
  id: number;
  stock: number;
  name: string;
  price: number;
  image_url: string;
  cost_price: number;
  category?: string;
}

interface AuditLog {
    id: string;
    action: string;
    staff_email: string;
    created_at: string;
}

// ENTERPRISE HUD 2.0 - Stabilized
export default function AdminDashboard() {
  useAdmin();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
      setMounted(true);
  }, []);

  useEffect(() => {
    async function loadStats() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const start = performance.now();
      try {
        const [ordersRes, productsRes, auditRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('*'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(2)
        ]);

        if (ordersRes.data) setOrders(ordersRes.data as OrderRecord[]);
        if (productsRes.data) setProducts(productsRes.data as ProductRecord[]);
        if (auditRes.data) setAuditLogs(auditRes.data);

        setLatency(Math.round(performance.now() - start));
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = useMemo(() => {
    const productCostMap = new Map(products.map(p => [p.id, Number(p.cost_price || 0)]));
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const totalCost = deliveredOrders.reduce((sum, o) => {
        const productCost = productCostMap.get(o.product_id);
        const cost = o.unit_cost !== undefined
            ? Number(o.unit_cost)
            : (productCost !== undefined ? productCost : (Number(o.unit_price || 0) * 0.7));
        return sum + (cost * (o.quantity || 1));
    }, 0);

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const lowStockItems = products.filter(p => p.stock <= 5).length;

    // Calculate Growth (vs Previous 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const currentPeriodRev = orders
        .filter(o => o.status === 'Delivered' && new Date(o.created_at) >= sevenDaysAgo)
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const prevPeriodRev = orders
        .filter(o => o.status === 'Delivered' && new Date(o.created_at) >= fourteenDaysAgo && new Date(o.created_at) < sevenDaysAgo)
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const growth = prevPeriodRev > 0 ? ((currentPeriodRev - prevPeriodRev) / prevPeriodRev) * 100 : 0;

    return { totalRevenue, netProfit, profitMargin, lowStockItems, growth };
  }, [orders, products]);

  const sparklineData = useMemo(() => {
      const days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
      }).reverse();

      const productCostMap = new Map(products.map(p => [p.id, Number(p.cost_price || 0)]));

      return days.map(date => {
          const dayOrders = orders.filter(o => o.created_at?.startsWith(date));
          const dayRevenue = dayOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + Number(o.total_price || 0), 0);
          const dayCost = dayOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => {
              const productCost = productCostMap.get(o.product_id);
              const cost = o.unit_cost !== undefined
                  ? Number(o.unit_cost)
                  : (productCost !== undefined ? productCost : (Number(o.unit_price || 0) * 0.7));
              return sum + (cost * (o.quantity || 1));
          }, 0);

          return {
              date: date.split('-').slice(1).join('/'),
              count: dayOrders.length,
              revenue: dayRevenue,
              profit: dayRevenue - dayCost
          };
      });
  }, [orders, products]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest animate-pulse">Establishing Data Uplink...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 bg-background">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="p-8 rounded-[3rem] bg-card border-border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="h-12 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="mt-8">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gross Revenue</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{formatPrice(stats.totalRevenue)}</h3>
                    <div className={cn(
                        "flex items-center gap-2 mt-3",
                        stats.growth >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                        <ArrowUpRight className={cn("h-3 w-3", stats.growth < 0 && "rotate-90")} />
                        <span className="text-[9px] font-black uppercase">{stats.growth === 0 ? 'Stable' : `${Math.abs(stats.growth).toFixed(1)}% vs Last Period`}</span>
                    </div>
                </div>
            </div>
            <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 rotate-12 -z-0" />
        </Card>

        <Card className="p-8 rounded-[3rem] bg-card border-border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">Healthy</div>
                </div>
                <div className="mt-8">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net Unit Profit</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{formatPrice(stats.netProfit)}</h3>
                    <p className="text-[9px] font-black text-primary uppercase mt-3">{stats.profitMargin.toFixed(1)}% Margin Unlocked</p>
                </div>
            </div>
        </Card>

        <Card className="p-8 rounded-[3rem] bg-card border-border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div className="h-12 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sparklineData}>
                                <Bar dataKey="count" fill="#ff6b00" radius={[4, 4, 4, 4]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="mt-8">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Pipeline</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{orders.length}</h3>
                    <p className="text-[9px] font-black text-primary uppercase mt-3">{orders.filter(o => o.status === 'Pending').length} Pending Extraction</p>
                </div>
            </div>
        </Card>

        <Card className="p-8 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">System Pulse</h3>
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><Database className="h-3 w-3 text-background/50" /><span className="text-[9px] font-black uppercase">Database</span></div>
                        <span className="text-[8px] font-black text-emerald-500 uppercase">{supabase ? 'Connected' : 'Offline'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-background/50" /><span className="text-[9px] font-black uppercase">Edge API</span></div>
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Operational</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><Smartphone className="h-3 w-3 text-background/50" /><span className="text-[9px] font-black uppercase">Logistics</span></div>
                        <span className="text-[8px] font-black text-primary uppercase">Active</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-background/10 flex justify-between items-center">
                    <span className="text-[8px] font-black text-background/50 uppercase">Latency: {latency}ms</span>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
            </div>
        </Card>

      </div>

      <div className="grid lg:grid-cols-12 gap-10">

          <div className="lg:col-span-8 space-y-10">
              <section className="bg-card rounded-[3.5rem] p-10 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-12">
                      <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">Market Dynamics</h2>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Revenue vs Profit Stream</p>
                      </div>
                      <Link href="/admin/reports">
                          <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">Advanced Analytics &rarr;</Button>
                      </Link>
                  </div>

                  <div className="h-80 w-full">
                      {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={sparklineData}>
                                  <defs>
                                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.1}/>
                                          <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }} className="text-muted-foreground" />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor' }} className="text-muted-foreground" />
                                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }} />
                                  <Area type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={4} fill="url(#colorRevenue)" name="Revenue" />
                                  <Area type="monotone" dataKey="profit" stroke="currentColor" className="text-foreground" strokeWidth={2} fill="transparent" name="Net Profit" />
                              </AreaChart>
                          </ResponsiveContainer>
                      )}
                  </div>
              </section>

              <section id="warehouse-alerts" className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                      <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Warehouse Alerts</h2>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">{stats.lowStockItems} Low Units</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                      {products.filter(p => p.stock <= 5).slice(0, 4).map(p => (
                          <Card key={p.id} className="p-6 rounded-[2.5rem] bg-card border-border flex items-center justify-between group hover:border-rose-200 transition-all">
                              <div className="flex items-center gap-4 min-w-0">
                                  <div className="h-12 w-12 rounded-xl bg-secondary p-2 shrink-0 border border-border">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={p.image_url} alt="" className="max-h-full w-auto object-contain mx-auto" />
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-[11px] font-black text-foreground uppercase truncate">{p.name}</p>
                                      <p className="text-[9px] font-bold text-rose-500 uppercase mt-1">Only {p.stock} remain</p>
                                  </div>
                              </div>
                              <Link href="/admin/upload">
                                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-secondary text-muted-foreground hover:text-primary active:scale-90 transition-all">
                                      <Plus className="h-4 w-4" />
                                  </Button>
                              </Link>
                          </Card>
                      ))}
                  </div>
              </section>
          </div>

          <div className="lg:col-span-4 space-y-8">

              <section className="bg-card rounded-[3.5rem] p-10 border border-border shadow-sm relative overflow-hidden">
                  <div className="relative z-10 space-y-8 text-left">
                    <h3 className="text-sm font-black uppercase text-muted-foreground tracking-[0.3em]">Quick Deployment</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'New Product', icon: Package, href: '/admin/upload' },
                            { label: 'New Rider', icon: Truck, href: '/admin/dispatch' },
                            { label: 'Broadcast', icon: Send, href: '/admin/broadcast' },
                            { label: 'New Coupon', icon: Zap, href: '/admin/gamification' },
                        ].map(action => (
                            <Link key={action.label} href={action.href} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-secondary border border-border hover:bg-primary hover:text-background transition-all group">
                                <action.icon className="h-5 w-5 text-primary group-hover:text-background transition-colors" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-center">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                  </div>
              </section>

              <section className="bg-card rounded-[3.5rem] p-10 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-8 text-left">
                      <h3 className="text-sm font-black uppercase text-foreground tracking-tighter">Audit Trail</h3>
                      <Link href="/admin/audit" className="text-[9px] font-black text-primary uppercase underline">View All</Link>
                  </div>
                  <div className="space-y-6">
                      {auditLogs.length === 0 ? (
                          <p className="text-[10px] font-black text-muted-foreground uppercase italic text-center py-4">No recent activity logged.</p>
                      ) : (
                          auditLogs.map((log) => (
                              <div key={log.id} className="flex gap-4">
                                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"><HistoryIcon className="h-4 w-4" /></div>
                                  <div className="text-left min-w-0">
                                      <p className="text-[10px] font-black text-foreground uppercase leading-tight truncate">{log.action?.replace(/_/g, ' ')}</p>
                                      <p className="text-[8px] text-muted-foreground uppercase mt-1">
                                          {log.staff_email?.split('@')[0]} &bull; {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </section>
          </div>

      </div>

    </div>
  );
}
