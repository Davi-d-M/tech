'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    DollarSign,
    RefreshCcw,
    CheckCircle2,
    Search,
    ArrowLeft,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';
import Link from 'next/link';

interface PayoutRequest {
    id: number;
    profile_id: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
    payment_method: string;
    payment_details: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        phone_number: string;
    };
}

export default function AdminPayoutsPage() {
    const { email: adminEmail } = useAdmin();
    const [payouts, setPayouts] = React.useState<PayoutRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filter, setFilter] = React.useState<'all' | 'Pending' | 'Paid'>('all');

    const fetchPayouts = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('affiliate_payouts')
                .select('*, profiles(full_name, email, phone_number)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayouts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const updateStatus = async (id: number, status: 'Approved' | 'Paid' | 'Rejected') => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('affiliate_payouts').update({ status }).eq('id', id);
            if (error) throw error;

            await logAuditAction(adminEmail, 'UPDATE_PAYOUT_STATUS', { id, status });
            setPayouts(payouts.map(p => p.id === id ? { ...p, status } : p));
        } catch (err) {
            console.error(err);
        }
    };

    const filteredPayouts = payouts.filter(p => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = p.profiles?.full_name?.toLowerCase().includes(query) ||
                            p.profiles?.email?.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-4">
                    <Link href="/admin/affiliates" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Intelligence
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Payout Queue</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Authorize commission withdrawals and manage network liquidity.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchPayouts} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Queue
                    </Button>
                </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-6 items-stretch">
                <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                    <div>
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6"><DollarSign className="h-5 w-5" /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payouts</p>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{formatPrice(payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0))}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                    <div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6"><Clock className="h-5 w-5" /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Volume</p>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{formatPrice(payouts.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0))}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden text-left">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {(['all', 'Pending', 'Paid'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn("px-6 py-3 rounded-lg text-[9px] font-black uppercase transition-all", filter === f ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Find withdrawal by name..."
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                                <th className="px-10 py-6">Recipient Identity</th>
                                <th className="px-10 py-6 text-center">Amount</th>
                                <th className="px-10 py-6 text-center">Method</th>
                                <th className="px-10 py-6 text-center">Status</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPayouts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground font-black uppercase text-[10px] shadow-inner">
                                                {p.profiles?.full_name?.substring(0, 2) || '??'}
                                            </div>
                                            <div>
                                                <span className="font-black text-foreground uppercase text-xs tracking-tight block">{p.profiles?.full_name || 'Anonymous'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.profiles?.phone_number}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center font-black text-foreground text-lg">{formatPrice(p.amount)}</td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="text-[10px] font-black uppercase bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            {p.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            p.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            p.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-2">
                                            {p.status === 'Pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => updateStatus(p.id, 'Paid')}
                                                        className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20"
                                                    >
                                                        Pay Now
                                                    </Button>
                                                    <Button
                                                        onClick={() => updateStatus(p.id, 'Rejected')}
                                                        variant="ghost"
                                                        className="h-10 px-4 rounded-xl text-slate-400 hover:text-rose-500 font-black uppercase text-[8px]"
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {p.status === 'Paid' && (
                                                <Button variant="ghost" disabled className="h-10 px-6 rounded-xl text-emerald-500 font-black uppercase text-[8px]">
                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Authorized
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
