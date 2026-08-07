'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Phone,
  ShoppingBag,
  DollarSign,
  Search,
  ChevronRight,
  Crown,
  Star,
  ShieldAlert,
  Gem
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
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
}

interface CustomerStats {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrder: string;
}

export default function AdminCustomersPage() {
  const { role } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (role !== 'owner' && role !== 'admin') {
        setIsLoading(false);
        return;
    }

    async function loadCustomers() {
      if (!supabase) return;

      try {
        const { data } = await supabase
          .from('orders')
          .select('id, customer_name, customer_phone, total_price, created_at')
          .order('created_at', { ascending: false });

        if (data) setOrders(data as OrderRecord[]);
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomers();
  }, [role]);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerStats>();

    orders.forEach((order) => {
      const key = (order.customer_phone || '').trim();
      if (!key) return;

      const existing = map.get(key);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpend += Number(order.total_price || 0);
      } else {
        map.set(key, {
          name: order.customer_name || 'Anonymous',
          phone: key,
          totalOrders: 1,
          totalSpend: Number(order.total_price || 0),
          lastOrder: order.created_at,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = (searchQuery || '').toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query)
    );
  }, [customers, searchQuery]);

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
              <h2 className="text-2xl font-black uppercase text-slate-900">Access Denied</h2>
              <p className="text-slate-500 mt-2">Only senior management can view the customer directory.</p>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl uppercase">Customer Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Track your most loyal shoppers and their purchase history.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10 rounded-xl border-slate-200 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Customers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tighter">{customers.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg. Spend</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tighter">
              {formatPrice(customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpend, 0) / customers.length : 0)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Returning</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tighter">
              {customers.filter(c => c.totalOrders > 1).length}
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
                <th className="px-8 py-5">Orders</th>
                <th className="px-8 py-5">Total Value</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">No customers found matching your search.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/customers/${customer.phone}`)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px] uppercase shadow-sm">
                          {customer.name.substring(0, 2)}
                        </div>
                        <p className="font-black text-slate-900 uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{customer.name}</p>
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
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                          {customer.totalOrders} Drops
                        </span>
                        {customer.totalSpend >= 100000 ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 animate-pulse">
                                <Gem className="h-3 w-3" /> Diamond
                            </span>
                        ) : customer.totalSpend >= 50000 ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                <Crown className="h-3 w-3" /> Gold
                            </span>
                        ) : customer.totalSpend >= 20000 ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
                                <Star className="h-3 w-3" /> Silver
                            </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900">
                      {formatPrice(customer.totalSpend)}
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
