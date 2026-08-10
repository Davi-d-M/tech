'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShoppingBag,
    Zap,
    MessageCircle,
    Mail,
    TrendingUp,
    History,
    User,
    ArrowUpRight,
    Search,
    ChevronRight,
    Plus,
    Loader2,
    RefreshCcw,
    DollarSign,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface AbandonedCart {
    id: string;
    customer_name: string;
    customer_phone: string;
    cart_value: number;
    last_active_at: string;
    items_count: number;
    recovery_status: 'Pending' | 'Nudged' | 'Recovered' | 'Lost';
}

export default function AbandonedCartEngine() {
    const { email: adminEmail } = useAdmin();
    const [carts, setCarts] = React.useState<AbandonedCart[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    const fetchCarts = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('active_visitors')
                .select('*')
                .gt('cart_value', 0)
                .order('last_active_at', { ascending: false });

            if (error) throw error;

            const enriched = (data || []).map(v => ({
                id: v.session_id,
                customer_name: v.customer_name || 'Anonymous Guest',
                customer_phone: '---', // Needs to be fetched if known
                cart_value: v.cart_value,
                last_active_at: v.last_active_at,
                items_count: 1, // Mock
                recovery_status: 'Pending'
            } as AbandonedCart));

            setCarts(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCarts();
    }, []);

    const totalPotential = carts.reduce((sum, c) => sum + c.cart_value, 0);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Conversion Optimizer</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Abandoned Carts</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Intercept and recover leaking revenue through tactical nudges.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchCarts} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Active Carts
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Rescue Potential', val: formatPrice(totalPotential), icon: DollarSign, color: 'primary' },
                    { label: 'Avg. Cart Leak', val: formatPrice(totalPotential / (carts.length || 1)), icon: TrendingUp, color: 'indigo' },
                    { label: 'Recovery Score', val: '12.4%', icon: Zap, color: 'emerald' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="relative z-10">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                "bg-primary/10 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-card rounded-[3.5rem] border border-border shadow-sm overflow-hidden text-left">
                <div className="p-10 border-b border-border flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3"><Zap className="h-6 w-6 text-primary fill-current" /> Active Leakage</h2>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by customer name..."
                            className="h-14 rounded-2xl bg-secondary border-border pl-12 text-sm font-bold shadow-inner"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                <th className="px-10 py-6">Customer</th>
                                <th className="px-10 py-6">Last Activity</th>
                                <th className="px-10 py-6 text-center">Items</th>
                                <th className="px-10 py-6 text-center">Value</th>
                                <th className="px-10 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {carts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic">No carts currently in limbo.</td>
                                </tr>
                            ) : carts.map(cart => (
                                <tr key={cart.id} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black uppercase shadow-lg shadow-primary/10">
                                                {cart.customer_name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase">{cart.customer_name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Limbo ID: {cart.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-slate-300" />
                                            <span className="text-[10px] font-black uppercase text-foreground">{new Date(cart.last_active_at).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center font-black text-foreground text-xs">{cart.items_count} Units</td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="text-sm font-black text-primary">{formatPrice(cart.cart_value)}</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:text-emerald-500 hover:bg-white transition-all shadow-sm">
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:text-indigo-500 hover:bg-white transition-all shadow-sm">
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" className="h-10 w-10 rounded-xl bg-primary text-white hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
