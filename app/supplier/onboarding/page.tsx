'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldCheck,
    Store,
    Phone,
    User,
    CreditCard,
    Briefcase,
    Loader2,
    Zap,
    MapPin,
    ArrowRight,
    ArrowLeft,
    Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Step = 'welcome' | 'business' | 'categories' | 'payout' | 'agreement' | 'pending';

export default function SupplierOnboarding() {
    const [step, setStep] = useState<Step>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [businessName, setBusinessName] = useState('');
    const [regNo, setRegNo] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [bankName, setBankName] = useState('');
    const [bankAccName, setBankAccName] = useState('');
    const [bankAccNo, setBankAccNo] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    const availableCategories = [
        'Elite Audio',
        'Super Chargers',
        'Armor Cases',
        'Apex Watches',
        'Elite Cables',
        'Smart Gadgets'
    ];

    const toggleCategory = (cat: string) => {
        setCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSubmit = async () => {
        if (!supabase) return;
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('suppliers')
                .insert([{
                    name: businessName,
                    email: email,
                    phone: phone,
                    business_registration_no: regNo,
                    location: location,
                    categories: categories,
                    bank_name: bankName,
                    bank_account_name: bankAccName,
                    bank_account_no: bankAccNo,
                    terms_accepted: termsAccepted,
                    verification_status: 'UnderReview',
                    is_active: false
                }]);

            if (insertError) throw insertError;

            setStep('pending');
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Onboarding failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-6 selection:bg-primary/20 text-left">
            <div className="max-w-xl w-full space-y-8 lg:space-y-12 animate-in fade-in duration-700">

                {/* 🛡️ BRANDING */}
                <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto shadow-sm border border-indigo-100">
                        <Briefcase className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">Apex <span className="text-primary italic">Partner</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Scale • Supply • Settle</p>
                    </div>
                </div>

                <Card className="p-8 lg:p-12 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">

                        {step === 'welcome' && (
                            <div className="space-y-10 text-center animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Expand Your <br/> Business Horizon</h2>
                                    <p className="text-slate-500 font-medium text-lg italic leading-relaxed">
                                        Join the most elite tech logistics network in Kenya. Gain access to thousands of verified customers.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left">
                                        <Zap className="text-primary h-6 w-6 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-foreground">Fast Settlements</p>
                                        <p className="text-[9px] text-slate-400 font-bold mt-1">48hr Payout Cycle</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left">
                                        <ShieldCheck className="text-emerald-500 h-6 w-6 mb-3" />
                                        <p className="text-[10px] font-black uppercase text-foreground">Verified Only</p>
                                        <p className="text-[9px] text-slate-400 font-bold mt-1">Fraud Protected</p>
                                    </div>
                                </div>
                                <Button onClick={() => setStep('business')} className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    Initialize Partner Application <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        )}

                        {step === 'business' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Business Profile</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Identification</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Registered Business Name" className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 font-bold text-sm" />
                                        <Store className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                    <div className="relative">
                                        <Input value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="Registration Number / Tax ID" className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 font-bold text-sm" />
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold text-xs" />
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                        </div>
                                        <div className="relative">
                                            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold text-xs" />
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Business Email (For Orders)" className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 font-bold text-sm" />
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setStep('welcome')} variant="outline" className="h-16 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={16} /></Button>
                                    <Button onClick={() => setStep('categories')} disabled={!businessName || !regNo} className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                                        Next Component
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'categories' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Supply Category</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niche Specialization</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {availableCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={cn(
                                                "p-6 rounded-3xl border-2 text-left transition-all duration-300",
                                                categories.includes(cat) ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-slate-50 bg-slate-50/30 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <p className="font-black uppercase tracking-tight text-[10px] text-foreground">{cat}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setStep('business')} variant="outline" className="h-16 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={16} /></Button>
                                    <Button onClick={() => setStep('payout')} disabled={categories.length === 0} className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                                        Financial Setup
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'payout' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Settlement Node</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank or Paybill Details</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name / M-Pesa Provider" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold text-xs" />
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    </div>
                                    <div className="relative">
                                        <Input value={bankAccName} onChange={e => setBankAccName(e.target.value)} placeholder="Account / Paybill Holder Name" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold text-xs" />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    </div>
                                    <div className="relative">
                                        <Input value={bankAccNo} onChange={e => setBankAccNo(e.target.value)} placeholder="Account / Paybill Number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold text-xs" />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setStep('categories')} variant="outline" className="h-16 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={16} /></Button>
                                    <Button onClick={() => setStep('agreement')} disabled={!bankAccNo} className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                                        Final Verification
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'agreement' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Partner Agreement</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Protocol</p>
                                </div>
                                <div className="h-64 overflow-y-auto p-6 bg-slate-50 rounded-3xl border border-slate-100 text-[10px] font-medium leading-relaxed text-slate-600 space-y-4">
                                    <p className="font-black text-foreground uppercase">TECHPAX MERCHANT SUPPLY AGREEMENT</p>
                                    <p>1. AUTHENTICITY: Supplier guarantees that all products supplied are 100% genuine and original.</p>
                                    <p>2. FULFILLMENT: Supplier must maintain accurate stock levels in the dashboard.</p>
                                    <p>3. COMMISSION: A standard 5% commission applies to all sales processed through the platform.</p>
                                    <p>4. PAYOUTS: Settlements are processed every Tuesday and Friday.</p>
                                    <p>5. QUALITY: Any defective product must be replaced within 24 hours of notification.</p>
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-foreground transition-colors uppercase italic leading-tight">
                                        I certify that all business information provided is accurate and I agree to the Merchant Supply Protocol.
                                    </span>
                                </label>
                                <div className="flex gap-4">
                                    <Button onClick={() => setStep('payout')} variant="outline" className="h-16 rounded-2xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest"><ArrowLeft size={16} /></Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !termsAccepted}
                                        className="flex-1 h-20 rounded-[1.8rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "Deploy Partner Link"}
                                    </Button>
                                </div>
                                {error && <p className="text-[9px] font-black uppercase text-rose-500 text-center animate-pulse">{error}</p>}
                            </div>
                        )}

                        {step === 'pending' && (
                            <div className="space-y-10 text-center animate-in zoom-in-95 duration-700">
                                <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner animate-pulse">
                                    <ShieldCheck className="h-12 w-12" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Application Logged</h2>
                                    <p className="text-slate-500 font-medium text-lg italic leading-relaxed">
                                        &quot;Your business credentials have been established on the grid. Our verification unit will contact you within **24 hours** to activate your partner dashboard.&quot;
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-4">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Next Phase</p>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-foreground">1. Identity Verification (In Progress)</p>
                                        <p className="text-xs font-black text-slate-400">2. Dashboard Activation Link (Pending)</p>
                                        <p className="text-xs font-black text-slate-400">3. Stock Initialization (Pending)</p>
                                    </div>
                                </div>
                                <Link href="/">
                                    <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                        Return to Base
                                    </Button>
                                </Link>
                            </div>
                        )}

                    </div>
                    {/* Background Pattern */}
                    <Briefcase className="absolute -bottom-10 -right-10 h-64 w-64 text-indigo-500/5 rotate-12 -z-0" />
                </Card>

                <div className="text-center flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secured by Apex Partner Protocol v2.0</p>
                </div>

            </div>
        </div>
    );
}
