'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrderRecord {
  id: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
}

interface ProductRecord {
  id: number;
  stock: number;
  name: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = useMemo(() => Boolean(supabase), []);

  useEffect(() => {
    async function loadStats() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('id, total_price, status, created_at, customer_name').order('created_at', { ascending: false }),
          supabase.from('products').select('id, stock, name')
        ]);

        if (ordersRes.data) setOrders(ordersRes.data as OrderRecord[]);
        if (productsRes.data) setProducts(productsRes.data as ProductRecord[]);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const lowStockItems = products.filter(p => p.stock <= 5).length;
    const totalCustomers = new Set(orders.map(o => o.customer_name)).size;

    return {
      totalRevenue,
      pendingOrders,
      lowStockItems,
      totalCustomers
    };
  }, [orders, products]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back! Here's what's happening at Apexstores today.</p>
        </div>
        <Link href="/admin/upload">
          <Button className="rounded-xl shadow-lg bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 text-amber-800">
          <ShieldAlert className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold text-sm">Database Not Connected</p>
            <p className="text-xs opacity-90">Please add your Supabase keys to <code className="bg-amber-100 px-1 rounded">.env.local</code> to see real sales data.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatPrice(stats.totalRevenue)}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
            Verified Sales
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-4">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Orders</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.pendingOrders}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Requires attention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Customers</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalCustomers}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Lifetime shoppers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Low Stock</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.lowStockItems} Items</h3>
          <p className="text-[10px] text-rose-500 font-bold mt-2">Restock suggested</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {!isConfigured ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Connect your database to see orders.</td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No orders yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-left">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{order.customer_name}</p>
                        <p className="text-[10px] text-slate-500">Order #{order.id}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                        {formatPrice(order.total_price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/admin/orders">
                          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-left">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inventory Alerts</h2>
          </div>
          <div className="p-6 space-y-4">
            {!isConfigured ? (
              <p className="text-sm text-slate-400 font-medium italic text-center">Database not synced.</p>
            ) : products.filter(p => p.stock <= 5).length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">All items well stocked!</p>
              </div>
            ) : (
              products.filter(p => p.stock <= 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-0.5">{product.stock} left in stock</p>
                  </div>
                  <Link href="/admin/upload">
                    <Button size="sm" className="h-7 px-3 text-[10px] font-black uppercase bg-slate-900 text-white hover:bg-slate-800">Restock</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
