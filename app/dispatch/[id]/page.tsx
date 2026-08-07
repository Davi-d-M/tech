'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Phone,
    Navigation,
    Package,
    User,
    MapPin,
    Clock,
    AlertCircle,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface OrderDispatch {
    id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    note: string;
    created_at: string;
    product_id: number;
    quantity: number;
    size: string;
}

export default function DispatchPortal() {
    const { id } = useParams();
    const [order, setOrder] = useState<OrderDispatch | null>(null);
    const [productName, setProductName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            if (!supabase || !id) return;
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data) {
                    setOrder(data as OrderDispatch);
                    const { data: prodData } = await supabase
                        .from('products')
                        .select('name')
                        .eq('id', data.product_id)
                        .single();
                    if (prodData) setProductName(prodData.name);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
            <AlertCircle className="h-16 w-16 text-rose-500 mb-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Dispatch Expired</h1>
            <p className="text-slate-400 mt-2 font-medium">The order could not be located in our elite pipeline.</p>
            <Link href="/" className="mt-8">
                <Button variant="outline" className="rounded-xl border-slate-200">Return to Base</Button>
            </Link>
        </div>
    );

    const handleCall = () => {
        window.location.href = `tel:${order.customer_phone}`;
    };

    const handleNavigate = () => {
        const query = encodeURIComponent(order.note || order.customer_name);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 text-left">
            <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                        <Package className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Rider Command</h1>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                            Order #{order.id} • Active
                        </p>
                    </div>
                </header>

                {/* Status HUD */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-left">
                        <Clock className="h-5 w-5 text-slate-400" />
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipeline</p>
                            <p className="text-xs font-black text-slate-900 uppercase">Current Phase</p>
                        </div>
                    </div>
                    <span className="px-5 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                        {order.status}
                    </span>
                </div>

                {/* Mission Data */}
                <div className="bg-white rounded-[3rem] p-10 space-y-10 text-slate-900 shadow-2xl border border-slate-50 relative overflow-hidden">
                    {/* Customer */}
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100"><User className="h-6 w-6" /></div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Recipient</p>
                            <p className="text-xl font-black uppercase tracking-tight truncate text-slate-900">{order.customer_name}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100"><MapPin className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Location</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">&quot;{order.note || 'Contact recipient for entry code or precise drop point.'}&quot;</p>
                        </div>
                    </div>

                    {/* Inventory Link */}
                    <div className="pt-8 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Package Authentication</p>
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 group">
                            <div className="min-w-0 text-left">
                                <p className="text-xs font-black uppercase text-slate-900 truncate">{productName || 'Tech Payload'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{order.size} Edition</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                x{order.quantity}
                            </div>
                        </div>
                    </div>

                    {/* Subtle BG Zap */}
                    <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12" />
                </div>

                {/* Strategic Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={handleCall}
                        className="h-24 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white flex-col gap-2 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        <Phone className="h-7 w-7" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Voice Link</span>
                    </Button>
                    <Button
                        onClick={handleNavigate}
                        className="h-24 rounded-[2rem] bg-primary hover:bg-primary/90 text-white flex-col gap-2 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Navigation className="h-7 w-7" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Navigate</span>
                    </Button>
                </div>

                <div className="text-center pt-8 space-y-2 opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Apexstores Logistics Command</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Operational Security Active</p>
                </div>
            </div>
        </div>
    );
}
