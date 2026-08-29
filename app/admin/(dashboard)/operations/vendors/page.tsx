'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Store,
    Users,
    ShieldCheck,
    TrendingUp,
    Plus,
    RefreshCcw,
    MoreVertical,
    Box,
    Truck,
    Loader2,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface Vendor {
    id: string;
    name: string;
    email: string;
    status: 'Pending' | 'Active' | 'Suspended';
    sales_total: number;
    items_count: number;
    commission_rate: number;
    joined_at: string;
}

export default function MultiVendorHub() {
    const { email: adminEmail } = useAdmin();
    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isOnboarding, setIsOnboarding] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [newVendor, setNewVendor] = React.useState({ name: '', email: '' });

    const fetchVendors = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // Real Database Node Link
            const { data, error } = await supabase
                .from('marketplace_vendors')
                .select('*')
                .order('joined_at', { ascending: false });

            if (!error) setVendors(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleApproveVendor = async (id: string) => {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, status: 'Active' } : v));
        await logAuditAction(adminEmail, 'APPROVE_VENDOR', { id });
        setMessage({ type: 'success', text: "Partner Node Activated. Commission logic synchronized." });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Nexus Partner Grid</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Multi-Vendor Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Manage 3rd party partners and autonomous commission settlements.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchVendors} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Grid
                    </Button>
                    <Button onClick={() => setIsOnboarding(true)} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95">
                        <Plus size={16} className="mr-2" /> Onboard Partner
                    </Button>
                </div>
            </header>

            {isOnboarding && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/10 backdrop-blur-md p-4">
                    <Card className="max-w-md w-full p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Partner Onboarding</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Business Name</label>
                                <Input value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="e.g. Apex Wholesalers" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Contact Email</label>
                                <Input value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} placeholder="partner@domain.com" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={async () => {
                                    if (!newVendor.name || !newVendor.email || !supabase) return;
                                    setLoading(true);

                                    const { error } = await supabase.from('marketplace_vendors').insert([{
                                        name: newVendor.name,
                                        email: newVendor.email,
                                        status: 'Pending',
                                        sales_total: 0,
                                        items_count: 0,
                                        commission_rate: 10,
                                        joined_at: new Date().toISOString()
                                    }]);

                                    if (error) {
                                        setMessage({ type: 'error', text: error.message });
                                    } else {
                                        setIsOnboarding(false);
                                        setNewVendor({ name: '', email: '' });
                                        fetchVendors();
                                        setMessage({ type: 'success', text: "Onboarding Payload Sent. Verification Pending." });
                                    }
                                    setLoading(false);
                                    setTimeout(() => setMessage(null), 3000);
                                }}
                                className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                            >
                                Initiate Protocol
                            </Button>
                            <Button onClick={() => setIsOnboarding(false)} variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px]">Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                    <div className="relative z-10 space-y-8">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm"><Users size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Active Marketplace Partners</p>
                            <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">{vendors.filter(v => v.status === 'Active').length} Nodes</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                    <div className="relative z-10 space-y-8">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm"><TrendingUp size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Commission Yield (MTD)</p>
                            <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">{formatPrice(vendors.reduce((s, v) => s + (v.sales_total * (v.commission_rate/100)), 0))}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                    <div className="relative z-10 space-y-8">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm"><Box size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Managed Marketplace SKUs</p>
                            <h3 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">{vendors.reduce((s, v) => s + v.items_count, 0)} Units</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                            <th className="px-10 py-6">Partner Identity</th>
                            <th className="px-10 py-6">Grid Status</th>
                            <th className="px-10 py-6">Sales / Commission</th>
                            <th className="px-10 py-6">Items</th>
                            <th className="px-10 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></td></tr>
                        ) : vendors.map(v => (
                            <tr key={v.id} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-10 py-8 text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground font-black text-xs">
                                            {v.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{v.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{v.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <span className={cn(
                                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                        v.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        v.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                                        "bg-rose-50 text-rose-600 border-rose-100"
                                    )}>{v.status}</span>
                                </td>
                                <td className="px-10 py-8">
                                    <p className="text-xs font-black text-foreground">{formatPrice(v.sales_total)}</p>
                                    <p className="text-[9px] font-bold text-primary uppercase mt-1">{v.commission_rate}% Apex Fee</p>
                                </td>
                                <td className="px-10 py-8 text-left">
                                    <div className="flex items-center gap-2">
                                        <Box size={14} className="text-slate-300" />
                                        <span className="text-xs font-black text-foreground">{v.items_count} Units</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        {v.status === 'Pending' && (
                                            <Button onClick={() => handleApproveVendor(v.id)} size="sm" className="h-10 px-4 rounded-xl bg-primary text-white font-black uppercase text-[9px] shadow-lg shadow-primary/20">Approve</Button>
                                        )}
                                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100"><MoreVertical size={16} className="text-slate-400" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="p-10 rounded-[3rem] bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20"><ShieldCheck size={24} /></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Settlement Protocol</h3>
                        </div>
                        <p className="text-xs font-medium leading-relaxed opacity-70 italic">
                            &quot;All partner payouts are autonomously calculated every Monday. Commission is deducted at the source of successful extraction missions.&quot;
                        </p>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Status</span>
                            <span className="text-xs font-black uppercase tracking-widest">Active System</span>
                        </div>
                    </div>
                </Card>

                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 space-y-8 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Truck size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Fulfillment Choice</h3>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Managed Partner Logistics</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex-1 space-y-2">
                            <p className="text-[10px] font-black uppercase text-foreground">Fulfilled by Apex</p>
                            <p className="text-[8px] font-medium text-slate-500 italic">Partners store stock in your warehouse nodes.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex-1 space-y-2 opacity-50">
                            <p className="text-[10px] font-black uppercase text-foreground">Merchant Dispatch</p>
                            <p className="text-[8px] font-medium text-slate-500 italic">Partners handle their own logistics node.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
