'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Store,
    User,
    Phone,
    Mail,
    Layers,
    Users,
    MapPin,
    TrendingUp,
    CheckCircle2,
    Rocket,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function RetailerApplicationPage() {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [form, setForm] = React.useState({
        business_name: '',
        owner_name: '',
        phone: '',
        email: '',
        business_type: 'Electronics',
        employee_count: '1',
        branch_count: '1',
        monthly_orders: '0-100',
        current_system: 'WhatsApp'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('onboarding_applications').insert([{
                ...form,
                employee_count: parseInt(form.employee_count),
                branch_count: parseInt(form.branch_count),
                verification_status: 'Pending',
                risk_score: 10 // Baseline
            }]);

            if (error) throw error;
            setSubmitted(true);
        } catch (e) {
            console.error(e);
            alert("Mission Failure: Unable to transmit application. Check connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-inner">
                        <CheckCircle2 size={48} className="animate-bounce" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Application Transmitted</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Your business data has been uploaded to the Apex Grid. Our intelligence team will verify your credentials within 24 hours.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-left">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>Verification Protocol Active</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-600">Reference: APX-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                    <Link href="/">
                        <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20">Return to HQ</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Brand Sidebar */}
            <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <Store className="h-8 w-8" />
                        <span className="text-2xl font-black uppercase tracking-tighter">Apex OS</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-6">Run Your Entire Operation.</h1>
                    <p className="text-white/80 font-medium text-lg max-w-sm">
                        Provision a specialized digital environment for your business, riders, and staff in one click.
                    </p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg"><Rocket size={20} /></div>
                        <p className="text-xs font-black uppercase tracking-widest">Instant Tenant Provisioning</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg"><Users size={20} /></div>
                        <p className="text-xs font-black uppercase tracking-widest">Multi-Role Fleet Management</p>
                    </div>
                </div>

                <Store className="absolute -bottom-20 -right-20 h-96 w-96 text-white/10 rotate-12" />
            </div>

            {/* Application Form */}
            <div className="flex-1 p-8 md:p-24 overflow-y-auto no-scrollbar">
                <div className="max-w-2xl mx-auto space-y-12 text-left">
                    <header className="space-y-4">
                        <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">Business Application</h2>
                        <p className="text-slate-500 font-medium">Join the Apex Grid. Complete the form to initiate organization provisioning.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Identity */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-slate-100 pb-2">Business Identity</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Store size={12} /> Business Name</label>
                                    <Input required value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} placeholder="Online Bar Electronics" className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><User size={12} /> Owner Full Name</label>
                                    <Input required value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} placeholder="David Maganga" className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Phone size={12} /> Contact Phone</label>
                                    <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="07XXXXXXXX" className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Mail size={12} /> Email Address</label>
                                    <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="david@apexstores.ke" className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Scale */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary border-b border-slate-100 pb-2">Operational Scale</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Layers size={12} /> Business Type</label>
                                    <select value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})} className="w-full h-14 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>Electronics</option>
                                        <option>Fashion</option>
                                        <option>Pharmacy</option>
                                        <option>Grocery</option>
                                        <option>Wholesale</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Users size={12} /> Employees</label>
                                    <Input type="number" value={form.employee_count} onChange={e => setForm({...form, employee_count: e.target.value})} className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><MapPin size={12} /> Branches</label>
                                    <Input type="number" value={form.branch_count} onChange={e => setForm({...form, branch_count: e.target.value})} className="h-14 rounded-xl bg-white border-slate-200 font-bold" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><TrendingUp size={12} /> Monthly Orders</label>
                                    <select value={form.monthly_orders} onChange={e => setForm({...form, monthly_orders: e.target.value})} className="w-full h-14 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>0-100</option>
                                        <option>100-500</option>
                                        <option>500-1,000</option>
                                        <option>1,000-5,000</option>
                                        <option>5,000+</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Layers size={12} /> Current System</label>
                                    <select value={form.current_system} onChange={e => setForm({...form, current_system: e.target.value})} className="w-full h-14 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>WhatsApp / Phone</option>
                                        <option>Excel / Manual</option>
                                        <option>Legacy POS</option>
                                        <option>Shopify / E-commerce</option>
                                        <option>None</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Deploy My Organization"}
                        </Button>
                    </form>

                    <footer className="pt-12 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">
                            Apex OS v1.0 &bull; Deployment Grid Kenya
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
