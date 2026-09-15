'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    DollarSign,
    RefreshCcw,
    CheckCircle2,
    Search,
    ArrowLeft,
    Clock,
    Trash2,
    Users,
    Store,
    Truck,
    Target,
    Filter,
    Download,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';
import Link from 'next/link';

interface PayoutRequest {
    id: string;
    recipient_id: string;
    recipient_name: string;
    recipient_role: 'RIDER' | 'MERCHANT' | 'AFFILIATE';
    amount: number;
    status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
    payment_method: string;
    payment_details: string;
    created_at: string;
}

export default function UnifiedPayoutHub() {
    const { email: adminEmail } = useAdmin();
    const [payouts, setPayouts] = React.useState<PayoutRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<'ALL' | 'RIDER' | 'MERCHANT' | 'AFFILIATE'>('ALL');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'Pending' | 'Paid'>('all');

    const fetchPayouts = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payout_requests')
                .select('*')
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

    const updateStatus = async (id: string, status: 'Approved' | 'Paid' | 'Rejected') => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('payout_requests').update({
                status,
                processed_at: status === 'Paid' ? new Date().toISOString() : null
            }).eq('id', id);

            if (error) throw error;

            await logAuditAction(adminEmail, 'UPDATE_PAYOUT_STATUS', { id, status });
            setPayouts(payouts.map(p => p.id === id ? { ...p, status } : p));
        } catch (err) {
            console.error(err);
        }
    };

    const deletePayout = async (id: string) => {
        if (!supabase || !confirm("Expel this payout request from the records?")) return;
        try {
            const { error } = await supabase.from('payout_requests').delete().eq('id', id);
            if (error) throw error;

            await logAuditAction(adminEmail, 'DELETE_PAYOUT_REQUEST', { id });
            setPayouts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const exportMpesaBatch = () => {
        const pending = filteredPayouts.filter(p => p.status === 'Pending' && p.payment_method === 'M-Pesa');
        if (pending.length === 0) {
            alert("No pending M-Pesa payouts to export.");
            return;
        }

        const headers = ["Phone Number", "Full Name", "Amount", "Reference"];
        const rows = pending.map(p => [p.recipient_id, p.recipient_name, p.amount, `APEX-${p.id.substring(0,8)}`]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Apex_Mpesa_Batch_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const filteredPayouts = payouts.filter(p => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = p.recipient_name?.toLowerCase().includes(query) ||
                            p.recipient_id?.includes(query);
        const matchesRole = roleFilter === 'ALL' || p.recipient_role === roleFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'RIDER': return <Truck className="h-4 w-4" />;
            case 'MERCHANT': return <Store className="h-4 w-4" />;
            default: return <Target className="h-4 w-4" />;
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Yield Extraction HUD</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Payout Hub</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage withdrawals for Riders, Merchants, and Affiliates.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={exportMpesaBatch} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                        <Download className="h-4 w-4 mr-2" /> M-Pesa Batch
                    </Button>
                    <Button onClick={fetchPayouts} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Log
                    </Button>
                </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-6 items-stretch">
                {[
                    { label: 'Authorized to Extract', val: payouts.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0), icon: DollarSign, color: 'primary' },
                    { label: 'Total Paid out', val: payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0), icon: CheckCircle2, color: 'emerald' },
                    { label: 'Pending Requests', val: payouts.filter(p => p.status === 'Pending').length, icon: Clock, color: 'amber' },
                    { label: 'Extraction Active', val: 'Grid Lock', icon: Zap, color: 'primary' },
                ].map(item => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                        <div>
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center mb-6 shadow-sm",
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                item.color === 'amber' ? "bg-amber-50 text-amber-600" :
                                "bg-primary/10 text-primary"
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">
                                    {typeof item.val === 'number' ? formatPrice(item.val) : item.val}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden text-left">
                <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4">
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['ALL', 'RIDER', 'MERCHANT', 'AFFILIATE'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setRoleFilter(f)}
                                    className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", roleFilter === f ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['all', 'Pending', 'Paid'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={cn("px-6 py-3 rounded-lg text-[9px] font-black uppercase transition-all", statusFilter === f ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Find Identity or Ref..."
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] whitespace-nowrap">
                                <th className="px-10 py-6">Recipient Identity</th>
                                <th className="px-10 py-6 text-center">Role Node</th>
                                <th className="px-10 py-6 text-center">Amount</th>
                                <th className="px-10 py-6 text-center">Status</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPayouts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-foreground font-black uppercase text-[10px] shadow-inner shrink-0">
                                                {p.recipient_name?.substring(0, 2) || '??'}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-black text-foreground uppercase text-xs tracking-tight block truncate whitespace-nowrap">{p.recipient_name || 'Anonymous'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block truncate">{p.recipient_id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[8px] font-black uppercase text-slate-500">
                                            {getRoleIcon(p.recipient_role)}
                                            {p.recipient_role}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center font-black text-foreground text-lg">{formatPrice(p.amount)}</td>
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
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {p.status === 'Pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => updateStatus(p.id, 'Paid')}
                                                        className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                                    >
                                                        Finalize Payment
                                                    </Button>
                                                    <Button
                                                        onClick={() => updateStatus(p.id, 'Rejected')}
                                                        variant="ghost"
                                                        className="h-10 px-4 rounded-xl text-slate-400 hover:text-rose-500 font-black uppercase text-[8px]"
                                                    >
                                                        Block
                                                    </Button>
                                                </>
                                            )}
                                            {p.status === 'Paid' && (
                                                <Button variant="ghost" disabled className="h-10 px-6 rounded-xl text-emerald-500 font-black uppercase text-[8px]">
                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Logged
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deletePayout(p.id)}
                                                className="h-10 w-10 rounded-xl text-slate-200 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
