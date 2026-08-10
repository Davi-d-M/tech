'use client';

import * as React from 'react';
import {
  Plus,
  RefreshCcw,
  Package,
  Phone,
  User,
  DollarSign,
  Tag,
  FileDown,
  MessageSquareShare,
  Table,
  Link2,
  Search,
  ShieldAlert,
  Navigation,
  CheckSquare,
  Square
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, cn } from '@/lib/utils';
import { generateReceiptPDF, getWhatsAppReceiptLink } from '@/lib/receiptService';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface OrderRecord {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  product_id: number | null;
  shoe_id: number | null; // For backwards compatibility
  quantity: number;
  total_price: number;
  status: string;
  payment_method: string;
  size?: string; // Captures the specific variant name
  note?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  captured_by?: string;
}

interface ManualOrderForm {
  customer_name: string;
  customer_phone: string;
  product_id: string;
  quantity: string;
  total_price: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  note: string;
}

const statusOptions = ['Pending', 'Paid', 'Dispatched', 'Delivered', 'Cancelled', 'Payment Failed'] as const;
const paymentOptions = ['M-Pesa', 'COD', 'Paystack'] as const;

type OrderStatus = (typeof statusOptions)[number];
type PaymentMethod = (typeof paymentOptions)[number];

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

export default function AdminOrdersPage() {
  const { role, email } = useAdmin();
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [products, setProducts] = React.useState<{ id: number; name: string; price: number; cost_price: number; stock: number; variant_stock: Record<string, number> }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: 'idle' | 'success' | 'error';
    text: string;
  }>({ type: 'idle', text: '' });
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSavingManualOrder, setIsSavingManualOrder] = React.useState(false);
  const [manualOrder, setManualOrder] = React.useState<ManualOrderForm>(initialManualOrder);
  const [selectedOrders, setSelectedOrders] = React.useState<number[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [assigningRiderId, setAssigningRiderId] = React.useState<number | null>(null);
  const [riderForm, setRiderForm] = React.useState({ name: '', phone: '' });

  const canManageOrders = role === 'staff' || role === 'admin' || role === 'owner';
  const canSeeMoney = role === 'staff' || role === 'admin' || role === 'owner';

  const productOptions = React.useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
    }));
  }, [products]);

  const productNameMap = React.useMemo(() => {
    return new Map(products.map((product) => [product.id, product.name]));
  }, [products]);

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
      const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('id, name, price, cost_price, stock, variant_stock')
      ]);

      if (ordersRes.error) throw ordersRes.error;

      setOrders((ordersRes.data ?? []) as OrderRecord[]);
      setProducts((productsRes.data ?? []) as { id: number; name: string; price: number; cost_price: number; stock: number; variant_stock: Record<string, number> }[]);
      setStatusMessage({ type: 'idle', text: '' });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Pipeline error:', error);
      setStatusMessage({ type: 'error', text: error.message || 'Unable to load orders.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = React.useMemo(() => {
      return orders.filter(o =>
          (o.customer_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
          (o.customer_phone || '').includes(searchQuery) ||
          (o.id || '').toString().includes(searchQuery)
      );
  }, [orders, searchQuery]);

  React.useEffect(() => {
    loadOrders();
  }, []);

  const summary = React.useMemo(() => {
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
    if (!supabase || !canManageOrders) return;

    setUpdatingId(orderId);
    setStatusMessage({ type: 'idle', text: '' });

    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      const oldStatus = orderToUpdate?.status;

      const updatePayload: Partial<OrderRecord> & { note?: string } = { status };

      if (status === 'Paid') {
          updatePayload.note = `Status manually updated to Paid by ${email || 'Admin'}`;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (error) {
          if (error.message.includes("note") || error.message.includes("schema")) {
              delete updatePayload.note;
              const { error: retryError } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
              if (retryError) throw retryError;
          } else {
              throw error;
          }
      }

      await logAuditAction(email, 'UPDATE_ORDER_STATUS', { id: orderId, newStatus: status });

      const currentProductId = orderToUpdate?.product_id || orderToUpdate?.shoe_id;

      if (status === 'Delivered' && oldStatus !== 'Delivered' && currentProductId) {
        const { data: productData } = await supabase
          .from('products')
          .select('stock, variant_stock')
          .eq('id', currentProductId)
          .single();

        if (productData) {
          const qty = orderToUpdate?.quantity || 1;
          const currentStock = Number(productData.stock || 0);
          const newStock = Math.max(0, currentStock - qty);

          let updatedVariantStock = productData.variant_stock || {};
          if (orderToUpdate?.size && updatedVariantStock[orderToUpdate.size] !== undefined) {
              const currentVStock = Number(updatedVariantStock[orderToUpdate.size] || 0);
              updatedVariantStock = { ...updatedVariantStock, [orderToUpdate.size]: Math.max(0, currentVStock - qty) };

              await supabase
                .from('products')
                .update({
                    stock: newStock,
                    variant_stock: updatedVariantStock
                })
                .eq('id', currentProductId);
          } else {
              await supabase
                .from('products')
                .update({
                    stock: newStock
                })
                .eq('id', currentProductId);
          }

          if (newStock <= 3) {
              fetch('/api/admin/notify-admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      type: 'LOW_STOCK',
                      details: {
                          productName: orderToUpdate?.customer_name ? productNameMap.get(currentProductId) : 'A Product',
                          currentStock: newStock
                      }
                  })
              }).catch(e => console.error("Low stock notify error:", e));
          }
        }
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      if (status === 'Dispatched' || status === 'Delivered') {
          const currentOrder = orders.find(o => o.id === orderId);
          if (currentOrder?.customer_email) {
              fetch('/api/admin/notify-customer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      email: currentOrder.customer_email,
                      orderId: currentOrder.id,
                      status: status,
                      name: currentOrder.customer_name
                  })
              });
          }
      }

      setStatusMessage({
        type: 'success',
        text: `Order #${orderId} marked as ${status}.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Order update error:', error.message || error);
      setStatusMessage({
        type: 'error',
        text: error.message || 'Unable to update order status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadReceipt = async (order: OrderRecord) => {
      const productName = order.product_id ? productNameMap.get(order.product_id) : 'Gadget';
      const doc = await generateReceiptPDF({...order, product_name: productName} as Parameters<typeof generateReceiptPDF>[0]);
      doc.save(`Receipt_Apexstores_${order.id}.pdf`);
  };

  const handleShareOnWhatsApp = (order: OrderRecord) => {
      const link = getWhatsAppReceiptLink(order as Parameters<typeof getWhatsAppReceiptLink>[0]);
      window.open(link, '_blank');
  };

  const copyTrackingLink = (orderId: number) => {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/track?id=${orderId}`;
      navigator.clipboard.writeText(link);
      setStatusMessage({ type: 'success', text: 'Tracking link copied to clipboard!' });
  };

  const copyRiderLink = (orderId: number) => {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/dispatch/${orderId}`;
      navigator.clipboard.writeText(link);
      setStatusMessage({ type: 'success', text: 'Rider dispatch link copied!' });
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Total', 'Status', 'Payment Method'];
    const rows = orders.map(o => [
        o.id,
        new Date(o.created_at).toLocaleDateString(),
        o.customer_name,
        o.customer_phone,
        o.total_price,
        o.status,
        o.payment_method
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Apexstores_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !canManageOrders) return;

    if (!manualOrder.customer_name.trim() || !manualOrder.customer_phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Name and phone required.' });
      return;
    }

    const quantity = Number(manualOrder.quantity);
    const totalPrice = Number(manualOrder.total_price);

    if (isNaN(quantity) || quantity <= 0 || isNaN(totalPrice) || totalPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Enter valid numeric values.' });
      return;
    }

    setIsSavingManualOrder(true);
    const targetProductId = manualOrder.product_id ? Number(manualOrder.product_id) : null;

    const orderData: Record<string, unknown> = {
        customer_name: manualOrder.customer_name.trim(),
        customer_phone: manualOrder.customer_phone.trim(),
        quantity,
        total_price: totalPrice,
        status: manualOrder.status,
        payment_method: manualOrder.payment_method,
        note: manualOrder.note.trim() || null,
        product_id: targetProductId,
        captured_by: email || 'system'
    };

    const { error } = await supabase.from('orders').insert([orderData]);

    if (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Unable to save order.' });
      setIsSavingManualOrder(false);
      return;
    }

    await loadOrders();
    setManualOrder(initialManualOrder);
    setStatusMessage({ type: 'success', text: 'Manual order saved.' });
    setIsSavingManualOrder(false);
  };

  const toggleOrderSelection = (id: number) => {
      setSelectedOrders(prev =>
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
      if (selectedOrders.length === 0 || !supabase) return;
      setIsBulkUpdating(true);
      try {
          const { error } = await supabase
              .from('orders')
              .update({ status })
              .in('id', selectedOrders);

          if (error) throw error;

          await logAuditAction(email, 'BULK_UPDATE_ORDERS', { count: selectedOrders.length, newStatus: status });

          setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, status } : o));
          setSelectedOrders([]);
          setStatusMessage({ type: 'success', text: `Successfully updated ${selectedOrders.length} orders.` });
      } catch (err: unknown) {
          const error = err as Error;
          setStatusMessage({ type: 'error', text: error.message });
      } finally {
          setIsBulkUpdating(false);
      }
  };

  const handleAssignRider = async (orderId: number) => {
      if (!supabase || !riderForm.name || !riderForm.phone) return;
      try {
          const { error } = await supabase
              .from('orders')
              .update({
                  rider_name: riderForm.name.trim(),
                  rider_phone: riderForm.phone.trim(),
                  status: 'Dispatched'
              })
              .eq('id', orderId);

          if (error) throw error;

          await logAuditAction(email, 'ASSIGN_RIDER', { id: orderId, rider: riderForm.name });

          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rider_name: riderForm.name, rider_phone: riderForm.phone, status: 'Dispatched' } : o));
          setAssigningRiderId(null);
          setRiderForm({ name: '', phone: '' });
          setStatusMessage({ type: 'success', text: 'Rider assigned and order dispatched!' });
      } catch (err: unknown) {
          const error = err as Error;
          setStatusMessage({ type: 'error', text: error.message });
      }
  };

  if (!canManageOrders && role !== 'owner') {
      return (
          <div className="p-24 flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-16 w-16 text-primary mb-6" />
              <h2 className="text-2xl font-black uppercase text-foreground">Access Denied</h2>
              <p className="text-slate-500 mt-2">You don&apos;t have permission to manage orders, bro.</p>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl text-balance uppercase tracking-tighter">Order Control</h1>
          <p className="text-slate-500 text-sm font-medium">Manage dispatch status and generate customer receipts.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200 bg-white">
                <Table className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => loadOrders()} variant="outline" className="rounded-xl flex items-center gap-2 border-slate-200 bg-white">
                <RefreshCcw className="h-4 w-4" /> Sync Data
            </Button>
        </div>
      </div>

      <div className="relative">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or order ID..."
            className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 text-left group hover:shadow-xl transition-all">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Net Revenue</p>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">
                {canSeeMoney ? formatPrice(summary.totalRevenue) : 'HIDDEN'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 text-left group hover:shadow-xl transition-all">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Pending Orders</p>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{summary.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 text-left group hover:shadow-xl transition-all">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Delivered Total</p>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{summary.delivered}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-8">
            <h2 className="text-lg font-black text-foreground mb-8 flex items-center gap-2 uppercase tracking-tighter">
              <Plus className="h-5 w-5 text-primary" /> Log Manual Order
            </h2>
            <form onSubmit={handleManualOrderSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Details</label>
                <Input
                  value={manualOrder.customer_name}
                  onChange={(e) => setManualOrder({...manualOrder, customer_name: e.target.value})}
                  placeholder="Full Name"
                  className="rounded-2xl border-slate-100 bg-slate-50/50 h-12"
                />
                <Input
                  value={manualOrder.customer_phone}
                  onChange={(e) => setManualOrder({...manualOrder, customer_phone: e.target.value})}
                  placeholder="07XXXXXXXX"
                  className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 mt-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product</label>
                <select
                  className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 text-sm font-bold uppercase tracking-widest outline-none"
                  value={manualOrder.product_id}
                  onChange={(e) => setManualOrder({...manualOrder, product_id: e.target.value})}
                >
                  <option value="">Manual Entry</option>
                  {productOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Qty</label>
                  <Input
                    type="number"
                    value={manualOrder.quantity}
                    onChange={(e) => setManualOrder({...manualOrder, quantity: e.target.value})}
                    className="rounded-2xl border-slate-100 bg-slate-50/50 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Ksh</label>
                  <Input
                    type="number"
                    value={manualOrder.total_price}
                    onChange={(e) => setManualOrder({...manualOrder, total_price: e.target.value})}
                    placeholder="KES"
                    className="rounded-2xl border-slate-100 bg-slate-50/50 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status & Method</label>
                <div className="grid grid-cols-2 gap-2">
                   <select
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 h-12 px-3 text-xs font-black uppercase tracking-widest outline-none"
                    value={manualOrder.payment_method}
                    onChange={(e) => setManualOrder({...manualOrder, payment_method: e.target.value as PaymentMethod})}
                  >
                    {paymentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 h-12 px-3 text-xs font-black uppercase tracking-widest outline-none"
                    value={manualOrder.status}
                    onChange={(e) => setManualOrder({...manualOrder, status: e.target.value as OrderStatus})}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={isSavingManualOrder} className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 mt-4 hover:bg-primary/90 transition-all active:scale-95">
                {isSavingManualOrder ? 'Processing...' : 'Create Order'}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-left flex flex-col min-h-[600px]">
            {selectedOrders.length > 0 && (
                <div className="bg-white/90 backdrop-blur-2xl p-6 flex items-center justify-between z-30 animate-in slide-in-from-top-2 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4 ml-4">
                        <div className="h-2 w-2 rounded-full bg-primary animate-ping"></div>
                        <p className="text-[11px] font-black uppercase text-foreground tracking-[0.2em]">{selectedOrders.length} Orders Selected</p>
                    </div>
                    <div className="flex gap-3">
                        {statusOptions.map(s => (
                            <Button
                                key={s}
                                size="sm"
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkStatusUpdate(s)}
                                className="h-10 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-foreground font-black uppercase text-[9px] tracking-widest border border-slate-100 transition-all hover:scale-105 active:scale-95"
                            >
                                Set {s}
                            </Button>
                        ))}
                        <Button
                            onClick={() => setSelectedOrders([])}
                            variant="ghost"
                            className="h-10 px-4 text-slate-400 hover:text-rose-600 text-[9px] font-black uppercase tracking-widest transition-colors active:scale-95"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {isLoading ? (
              <div className="p-24 flex flex-col items-center gap-4 flex-1">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Checking Log...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic flex-1">No matching orders found.</div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                        <th className="px-6 py-5 w-10">
                            <button onClick={() => {
                                if (selectedOrders.length === filteredOrders.length) {
                                    setSelectedOrders([]);
                                } else {
                                    setSelectedOrders(filteredOrders.map(o => o.id));
                                }
                            }}>
                                {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-slate-200" />}
                            </button>
                        </th>
                        <th className="px-8 py-5">Customer</th>
                        <th className="px-8 py-5">Gadget</th>
                        <th className="px-8 py-5">Admin</th>
                        {canSeeMoney && <th className="px-8 py-5">Profit</th>}
                        <th className="px-8 py-5">Pipeline</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredOrders.map((order) => {
                            const unitCost = products.find(p => p.id === order.product_id)?.cost_price || 0;
                            const profit = Number(order.total_price) - (Number(unitCost) * (order.quantity || 1));
                            const isSelected = selectedOrders.includes(order.id);

                            return (
                            <tr key={order.id} className={cn(
                                "hover:bg-primary/5 transition-all group text-left relative",
                                isSelected && "bg-primary/5"
                            )}>
                                <td className="px-6 py-6">
                                    <button onClick={() => toggleOrderSelection(order.id)}>
                                        {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-slate-200" />}
                                    </button>
                                </td>
                                <td className="px-8 py-6">
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-foreground flex items-center gap-2 uppercase text-xs tracking-tight">
                                    <User className="h-3 w-3 text-slate-300" /> {order.customer_name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                    <Phone className="h-3 w-3" /> {order.customer_phone}
                                    </span>
                                </div>
                                </td>
                                <td className="px-8 py-6">
                                <div className="flex flex-col text-left min-w-[150px]">
                                    <span className="font-black text-foreground uppercase text-[11px] truncate">
                                    {(order.product_id || order.shoe_id) ? productNameMap.get((order.product_id || order.shoe_id)!) || `Item #${order.product_id || order.shoe_id}` : 'Manual Entry'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                        x{order.quantity} Units {order.size && `(${order.size})`} â€” {formatPrice(order.total_price)}
                                    </span>
                                </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                                        (order as OrderRecord & { captured_by?: string }).captured_by === 'system' ? "bg-slate-50 text-slate-400" : "bg-primary/10 text-primary border border-primary/10"
                                    )}>
                                        {(order as OrderRecord & { captured_by?: string }).captured_by?.split('@')[0] || 'System'}
                                    </span>
                                </td>
                                {canSeeMoney && (
                                    <td className="px-8 py-6 font-black text-primary">
                                        {formatPrice(profit)}
                                    </td>
                                )}
                                <td className="px-8 py-6 text-left">
                                <div className="flex flex-col gap-2">
                                    <select
                                        className="rounded-xl border-none px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none ring-0 transition-all cursor-pointer text-primary bg-primary/10 hover:bg-primary/20"
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                        disabled={updatingId === order.id}
                                    >
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>

                                    {order.status !== 'Delivered' && (
                                        <button
                                            onClick={() => {
                                                setAssigningRiderId(order.id);
                                                setRiderForm({ name: order.rider_name || '', phone: order.rider_phone || '' });
                                            }}
                                            className="text-[8px] font-black uppercase text-primary hover:underline text-left pl-1"
                                        >
                                            {order.rider_name ? `Rider: ${order.rider_name}` : 'Assign Rider'}
                                        </button>
                                    )}
                                </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-xl text-slate-400 hover:text-primary transition-all active:scale-95"
                                            onClick={() => handleDownloadReceipt(order)}
                                            title="Download PDF Receipt"
                                        >
                                            <FileDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:shadow-xl text-slate-400 hover:text-primary transition-all active:scale-95"
                                            onClick={() => handleShareOnWhatsApp(order)}
                                            title="Share Receipt on WhatsApp"
                                        >
                                            <MessageSquareShare className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:shadow-xl text-slate-400 hover:text-primary transition-all active:scale-95"
                                            onClick={() => copyTrackingLink(order.id)}
                                            title="Copy Tracking Link"
                                        >
                                            <Link2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:shadow-xl text-slate-400 hover:text-primary transition-all active:scale-95"
                                            onClick={() => copyRiderLink(order.id)}
                                            title="Copy Rider Dispatch Link"
                                        >
                                            <Navigation className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>

                <div className="lg:hidden divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                        const isSelected = selectedOrders.includes(order.id);
                        return (
                            <div key={order.id} className={cn(
                                "p-6 space-y-4 transition-all",
                                isSelected ? "bg-primary/5" : "bg-white"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleOrderSelection(order.id)}>
                                            {isSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-slate-200" />}
                                        </button>
                                        <div>
                                            <p className="font-black text-foreground uppercase text-xs">#{order.id} â€” {order.customer_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{order.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-foreground text-sm">{formatPrice(order.total_price)}</p>
                                        <p className="text-[8px] font-black text-primary uppercase mt-1 tracking-widest">{order.payment_method}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-[9px] font-black uppercase text-slate-400">Pipeline Status</span>
                                    <select
                                        className="h-8 rounded-lg border-none text-[9px] font-black uppercase tracking-widest px-3 outline-none ring-0 text-primary bg-primary/10"
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                    >
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => handleDownloadReceipt(order)} variant="outline" className="flex-1 h-10 rounded-xl text-[8px] font-black uppercase border-slate-100">Receipt</Button>
                                    <Button onClick={() => copyTrackingLink(order.id)} variant="outline" className="flex-1 h-10 rounded-xl text-[8px] font-black uppercase border-slate-100">Track</Button>
                                    <Button onClick={() => handleShareOnWhatsApp(order)} className="flex-1 h-10 rounded-xl bg-primary text-white text-[8px] font-black uppercase shadow-lg">WhatsApp</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {statusMessage.text && (
        <div className="fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-500 font-black uppercase text-[10px] tracking-widest z-[100] bg-primary text-white shadow-primary/20">
          {statusMessage.text}
        </div>
      )}

      {assigningRiderId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-500/10 backdrop-blur-md p-4">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-6">Assign Elite Rider</h3>
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Rider Name</label>
                          <Input value={riderForm.name} onChange={e => setRiderForm({...riderForm, name: e.target.value})} placeholder="e.g. Kelvin" className="rounded-xl h-12 bg-slate-50 border-slate-100" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone (254...)</label>
                          <Input value={riderForm.phone} onChange={e => setRiderForm({...riderForm, phone: e.target.value})} placeholder="07XXXXXXXX" className="rounded-xl h-12 bg-slate-50 border-slate-100" />
                      </div>
                      <div className="flex gap-2 pt-4">
                          <Button onClick={() => handleAssignRider(assigningRiderId!)} className="flex-1 rounded-xl h-12 bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Assign & Dispatch</Button>
                          <Button variant="outline" onClick={() => setAssigningRiderId(null)} className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] border-slate-100">Cancel</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
