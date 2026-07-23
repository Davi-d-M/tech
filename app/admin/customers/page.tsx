'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Phone,
  ShoppingBag,
  DollarSign,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerStats>();

    orders.forEach((order) => {
      const key = order.customer_phone.trim();
      const existing = map.get(key);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpend += Number(order.total_price || 0);
      } else {
        map.set(key, {
          name: order.customer_name,
          phone: order.customer_phone,
          totalOrders: 1,
          totalSpend: Number(order.total_price || 0),
          lastOrder: order.created_at,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [customers, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Customer Directory</h1>
          <p className="text-slate-500 text-sm">Track your most loyal shoppers and their purchase history.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10 rounded-xl border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Total Customers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{customers.length}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Avg. Spend per Customer</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatPrice(customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpend, 0) / customers.length : 0)}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Returning Shoppers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {customers.filter(c => c.totalOrders > 1).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total Value</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">No customers found matching your search.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                          {customer.name.substring(0, 2)}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500 flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-tight">
                        {customer.totalOrders} Purchases
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                      {formatPrice(customer.totalSpend)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/admin/orders">
                        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold text-primary flex items-center gap-2">
                          History <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
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
