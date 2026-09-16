'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    RefreshCcw,
    CheckCircle2,
    Search,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

interface PaymentLog {
    id: string;
    reference: string;
    amount: number;
    event_type: string;
    created_at: string;
    order_id: number | null;
    customer_email?: string;
}

interface PendingOrder {
    id: number;
    customer_name: string;
    total_price: number;
    status: string;
}

export default function ReconciliationHUD() {
    const { email: staffEmail } = useAdmin();
    const [logs, setLogs] = React.useState<PaymentLog[]>([]);
    const [orders, setOrders] = React.useState<PendingOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [matchingOrderId, setMatchingOrderId] = React.useState<string>('');
    const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [logsRes, ordersRes] = await Promise.all([
                supabase.from('payment_logs').select('*').is('order_id', null).order('created_at', { ascending: false }),
                supabase.from('orders').select('id, customer_name, total_price, status').in('status', ['Created', 'Payment Pending']).order('created_at', { ascending: false })
            ]);

            setLogs(logsRes.data || []);
            setOrders(ordersRes.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReconcile = async (logId: string) => {
        if (!matchingOrderId || !supabase) return;
        setReconcilingId(logId);
        try {
            const { error } = await supabase.rpc('reconcile_transaction', {
                p_log_id: logId,
                p_order_id: parseInt(matchingOrderId),
                p_staff_email: staffEmail
            });

            if (error) throw error;

            alert("Reconciliation Successful! Order status moved to Paid. ⚡");
            setMatchingOrderId('');
            fetchData();
        } catch (err: unknown) {
            const error = err as Error;
            alert(error.message);
        } finally {
            setReconcilingId(null);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.amount.toString().includes(searchQuery)
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-4">
                    <Link href="/admin/finance" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Finance
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">M-Pesa Radar</h1>
                        <p className="text-slate-500 text-sm font-medium mt-2">Audit un-matched transactions and link them to pending orders.</p>
                    </div>
                </div>
                <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Pulse Radar
                </Button>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* 1. UN-MATCHED LOGS */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Pending Reconciliation</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Ref or Amount..."
                                className="h-10 rounded-xl border-slate-100 bg-white pl-10 text-[10px] font-black uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => <Card key={i} className="h-24 rounded-[2rem] border border-slate-100 animate-pulse bg-white" />)
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 opacity-40">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest">All transactions matched.</p>
                            </div>
                        ) : filteredLogs.map(log => (
                            <Card key={log.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-center gap-6 text-left">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                                        <Zap className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white shadow-sm">UN-MATCHED</span>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
                                        </div>
                                        <h3 className="font-black text-foreground uppercase text-lg tracking-tighter leading-none">{log.reference}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Source: Paystack/M-Pesa Webhook</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Settlement</p>
                                        <p className="text-2xl font-black text-foreground">{formatPrice(log.amount)}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Input
                                            placeholder="Order #"
                                            className="w-24 h-10 rounded-xl text-center font-black text-xs border-slate-200"
                                            value={reconcilingId === log.id ? matchingOrderId : ''}
                                            onChange={e => {
                                                setReconcilingId(log.id);
                                                setMatchingOrderId(e.target.value);
                                            }}
                                        />
                                        <Button
                                            onClick={() => handleReconcile(log.id)}
                                            disabled={reconcilingId === log.id && !matchingOrderId}
                                            size="sm"
                                            className="h-10 px-4 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20"
                                        >
                                            {reconcilingId === log.id ? <Loader2 className="animate-spin" /> : 'Link & Pay'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 2. PENDING ORDERS (MATCHING TARGETS) */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-4">Extraction Targets</h2>
                    <Card className="rounded-[3rem] border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase text-slate-400">Waiting for Funds</p>
                            <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-100">{orders.length} Orders</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                            {orders.map(o => (
                                <div key={o.id} className="p-6 hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => {
                                    if (filteredLogs.length > 0) {
                                        setReconcilingId(filteredLogs[0].id);
                                        setMatchingOrderId(o.id.toString());
                                    }
                                }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-black text-primary uppercase">Order #{o.id}</span>
                                        <span className="text-[10px] font-black text-foreground">{formatPrice(o.total_price)}</span>
                                    </div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">{o.customer_name}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{o.status}</span>
                                        <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-all" />
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <div className="p-20 text-center opacity-20">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase">No pending orders.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-indigo-700">Intelligence Note</p>
                            <p className="text-[10px] text-indigo-600 font-medium leading-relaxed italic">
                                &quot;Transactions appearing here are funds received via M-Pesa that the system couldn&apos;t automatically match to an order. Manual audit required.&quot;
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
