'use client';

import * as React from 'react';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Zap,
    Image as ImageIcon,
    Tag,
    FileText,
    DollarSign,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Camera,
    Box
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProposeGadget() {
    const { supplier_id, email } = useAdmin();
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        category: 'electronics',
        price: '',
        cost_price: '',
        stock: '1',
        description: '',
        image_url: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !supplier_id) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('products')
                .insert([{
                    ...formData,
                    price: parseFloat(formData.price),
                    cost_price: parseFloat(formData.cost_price),
                    stock: parseInt(formData.stock),
                    status: 'Pending',
                    supplier_id: supplier_id,
                    is_new: true,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert("Submission failed. Check network.");
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Proposal Transmitted</h2>
                <p className="text-slate-500 font-medium italic">Your gadget has been logged. Admin review will commence shortly.</p>
            </div>
            <div className="flex gap-4">
                <Button onClick={() => setSuccess(false)} variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest">Submit Another</Button>
                <Link href="/supplier">
                    <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Back to Command</Button>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 text-left">
            <header className="border-b border-slate-200 pb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Plus size={16} /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">New Proposal</span>
                </div>
                <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Propose Gadget</h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Upload technical specs and media for administrative approval.</p>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <Card className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Specs</h3>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground ml-1">Product Name</label>
                            <div className="relative">
                                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. iPhone 17 Pro Max" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 font-bold" />
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-foreground ml-1">Wholesale Cost (KES)</label>
                                <div className="relative">
                                    <Input required type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} placeholder="0.00" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 font-bold" />
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-foreground ml-1">Proposed Retail</label>
                                <div className="relative">
                                    <Input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 font-bold" />
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground ml-1">Initial Stock Units</label>
                            <div className="relative">
                                <Input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 font-bold" />
                                <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Visuals & Intelligence</h3>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground ml-1">Main Image URL</label>
                            <div className="relative">
                                <Input required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 font-medium text-xs" />
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1 italic">Use high-resolution 1:1 aspect ratio images.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-foreground ml-1">Technical Brief</label>
                            <div className="relative">
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter key specifications..."
                                    className="w-full h-32 rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6 text-sm font-medium outline-none focus:border-primary/20 transition-all resize-none"
                                />
                                <FileText className="absolute right-6 top-6 h-5 w-5 text-slate-200" />
                            </div>
                        </div>

                        <Button
                            disabled={loading}
                            className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                                <div className="flex items-center justify-center gap-4">
                                    Establish Proposal <ArrowRight size={20} />
                                </div>
                            )}
                        </Button>
                    </Card>

                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-start gap-4">
                        <Camera size={20} className="text-slate-300 shrink-0 mt-1" />
                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-widest italic">
                            &quot;All proposed products undergo rigorous quality verification by the Apex OS Command Center before being authorized for the live grid.&quot;
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
