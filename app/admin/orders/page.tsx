'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCcw,
  Package,
  Calendar,
  Phone,
  User,
  DollarSign,
  Tag,
  Truck,
  CreditCard
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import products from '@/data/products.json';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';

interface OrderRecord {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  product_id: number | null;
  shoe_id: number | null; // For backwards compatibility
  quantity: number;
  total_price: number;
  status: string;
  payment_method: string;
  note?: string | null;
}

interface ManualOrderForm {
  customer_name: string;
  customer_phone: string;
  product_id: string;
  quantity: string;
  total_price: string;
  status: 'Pending' | 'Dispatched' | 'Delivered' | 'Cancelled';
  payment_method: 'M-Pesa' | 'COD';
  note: string;
}

const statusOptions = ['Pending', 'Dispatched', 'Delivered', 'Cancelled'] as const;
const paymentOptions = ['M-Pesa', 'COD'] as const;

type OrderStatus = (typeof statusOptions)[number];

const initialManualOrder: ManualOrderForm = {
  customer_name: '',
  customer_phone: '',
  product_id: '',
  quantity: '1',
  total_price: '',
  status: 'Pending',
  payment_method: 'M-Pesa',
  note: '',
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'success' | 'error';
    text: string;
  }>({ type: 'idle', text: '' });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isSavingManualOrder, setIsSavingManualOrder] = useState(false);
  const [manualOrder, setManualOrder] = useState<ManualOrderForm>(initialManualOrder);

  const productOptions = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
    }));
  }, []);

  const productNameMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product.name]));
  }, []);

  const loadOrders = async () => {
    if (!supabase) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase is not configured yet.',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all columns
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Order fetch error:', error.message);
        setStatusMessage({
          type: 'error',
          text: error.message || 'Unable to load orders.',
        });
        setOrders([]);
      } else {
        setOrders((data ?? []) as OrderRecord[]);
        setStatusMessage({ type: 'idle', text: '' });
      }
    } catch (err) {
      console.error('Pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const summary = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const pending = orders.filter((order) => order.status === 'Pending').length;
    const delivered = orders.filter((order) => order.status === 'Delivered').length;

    return {
      totalRevenue,
      pending,
      delivered,
    };
  }, [orders]);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    if (!supabase) return;

    setUpdatingId(orderId);
    setStatusMessage({ type: 'idle', text: '' });

    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      const oldStatus = orderToUpdate?.status;

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // Inventory Auto-Sync Logic:
      // Works for both 'product_id' and 'shoe_id' naming
      const currentProductId = orderToUpdate?.product_id || orderToUpdate?.shoe_id;

      if (status === 'Delivered' && oldStatus !== 'Delivered' && currentProductId) {
        // 1. Get current stock
        const { data: productData } = await supabase
          .from('products')
          .select('stock')
          .eq('id', currentProductId)
          .single();

        if (productData) {
          const currentStock = Number(productData.stock || 0);
          const newStock = Math.max(0, currentStock - (orderToUpdate?.quantity || 0));

          // 2. Update stock (defensively)
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', currentProductId);
        }
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
      setStatusMessage({
        type: 'success',
        text: `Order #${orderId} marked as ${status}.`,
      });
    } catch (err: any) {
      console.error('Order update error:', err.message || err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to update order status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) return;

    if (!manualOrder.customer_name.trim() || !manualOrder.customer_phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and phone required.' });
      return;
    }

    const quantity = Number(manualOrder.quantity);
    const totalPrice = Number(manualOrder.total_price);

    if (isNaN(quantity) || quantity <= 0) {
      setStatusMessage({ type: 'error', text: 'Enter a valid quantity.' });
      return;
    }

    if (isNaN(totalPrice) || totalPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Enter a valid total price.' });
      return;
    }

    setIsSavingManualOrder(true);

    const targetProductId = manualOrder.product_id ? Number(manualOrder.product_id) : null;

    // Defensively create data object
    const orderData: any = {
        customer_name: manualOrder.customer_name.trim(),
        customer_phone: manualOrder.customer_phone.trim(),
        quantity,
        total_price: totalPrice,
        status: manualOrder.status,
        payment_method: manualOrder.payment_method,
        note: manualOrder.note.trim() || null,
    };

    // Try to set both column names for compatibility
    if (targetProductId) {
        orderData.product_id = targetProductId;
        orderData.shoe_id = targetProductId;
    }

    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      console.error('Manual order save error:', error.message);

      // If error is about a missing column, try to remove the conflicting ones and retry
      if (error.message.includes('column') && error.message.includes('does not exist')) {
          delete orderData.product_id;
          delete orderData.payment_method; // payment_method might also be missing

          const retry = await supabase.from('orders').insert([orderData]);
          if (!retry.error) {
              await loadOrders();
              setManualOrder(initialManualOrder);
              setStatusMessage({ type: 'success', text: 'Order saved (database partially updated).' });
              setIsSavingManualOrder(false);
              return;
          }
      }

      setStatusMessage({
        type: 'error',
        text: error.message || 'Unable to save manual order.',
      });
      setIsSavingManualOrder(false);
      return;
    }

    await loadOrders();
    setManualOrder(initialManualOrder);
    setStatusMessage({
      type: 'success',
      text: 'Manual order saved.',
    });
    setIsSavingManualOrder(false);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl text-balance">Order Management</h1>
          <p className="text-slate-50 text-sm">Track sales, update shipping status, and log manual entries.</p>
        </div>
        <Button onClick={() => loadOrders()} variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200">
          <RefreshCcw className="h-4 w-4" /> Sync Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 text-left">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Net Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatPrice(summary.totalRevenue)}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 text-left">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Pending Orders</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{summary.pending}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 text-left">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Delivered Total</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{summary.delivered}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Entry Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Log Manual Order
            </h2>
            <form onSubmit={handleManualOrderSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Details</label>
                <Input
                  value={manualOrder.customer_name}
                  onChange={(e) => setManualOrder({...manualOrder, customer_name: e.target.value})}
                  placeholder="Name"
                  className="rounded-xl border-slate-100"
                />
                <Input
                  value={manualOrder.customer_phone}
                  onChange={(e) => setManualOrder({...manualOrder, customer_phone: e.target.value})}
                  placeholder="Phone Number"
                  className="rounded-xl border-slate-100 mt-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</label>
                <select
                  className="w-full rounded-xl border border-slate-100 bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  value={manualOrder.product_id}
                  onChange={(e) => setManualOrder({...manualOrder, product_id: e.target.value})}
                >
                  <option value="">Manual / Not Linked</option>
                  {productOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</label>
                  <Input
                    type="number"
                    value={manualOrder.quantity}
                    onChange={(e) => setManualOrder({...manualOrder, quantity: e.target.value})}
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Price</label>
                  <Input
                    type="number"
                    value={manualOrder.total_price}
                    onChange={(e) => setManualOrder({...manualOrder, total_price: e.target.value})}
                    placeholder="KES"
                    className="rounded-xl border-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment & Status</label>
                <div className="grid grid-cols-2 gap-2">
                   <select
                    className="rounded-xl border border-slate-100 bg-background px-3 py-2 text-sm text-foreground outline-none"
                    value={manualOrder.payment_method}
                    onChange={(e) => setManualOrder({...manualOrder, payment_method: e.target.value as any})}
                  >
                    {paymentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    className="rounded-xl border border-slate-100 bg-background px-3 py-2 text-sm text-foreground outline-none"
                    value={manualOrder.status}
                    onChange={(e) => setManualOrder({...manualOrder, status: e.target.value as any})}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={isSavingManualOrder} className="w-full rounded-xl py-6 font-bold shadow-lg mt-4">
                {isSavingManualOrder ? 'Saving...' : 'Create Order'}
              </Button>
            </form>
          </div>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-left">
            {isLoading ? (
              <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic">No orders found.</div>
            ) : (
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group text-left">
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <User className="h-3 w-3 text-slate-400" /> {order.customer_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3" /> {order.customer_phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {(order.product_id || order.shoe_id) ? productNameMap.get((order.product_id || order.shoe_id)!) || `Item #${order.product_id || order.shoe_id}` : 'Unlinked Item'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">x{order.quantity} Units — {formatPrice(order.total_price)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {order.payment_method === 'COD' ? <Truck className="h-3 w-3 text-amber-500" /> : <CreditCard className="h-3 w-3 text-indigo-500" />}
                            <span className="font-black text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest">{order.payment_method || 'M-Pesa'}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                            <Calendar className="h-2 w-2" /> {formatDate(order.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <select
                            className={`rounded-lg border-none bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none ring-0 transition-colors ${
                              order.status === 'Delivered' ? 'text-emerald-600 bg-emerald-50' :
                              order.status === 'Pending' ? 'text-amber-600 bg-amber-50' :
                              order.status === 'Cancelled' ? 'text-rose-600 bg-rose-50' :
                              'text-indigo-600 bg-indigo-50'
                            }`}
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                            disabled={updatingId === order.id}
                          >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`fixed bottom-8 right-8 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 font-bold text-sm ${
          statusMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
