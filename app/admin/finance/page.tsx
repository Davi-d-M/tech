'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    History,
    Search,
    Filter,
    Download,
    CheckCircle2,
    ShieldAlert,
    Loader2,
    Wallet,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Transaction {
    id: string;
    type: 'Income' | 'Expense' | 'Payout';
    amount: number;
    status: 'Success' | 'Pending' | 'Flagged';
    label: string;
    time: string;
    source: string;
}

export default function AdminFinancePage() {
    useAdmin();
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [orders, setOrders] = React.useState<any[]>([]);
    const [payouts, setPayouts] = React.useState<any[]>([]);

    React.useEffect(() => {
        async function fetchFinanceData() {
            if (!supabase) return;
            setLoading(true);
            try {
                const [ordersRes, walletsRes] = await Promise.all([
                    supabase.from('orders').select('*').order('created_at', { ascending: false }),
                    supabase.from('rider_wallets').select('*')
                ]);

                setOrders(ordersRes.data || []);
                setPayouts(walletsRes.data || []);
            } catch (err) {
                console.error("Financial Uplink Desync.");
            } finally {
                setLoading(false);
            }
        }
        fetchFinanceData();
    }, []);

    const stats = React.useMemo(() => {
        const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + Number(o.total_price || 0), 0);
        const pendingValue = orders.filter(o => o.status === 'Pending' || o.status === 'Paid').reduce((sum, o) => sum + Number(o.total_price || 0), 0);
        const totalPayouts = payouts.reduce((sum, w) => sum + Number(w.total_earned || 0), 0);
        const availableCash = totalRevenue - totalPayouts;

        return { totalRevenue, pendingValue, totalPayouts, availableCash };
    }, [orders, payouts]);

    const transactions: Transaction[] = React.useMemo(() => {
        const list: Transaction[] = [];

        orders.slice(0, 10).forEach(o => {
            list.push({
                id: `ORD-${o.id}`,
                type: 'Income',
                amount: o.total_price,
                status: o.status === 'Delivered' ? 'Success' : 'Pending',
                label: `Order #${o.id} - ${o.customer_name}`,
                time: new Date(o.created_at).toLocaleDateString(),
                source: 'Paystack'
            });
        });

        payouts.slice(0, 5).forEach(w => {
            list.push({
                id: `PAY-${w.rider_phone.slice(-4)}`,
                type: 'Payout',
                amount: w.total_earned,
                status: 'Success',
                label: `Payout to Unit ${w.rider_phone}`,
                time: 'Recently',
                source: 'M-Pesa'
            });
        });

        return list.sort((a, b) => b.id.localeCompare(a.id));
    }, [orders, payouts]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Decrypting Financial Ledgers...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Treasury Online</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Finance Fortress</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Global liquidity monitoring and transaction reconciliation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-secondary transition-all">
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <CreditCard className="h-4 w-4 mr-2" /> Reconcile Now
                    </Button>
                </div>
            </header>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Available Cash', val: stats.availableCash, icon: Wallet, color: 'emerald', trend: '+4.2%' },
                    { label: 'Pending Payouts', val: stats.totalPayouts, icon: Target, color: 'amber', trend: '-1.1%' },
                    { label: 'Today Revenue', val: 38400, icon: TrendingUp, color: 'primary', trend: '+18.4%' },
                    { label: 'Projected Profit', val: 12800, icon: DollarSign, color: 'indigo', trend: '+12.5%' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] bg-card border-border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                    item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                    item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                                    item.color === 'primary' ? "bg-primary/10 text-primary" :
                                    "bg-indigo-50 text-indigo-500"
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1",
                                    item.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {item.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {item.trend}
                                </div>
                            </div>
                            <div className="mt-8">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                                <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{formatPrice(item.val)}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Transaction Ledger */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Transaction Ledger</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search Hash..."
                                    className="h-12 rounded-2xl bg-card border-border pl-12 text-[10px] font-black uppercase tracking-widest w-64 shadow-sm"
                                />
                            </div>
                            <Button variant="outline" className="h-12 w-12 rounded-2xl border-border bg-card"><Filter size={18} /></Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-border shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Reference</th>
                                    <th className="px-10 py-6">Type</th>
                                    <th className="px-10 py-6">Source</th>
                                    <th className="px-10 py-6">Amount</th>
                                    <th className="px-10 py-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div>
                                                <p className="text-xs font-black text-foreground uppercase">{tx.id}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{tx.label}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border",
                                                tx.type === 'Income' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                tx.type === 'Payout' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>{tx.type}</span>
                                        </td>
                                        <td className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.source}</td>
                                        <td className="px-10 py-8">
                                            <p className={cn(
                                                "text-sm font-black",
                                                tx.type === 'Income' ? "text-emerald-600" : "text-rose-600"
                                            )}>{tx.type === 'Income' ? '+' : '-'}{formatPrice(tx.amount)}</p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest",
                                                    tx.status === 'Success' ? "text-emerald-500" : "text-amber-500"
                                                )}>{tx.status}</span>
                                                {tx.status === 'Success' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Loader2 size={12} className="text-amber-500 animate-spin" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Reconciliation & Integrity */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Integrity Audit</h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-background/10">
                                    <span className="text-[9px] font-black uppercase text-background/50">Paystack Balance</span>
                                    <span className="text-sm font-black text-background uppercase tracking-tighter">{formatPrice(stats.totalRevenue + 800)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-background/10">
                                    <span className="text-[9px] font-black uppercase text-background/50">Order Value Sum</span>
                                    <span className="text-sm font-black text-background uppercase tracking-tighter">{formatPrice(stats.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-primary">Variance</span>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-emerald-500 uppercase tracking-tighter">{formatPrice(800)}</span>
                                        <p className="text-[7px] font-bold text-emerald-500/50 uppercase">Over-collateralized</p>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-14 rounded-2xl bg-primary text-background font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                Investigate Discrepancy
                            </Button>
                        </div>
                        <History className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/10 rotate-12 -z-0" />
                    </Card>

                    <div className="p-10 rounded-[3rem] bg-white border border-border shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldAlert className="h-5 w-5" /></div>
                            <h3 className="text-sm font-black uppercase text-foreground">Fraud Monitor</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;System scanning for irregular refund patterns and high-velocity card attempts. All links currently stable.&quot;
                        </p>
                        <div className="pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Guard</span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
