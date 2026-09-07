'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Phone, Package, DollarSign, FileText, Send, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function LeadGenerator({ affiliateId }: { affiliateId: string }) {
    const [loading, setLoading] = React.useState(false);
    const [products, setProducts] = React.useState<{ id: number; name: string }[]>([]);
    const [form, setForm] = React.useState({
        customer_name: '',
        customer_phone: '',
        product_id: '',
        budget: '',
        notes: ''
    });

    React.useEffect(() => {
        async function fetchProducts() {
            if (!supabase) return;
            const { data } = await supabase.from('products').select('id, name').limit(50);
            if (data) setProducts(data);
        }
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase!
                .from('affiliate_leads')
                .insert([{
                    affiliate_id: affiliateId,
                    customer_name: form.customer_name,
                    customer_phone: form.customer_phone,
                    interested_product_id: form.product_id ? Number(form.product_id) : null,
                    budget: form.budget ? Number(form.budget) : null,
                    notes: form.notes
                }]);

            if (error) throw error;
            alert("Lead Captured! Our sales team will follow up and attribute any sale to you. 🚀");
            setForm({ customer_name: '', customer_phone: '', product_id: '', budget: '', notes: '' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Target size={24} /></div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Lead Generator</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Submit potential customers for team follow-up.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Customer Name</label>
                    <div className="relative">
                        <Input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12" placeholder="Full Name" />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mobile Contact</label>
                    <div className="relative">
                        <Input value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12" placeholder="07XXXXXXXX" />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Interested Gadget</label>
                    <div className="relative">
                        <select
                            value={form.product_id}
                            onChange={e => setForm({...form, product_id: e.target.value})}
                            className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-12 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                        >
                            <option value="">General Interest</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Customer Budget (KES)</label>
                    <div className="relative">
                        <Input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12" placeholder="e.g. 25000" />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Additional Intelligence (Notes)</label>
                    <div className="relative">
                        <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-100 p-5 pl-12 font-medium italic" placeholder="Customer is looking for original AirPods Pro with warranty..." />
                        <FileText className="absolute left-4 top-5 h-5 w-5 text-slate-300" />
                    </div>
                </div>
                <Button type="submit" disabled={loading} className="sm:col-span-2 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <><Send className="h-4 w-4 mr-2" /> Launch Lead Tracking</>}
                </Button>
            </form>
        </Card>
    );
}
