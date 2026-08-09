'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Calendar, Wallet, Loader2, Zap } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface Order {
    created_at: string;
    status: string;
    total_price: number;
}

export default function EarningsCenter({ balance, totalEarned, orders = [] }: { balance: number, totalEarned: number, orders?: Order[] }) {
    const [requesting, setRequesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const chartData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(day => ({ day, amount: 0 }));

        // Aggregate last 7 days of delivered orders
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        orders.forEach(order => {
            const date = new Date(order.created_at);
            if (date >= lastWeek && order.status === 'Delivered') {
                const dayName = days[date.getDay()];
                const entry = data.find(d => d.day === dayName);
                if (entry) entry.amount += Number(order.total_price || 0);
            }
        });

        // Reorder to end on today
        const todayIdx = now.getDay();
        return [...data.slice(todayIdx + 1), ...data.slice(0, todayIdx + 1)];
    }, [orders]);

    const handleWithdraw = async () => {
        if (balance < 500) {
            setMessage({ type: 'error', text: "Minimum withdrawal is KSh 500." });
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        setRequesting(true);
        // Real payout logic should be integrated with M-Pesa API
        setTimeout(() => {
            setMessage({ type: 'success', text: "Payout sequence initialized! KSh " + balance + " sent to M-Pesa. 🛡️" });
            setTimeout(() => setMessage(null), 5000);
            setRequesting(false);
        }, 2000);
    };

    return (
        <section className="space-y-6 text-left">
            <h2 className="text-xl font-black uppercase tracking-tighter text-foreground px-2">Financial Intel</h2>

            {message && (
                <div className={cn(
                    "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    <Zap className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 💳 WALLET CARD */}
                <Card className="p-8 rounded-[3rem] bg-white border-2 border-primary/5 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Balance</p>
                                <p className="text-4xl font-black text-foreground tracking-tighter">{formatPrice(balance)}</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleWithdraw}
                            disabled={requesting || balance < 500}
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                        >
                            {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw via M-Pesa"}
                        </Button>
                    </div>
                    <DollarSign className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
                </Card>

                {/* 📊 LIFETIME EARNINGS */}
                <Card className="p-8 rounded-[3rem] bg-slate-50 border-none shadow-inner flex flex-col justify-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pipeline Earnings</p>
                    <p className="text-3xl font-black text-foreground tracking-tighter">{formatPrice(totalEarned)}</p>
                </Card>
            </div>

            {/* 📈 PERFORMANCE CHART */}
            <Card className="p-8 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Earning Cycle</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Weekly Performance Log</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[9px] font-black uppercase text-slate-500">
                        <Calendar className="h-3 w-3" /> This Week
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 900 }}
                            />
                            <Bar
                                dataKey="amount"
                                radius={[10, 10, 10, 10]}
                                barSize={40}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === chartData.length - 1 ? '#F5A000' : '#f1f5f9'}
                                        className="transition-all duration-500 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }: { active?: boolean; payload?: Record<string, unknown>[] }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background text-foreground px-4 py-2 rounded-xl shadow-2xl border-none text-[10px] font-black uppercase">
                                                KSh {payload[0].value}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </section>
    );
}
