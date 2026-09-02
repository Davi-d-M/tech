'use client';

import * as React from 'react';
import {
  Users,
  Phone,
  DollarSign,
  Search,
  ChevronRight,
  Crown,
  ShieldAlert,
  Activity as Zap,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

interface OrderRecord {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  created_at: string;
  referred_by_code?: string | null;
}

interface CustomerProfile {
    id: string;
    phone_number: string | null;
    referral_code: string | null;
    full_name: string | null;
    birth_date: string | null;
    address: string | null;
    segment?: string;
    lifetime_value?: number;
    total_orders?: number;
    last_purchase_at?: string;
    is_partner?: boolean;
}

interface CustomerStats {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrder: string;
  isVIP: boolean;
  referredCount: number;
  age: string;
  location: string;
  segment: string;
  isPartner: boolean;
}

export default function AdminCustomersPage() {
  const { role, permissions } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [profiles, setProfiles] = React.useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [segmentFilter, setSegmentFilter] = React.useState<string>('all');

  React.useEffect(() => {
    async function loadCustomers() {
      if (!supabase) return;

      try {
        const [ordersRes, profilesRes] = await Promise.all([
          supabase.from('orders').select('id, customer_name, customer_phone, total_price, created_at, referred_by_code'),
          supabase.from('profiles').select('phone_number, referral_code, full_name, birth_date, address, segment, lifetime_value, total_orders, last_purchase_at')
        ]);

        if (ordersRes.data) setOrders(ordersRes.data as OrderRecord[]);
        if (profilesRes.data) setProfiles(profilesRes.data as CustomerProfile[]);
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomers();
  }, [role]);

  const customers = React.useMemo(() => {
    const map = new Map<string, CustomerStats>();
    const referralMap = new Map<string, number>();

    // Count referrals
    orders.forEach(o => {
        if (o.referred_by_code) {
            referralMap.set(o.referred_by_code, (referralMap.get(o.referred_by_code) || 0) + 1);
        }
    });

    orders.forEach((order) => {
      const key = (order.customer_phone || '').trim();
      if (!key) return;

      const existing = map.get(key);
      const profile = profiles.find(p => p.phone_number === key);
      const referredCount = (profile && profile.referral_code) ? (referralMap.get(profile.referral_code as string) || 0) : 0;

      // Age calculation
      let age = "N/A";
      if (profile?.birth_date) {
          const birth = new Date(profile.birth_date);
          const now = new Date();
          let calcAge = now.getFullYear() - birth.getFullYear();
          if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) calcAge--;
          age = `${calcAge}y`;
      }

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpend += Number(order.total_price || 0);
        existing.referredCount = Math.max(existing.referredCount, referredCount);
        if (new Date(order.created_at) > new Date(existing.lastOrder)) {
            existing.lastOrder = order.created_at;
        }
      } else {
        map.set(key, {
          id: profile?.id || 'anon',
          name: order.customer_name || profile?.full_name || 'Anonymous',
          phone: key,
          totalOrders: 1,
          totalSpend: Number(order.total_price || 0),
          lastOrder: order.created_at,
          isVIP: false,
          referredCount,
          age,
          location: profile?.address || 'No Address',
          segment: profile?.segment || 'New Customer',
          isPartner: profile?.is_partner || false
        });
      }
    });

    return Array.from(map.values()).map(c => {
        // Calculate Dynamic Segment if not set or for high-fidelity updates
        let segment = c.segment;
        if (c.isPartner) segment = 'Partner';
        else {
            const now = new Date();
            const lastOrderDate = new Date(c.lastOrder);
            const daysSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);

            if (c.totalSpend >= 100000 || c.totalOrders >= 10) segment = 'VIP Premium';
            else if (c.totalSpend >= 50000) segment = 'High Value';
            else if (daysSinceLastOrder > 60) segment = 'At Risk';
            else if (daysSinceLastOrder > 120) segment = 'Dormant';
            else if (c.totalOrders > 1) segment = 'Repeat Buyer';
        }

        return {
            ...c,
            segment,
            isVIP: segment === 'VIP Premium'
        };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders, profiles]);

  const filteredCustomers = React.useMemo(() => {
    const query = (searchQuery || '').toLowerCase();
    return customers.filter(c => {
      const matchesSearch = (c.name || '').toLowerCase().includes(query) || (c.phone || '').includes(query);
      const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [customers, searchQuery, segmentFilter]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50dvh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'owner' && role !== 'admin') {
      return (
          <div className="p-24 flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-16 w-16 text-rose-500 mb-6" />
              <h2 className="text-2xl font-black uppercase text-foreground">Access Denied</h2>
              <p className="text-slate-500 mt-2">Only senior management can view the customer directory.</p>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase tracking-tighter leading-none">Customer Directory</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Track your most loyal shoppers and their purchase history.</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex overflow-x-auto no-scrollbar max-w-sm sm:max-w-none">
                {['all', 'VIP Premium', 'Repeat Buyer', 'Partner'].map(f => (
                    <button
                        key={f}
                        onClick={() => setSegmentFilter(f)}
                        className={cn(
                            "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                            segmentFilter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-foreground"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search Grid..."
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-white font-bold text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Shoppers</p>
            <h3 className="text-2xl font-black text-foreground mt-2 uppercase tracking-tighter">{customers.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Customer LTV</p>
            <h3 className="text-2xl font-black text-foreground mt-2 uppercase tracking-tighter">
              {formatPrice(customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpend, 0) / customers.length : 0)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Premium VIPs</p>
            <h3 className="text-2xl font-black text-foreground mt-2 uppercase tracking-tighter">
              {customers.filter(c => c.isVIP).length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Viral Impact</p>
            <h3 className="text-2xl font-black text-foreground mt-2 uppercase tracking-tighter">
              {customers.reduce((s, c) => s + c.referredCount, 0)} Refs
            </h3>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Contact</th>
                <th className="px-8 py-5">Intel</th>
                <th className="px-8 py-5">Segment</th>
                <th className="px-8 py-5">Impact</th>
                <th className="px-8 py-5">LTV</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-medium italic">No customers found matching your search.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/customers/${customer.phone}`)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground font-black text-[10px] uppercase shadow-sm">
                          {customer.name.substring(0, 2)}
                        </div>
                        <p className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); window.open(`tel:${customer.phone}`, '_self'); }}
                            className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                            title="Call Customer"
                        >
                            <Phone className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-bold text-slate-500 text-xs">
                          {role === 'owner' ? customer.phone : `${customer.phone.substring(0, 4)}****${customer.phone.substring(customer.phone.length - 2)}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              {role === 'owner' || permissions?.can_view_sensitive_rider_data ? customer.age : 'HIDDEN'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest truncate max-w-[100px]">
                              {role === 'owner' || permissions?.can_view_sensitive_rider_data ? customer.location : 'PROTECTED'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            customer.segment === 'VIP Premium' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" :
                        customer.segment === 'Partner' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" :
                        customer.segment === 'High Value' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                            customer.segment === 'Repeat Buyer' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            customer.segment === 'At Risk' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                            customer.segment === 'Dormant' ? "bg-slate-100 text-slate-400 border-slate-200" :
                            "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                            {customer.segment}
                        </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-300" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{customer.referredCount} Refs</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-lg bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">
                          {customer.totalOrders} Orders
                        </span>
                      </div>
                      <p className="font-black text-foreground mt-1 text-sm">{formatPrice(customer.totalSpend)}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:bg-white hover:shadow-xl transition-all">
                          Insight <ChevronRight className="h-3 w-3" />
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
  );
}
