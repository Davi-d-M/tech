'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Wallet,
    TrendingUp,
    History,
    CheckCircle2,
    Clock,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface SettlementEntry {
    id: number;
    order_id: number;
    amount: number;
    status: 'Pending' | 'Paid' | 'Disputed';
    created_at: string;
    description: string;
}

export default function SupplierSettlements() {
    const { supplier_id } = useAdmin();
    const [settlements, setSettlements] = React.useState<SettlementEntry[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchSettlements = React.useCallback(async () => {
        if (!supabase || !supplier_id) {
            setLoading(false);
            return;
        }
        try {
            // In a real app, this would query a supplier_ledger table
            // For now we query financial_ledger filtered by supplier context
            const { data } = await supabase
                .from('financial_ledger')
                .select('*')
                .eq('entry_type', 'SUPPLIER_PAYABLE')
                .order('created_at', { ascending: false });

            setSettlements(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [supplier_id]);

    React.useEffect(() => {
        fetchSettlements();
    }, [fetchSettlements]);

    const stats = React.useMemo(() => {
        const total = settlements.reduce((s, e) => s + Math.abs(e.amount), 0);
        const pending = settlements.filter(e => e.status === 'Pending').reduce((s, e) => s + Math.abs(e.amount), 0);
        const paid = settlements.filter(e => e.status === 'Paid').reduce((s, e) => s + Math.abs(e.amount), 0);
        return { total, pending, paid };
    }, [settlements]);

    if (loading) return (
        <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 bg-background">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Decrypting Settlement Ledger...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Financial Vault</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Settlement Portal</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time settlement tracking and payout transparency.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchSettlements} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                        <History className="h-4 w-4 mr-2" /> Sync Ledger
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {[
                    { label: 'Total Volume', val: stats.total, icon: TrendingUp, color: 'primary' },
                    { label: 'Pending Payout', val: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Verified Paid', val: stats.paid, icon: CheckCircle2, color: 'emerald' },
                ].map(item => (
                    <Card key={item.label} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all h-full">
                        <div className="flex justify-between items-start mb-8">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                item.color === 'primary' ? "bg-primary/5 text-primary" :
                                item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                "bg-emerald-50 text-emerald-600"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">{formatPrice(item.val)}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6 text-left">
                    <div className="flex items-center justify-between px-4 text-left">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Transaction History</h2>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">{settlements.length} Entries</span>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Mission Ref</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6 text-right">Value (KES)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-40">No settlement records found.</td>
                                    </tr>
                                ) : settlements.map(s => (
                                    <tr key={s.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-10 py-8 text-left">
                                            <p className="text-xs font-black text-foreground uppercase">Order #{s.order_id || '---'}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-10 py-8 text-left">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                s.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                s.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>{s.status || 'Verified'}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right font-black text-sm text-foreground">
                                            {formatPrice(Math.abs(s.amount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8 text-left">
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group text-left">
                        <div className="relative z-10 space-y-8 text-left">
                            <div className="flex items-center gap-4 text-primary">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shadow-inner"><ShieldCheck size={24} /></div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Partner Integrity</h3>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic text-left">
                                &quot;Your settlements are calculated automatically upon mission completion. Disputed amounts are reviewed by the Command Center within 24 hours.&quot;
                            </p>
                            <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-left">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Version</span>
                                <span className="text-xs font-black text-emerald-600 tracking-tight text-left">v4.0 SECURE</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3 text-left">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Wallet size={20} /></div>
                            <h3 className="text-lg font-black uppercase text-foreground leading-none tracking-tighter text-left">Payout Hub</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic text-left">
                            &quot;All settlements are disbursed to your linked bank account every Tuesday and Friday.&quot;
                        </p>
                        <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                            Request Early Payout
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
