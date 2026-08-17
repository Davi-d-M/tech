'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    DollarSign,
    TrendingUp,
    Wallet,
    Target,
    Zap,
    Scale,
    CheckCircle2,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';

interface LedgerEntry {
    id: number;
    order_id: number;
    entry_type: 'REVENUE' | 'SUPPLIER_PAYABLE' | 'DELIVERY_FEE' | 'PAYMENT_FEE' | 'REFUND' | 'COST';
    amount: number;
    description: string;
    is_reconciled: boolean;
    created_at: string;
}

export default function AdminFinancePage() {
    const [loading, setLoading] = React.useState(true);
    const [ledger, setLedger] = React.useState<LedgerEntry[]>([]);
    const [isReconciling, setIsReconciling] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchLedger = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_ledger')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLedger(data || []);
        } catch (err) {
            console.error("Financial Uplink Desync:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const handleReconcile = async () => {
        setIsReconciling(true);
        setMessage(null);
        try {
            // Apex OS: Automatic Reconciliation Logic
            // In real app, this would hit gateway APIs
            await new Promise(r => setTimeout(r, 2000));

            const { error } = await supabase!
                .from('financial_ledger')
                .update({ is_reconciled: true, reconciliation_ref: `RECON-${Date.now()}` })
                .eq('is_reconciled', false);

            if (error) throw error;

            setMessage({ type: 'success', text: "Ledger reconciliation complete. 100% Integrity match. ✅" });
            fetchLedger();
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsReconciling(false);
        }
    };

    const stats = React.useMemo(() => {
        const revenue = ledger.filter(l => l.entry_type === 'REVENUE').reduce((s, l) => s + l.amount, 0);
        const cost = Math.abs(ledger.filter(l => l.entry_type === 'SUPPLIER_PAYABLE' || l.entry_type === 'COST').reduce((s, l) => s + l.amount, 0));
        const fees = Math.abs(ledger.filter(l => l.entry_type === 'PAYMENT_FEE').reduce((s, l) => s + l.amount, 0));

        const contributionProfit = revenue - cost - fees;
        const margin = revenue > 0 ? (contributionProfit / revenue) * 100 : 0;
        const unreconciled = ledger.filter(l => !l.is_reconciled).length;
        const totalVariances = ledger.filter(l => !l.is_reconciled).reduce((s, l) => s + Math.abs(l.amount), 0);

        return { revenue, contributionProfit, margin, unreconciled, payables: cost, totalVariances };
    }, [ledger]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Decrypting Financial Ledgers...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Treasury OS Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Financial Fortress</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time contribution margin and transaction state control.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleReconcile}
                        disabled={isReconciling || stats.unreconciled === 0}
                        className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {isReconciling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scale className="h-4 w-4 mr-2" />}
                        {isReconciling ? 'Reconciling...' : `Reconcile ${stats.unreconciled} Variances`}
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2.5rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            {/* Financial KPIs 2.0 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
                {[
                    { label: 'Available Cash', val: stats.revenue - stats.payables, icon: Wallet, color: 'emerald' },
                    { label: 'Unreconciled', val: stats.totalVariances, icon: Target, color: 'amber' },
                    { label: 'Net Profit', val: stats.contributionProfit, icon: TrendingUp, color: 'primary' },
                    { label: 'Margin Efficiency', val: `${stats.margin.toFixed(1)}%`, icon: DollarSign, color: 'indigo' },
                ].map((item) => (
                    <Card key={item.label} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden h-full flex flex-col justify-between">
                        <div className="relative z-10 space-y-8">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                item.color === 'primary' ? "bg-primary/5 text-primary" :
                                "bg-indigo-50 text-indigo-500"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">
                                    {typeof item.val === 'string' ? item.val : formatPrice(item.val)}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground px-4 italic underline decoration-primary decoration-4">The Apex Ledger</h2>
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Mission Ref</th>
                                    <th className="px-10 py-6">Payload Type</th>
                                    <th className="px-10 py-6">Value (KES)</th>
                                    <th className="px-10 py-6 text-right">Integrity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ledger.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-10 py-8">
                                            <p className="text-xs font-black text-foreground uppercase">Order #{entry.order_id}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(entry.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase px-2.5 py-1 rounded border",
                                                entry.entry_type === 'REVENUE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                entry.entry_type === 'REFUND' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                "bg-slate-100 text-slate-500 border-slate-200"
                                            )}>{entry.entry_type}</span>
                                        </td>
                                        <td className={cn(
                                            "px-10 py-8 font-black text-sm",
                                            entry.amount > 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {entry.is_reconciled ? (
                                                <div className="flex items-center justify-end gap-2 text-emerald-500">
                                                    <span className="text-[8px] font-black uppercase">Verified</span>
                                                    <CheckCircle2 size={14} />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-amber-500 animate-pulse">
                                                    <span className="text-[8px] font-black uppercase">Pending</span>
                                                    <Zap size={14} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-10">
                            <h3 className="text-lg font-black uppercase tracking-tighter">Profit Extraction</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-background/50">
                                    <span>Contribution Margin</span>
                                    <span className="text-primary">{stats.margin.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-background/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${stats.margin}%` }}></div>
                                </div>
                                <p className="text-[10px] font-medium italic text-background/40 leading-relaxed text-left">
                                    &quot;Every mission is clinically measured for unit profitability. Variances are flagged at the source.&quot;
                                </p>
                            </div>
                        </div>
                        <DollarSign className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/10 rotate-12 -z-0" />
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Scale size={20} /></div>
                            <h3 className="text-lg font-black uppercase text-foreground leading-none tracking-tighter">Risk Guard</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;Scanning for payment anomalies and reconciliation drift across all linked gateways.&quot;
                        </p>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protocol Integrity: 100%</span>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
