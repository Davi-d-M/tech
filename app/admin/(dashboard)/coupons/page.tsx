'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Coupon {
  id: number;
  code: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
}

const initialForm = {
  code: '',
  discount_percent: '',
  is_active: true
};

export default function AdminCouponsPage() {
  // const { email: adminEmail } = useAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCoupons = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !form.code || !form.discount_percent) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('coupons')
        .insert([{
            code: form.code.trim().toUpperCase(),
            discount_percent: Number(form.discount_percent),
            is_active: form.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      // await logAuditAction(adminEmail, 'CREATE_COUPON', { code: form.code });
      setMessage({ type: 'success', text: `Coupon ${form.code} created!` });
      setForm(initialForm);
      fetchCoupons();
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
      if (!supabase) return;
      try {
          const { error } = await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
          if (error) throw error;
          setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      } catch (err) {
          console.error(err);
      }
  };

  const deleteCoupon = async (id: number, code: string) => {
      if (!supabase || !confirm(`Delete coupon ${code}?`)) return;
      try {
          const { error } = await supabase.from('coupons').delete().eq('id', id);
          if (error) throw error;
          // await logAuditAction(adminEmail, 'DELETE_COUPON', { code });
          setCoupons(coupons.filter(c => c.id !== id));
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter text-left">Gift & Coupons</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Generate discount codes to drive sales and reward loyal customers.</p>
        </div>
        <Button onClick={fetchCoupons} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all">
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">

          <div className="lg:col-span-1">
              <Card className="rounded-[3rem] border border-slate-100 shadow-sm p-10 bg-white space-y-10">
                  <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-4">
                      <Plus className="h-5 w-5 text-primary" /> New Coupon
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6 text-left">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Coupon Code</label>
                          <Input
                            value={form.code}
                            onChange={e => setForm({...form, code: e.target.value})}
                            placeholder="e.g. WELCOME10"
                            className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-black uppercase"
                            required
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Discount Percentage (%)</label>
                          <Input
                            type="number"
                            value={form.discount_percent}
                            onChange={e => setForm({...form, discount_percent: e.target.value})}
                            placeholder="10"
                            className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-bold"
                            required
                          />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={e => setForm({...form, is_active: e.target.checked})}
                            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="is_active" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer text-left">Enable Immediately</label>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 mt-4 transition-all hover:scale-105 active:scale-95">
                          {isSubmitting ? 'Generating...' : 'Create Coupon'}
                      </Button>
                  </form>
                  {message && (
                      <p className={cn("text-center mt-6 text-[10px] font-black uppercase", message.type === 'success' ? 'text-primary' : 'text-primary')}>{message.text}</p>
                  )}
              </Card>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Ticket className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Active Vouchers</h2>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{coupons.length} Coupons</span>
                  </div>

                  {loading ? (
                      <div className="p-32 text-center flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                          <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Checking Vault...</p>
                      </div>
                  ) : coupons.length === 0 ? (
                      <div className="p-32 text-center flex flex-col items-center gap-6">
                          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-100"><Tag className="h-10 w-10" /></div>
                          <p className="text-lg font-black text-slate-300 uppercase tracking-tight italic">No active coupons found, bro.</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                                      <th className="px-10 py-6">Code</th>
                                      <th className="px-10 py-6 text-center">Discount</th>
                                      <th className="px-10 py-6 text-center">Status</th>
                                      <th className="px-10 py-6 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {coupons.map(coupon => (
                                      <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors group">
                                          <td className="px-10 py-8">
                                              <div className="flex items-center gap-4">
                                                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                                                      %
                                                  </div>
                                                  <div>
                                                      <span className="font-black text-foreground uppercase text-sm tracking-widest block">{coupon.code}</span>
                                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block italic">Created {new Date(coupon.created_at).toLocaleDateString()}</span>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-10 py-8 text-center">
                                              <span className="text-lg font-black text-primary">-{coupon.discount_percent}%</span>
                                          </td>
                                          <td className="px-10 py-8 text-center">
                                              <button onClick={() => toggleStatus(coupon.id, coupon.is_active)}>
                                                  {coupon.is_active ? (
                                                      <span className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                                                          <CheckCircle2 className="h-3 w-3" /> Active
                                                      </span>
                                                  ) : (
                                                      <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                                          <XCircle className="h-3 w-3" /> Paused
                                                      </span>
                                                  )}
                                              </button>
                                          </td>
                                          <td className="px-10 py-8 text-right">
                                              <Button
                                                onClick={() => deleteCoupon(coupon.id, coupon.code)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-2xl text-slate-200 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-100"
                                              >
                                                  <Trash2 className="h-5 w-5" />
                                              </Button>
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
    </div>
  );
}
