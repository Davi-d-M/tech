'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Truck,
  RefreshCcw,
  XCircle,
  MapPin,
  Loader2,
  Zap,
  Activity,
  Users,
  ShieldCheck,
  BatteryMedium,
  Trophy,
  Search,
  Star,
  Package,
  PackageCheck,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/lib/useSettings';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LiveDispatchMap = dynamic(() => import('@/components/admin/dispatch/LiveDispatchMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-secondary flex items-center justify-center rounded-[3rem] border border-border">
            <div className="text-center space-y-4">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Warming Satellite Uplink...</p>
            </div>
        </div>
    )
});

interface Rider {
    id: number;
    rider_name: string;
    rider_phone: string;
    vehicle_type: 'Motorbike' | 'Bike' | 'Car' | 'Van';
    vehicle_reg?: string;
    pin: string;
    current_location: string;
    status: 'Idle' | 'Delivering' | 'Offline' | 'Delayed' | 'Break';
    battery_level: number;
    total_deliveries: number;
    rating: number;
    area_zone: string;
    max_deliveries: number;
    weekly_salary: number;
    health_score: number;
    acceptance_rate?: number;
    wallet?: { balance: number; total_earned: number };
    can_accept_orders: boolean;
    can_reject_orders: boolean;
    can_view_earnings: boolean;
}

export default function AdminDispatchPage() {
    useAdmin();
    const { settings } = useSettings();
    const [riders, setRiders] = useState<Rider[]>([]);
    const [orders, setOrders] = useState<{ id: number; status: string; customer_name: string; customer_email?: string; rider_name?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [assigning, setAssigning] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [showHeatmap, setShowHeatmap] = useState(false);

    const fetchData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // Fetch Riders with Wallet info
            const { data: ridersData } = await supabase.from('rider_status').select(`
                *,
                wallet:rider_wallets(balance, total_earned)
            `).order('rider_name', { ascending: true });

            const { data: ordersData } = await supabase.from('orders').select('*').neq('status', 'Delivered');

            setRiders((ridersData as unknown as Rider[]) || []);
            setOrders(ordersData || []);
        } catch {
            console.error("Pipeline link unstable.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const total = riders.length;
        const active = riders.filter(r => r.status !== 'Offline').length;
        const delivering = riders.filter(r => r.status === 'Delivering').length;
        const standby = riders.filter(r => r.status === 'Idle').length;

        const avgHealth = total > 0
            ? Math.round(riders.reduce((sum, r) => sum + (r.health_score || 100), 0) / total)
            : 100;

        return { total, active, delivering, standby, avgHealth };
    }, [riders]);

    const filteredRiders = riders.filter(r =>
        r.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.area_zone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssignRider = async (orderId: number, rider: Rider) => {
        if (!supabase) return;
        setAssigning(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    rider_name: rider.rider_name,
                    rider_phone: rider.rider_phone,
                    status: 'Dispatched'
                })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(o => o.id !== orderId));

            const targetOrder = orders.find(o => o.id === orderId);
            if (targetOrder?.customer_email) {
                fetch('/api/admin/notify-customer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: targetOrder.customer_email,
                        orderId: orderId,
                        status: 'Dispatched',
                        name: targetOrder.customer_name
                    })
                }).catch(() => {});
            }

            setMessage({ type: 'success', text: `Unit ${rider.rider_name} dispatched! 🚚` });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            console.error("Dispatch sequence failed.");
            setMessage({ type: 'error', text: 'Dispatch sequence failed.' });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logistics Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Logistics Center</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time rider deployment and fleet coordination hub.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        variant="outline"
                        className={cn(
                            "rounded-xl h-12 px-6 border-border font-black uppercase text-[10px] tracking-widest transition-all active:scale-95",
                            showHeatmap ? "bg-amber-500 text-white border-amber-500" : "bg-card text-foreground"
                        )}
                    >
                        <Zap className="h-4 w-4 mr-2" /> Heatmap {showHeatmap ? 'On' : 'Off'}
                    </Button>
                    <Link href="/rider/dashboard">
                        <Button variant="outline" className="rounded-xl h-12 px-6 border-primary/20 bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                            <Truck className="h-4 w-4 mr-2" /> Rider View
                        </Button>
                    </Link>
                    <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg active:scale-95">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync System
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    <Zap className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            {/* Top Stats HUD */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Fleet', val: stats.total, icon: Users },
                    { label: 'Active', val: stats.active, icon: Activity },
                    { label: 'Delivering', val: stats.delivering, icon: Truck },
                    { label: 'Standby', val: stats.standby, icon: Zap },
                    { label: 'Avg Health', val: `${stats.avgHealth}%`, icon: ShieldCheck },
                ].map((item) => (
                    <Card key={item.label} className="p-6 rounded-3xl border border-border bg-card shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all">
                        <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{item.label}</p>
                            <h3 className="text-xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <div className="h-[650px] w-full relative">
                        <LiveDispatchMap riders={riders as any} onSelectRider={(r: any) => setSelectedRider(r)} />
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2 text-left">
                            <div className="flex items-center gap-3">
                                <Zap className="h-6 w-6 text-primary animate-pulse" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Live Dispatch Feed</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {orders.filter(o => o.status === 'Pending').length === 0 ? (
                                <div className="p-16 text-center bg-card rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center gap-4">
                                    <PackageCheck className="h-12 w-12 text-muted" />
                                    <p className="text-sm font-black text-muted-foreground uppercase italic">Pipeline clear.</p>
                                </div>
                            ) : orders.filter(o => o.status === 'Pending').slice(0, 3).map(order => {
                                const candidates = riders.filter(r => r.status === 'Idle').sort((a, b) => b.health_score - a.health_score);
                                const recommendation = candidates[0];

                                return (
                                    <Card key={order.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8 group hover:shadow-2xl transition-all">
                                        <div className="flex items-center gap-6 flex-1 text-left">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                <Package className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-foreground uppercase text-lg tracking-tighter">Order #{order.id}</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" /> {order.customer_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            {recommendation && (
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[8px] font-black uppercase text-primary mb-1 animate-pulse">Smart Match</p>
                                                    <p className="text-sm font-black text-foreground uppercase">{recommendation.rider_name}</p>
                                                </div>
                                            )}
                                            <Button
                                                onClick={() => recommendation && handleAssignRider(order.id, recommendation)}
                                                disabled={!recommendation || assigning === order.id}
                                                className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest active:scale-95 group-hover:scale-105"
                                            >
                                                {assigning === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    <div className="space-y-6 text-left">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Unit Inventory</h2>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search Rider..."
                                    className="h-12 rounded-2xl bg-card border-border pl-12 text-[10px] font-black uppercase tracking-widest w-72 shadow-sm focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredRiders.map(rider => (
                                <Card
                                    key={rider.id}
                                    onClick={() => setSelectedRider(rider)}
                                    className={cn(
                                        "p-8 rounded-[2.5rem] bg-card border border-border shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all cursor-pointer",
                                        rider.status === 'Offline' && "opacity-60"
                                    )}
                                >
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground text-xl font-black shadow-sm group-hover:scale-105 transition-transform">
                                                    {rider.rider_name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-foreground uppercase text-base tracking-tight">{rider.rider_name}</h3>
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{rider.status}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-primary/5 text-primary border-primary/10">
                                                {rider.health_score}% Health
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-6 border-y border-border">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><BatteryMedium className="h-2.5 w-2.5 text-primary" /> Battery</p>
                                                <p className="text-xl font-black text-foreground">{rider.battery_level}%</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground flex items-center justify-end gap-1.5"><Star className="h-2.5 w-2.5 text-primary fill-current" /> Rating</p>
                                                <p className="text-xl font-black text-foreground">{rider.rating}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <Card className="p-8 rounded-[3.5rem] border border-border bg-card shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-amber-500" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Logistics Legends</h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Mission Intel Sidebar */}
            {selectedRider && (
                <div
                    className="fixed inset-0 z-[200] flex justify-end bg-background/20 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSelectedRider(null)}
                >
                    <aside
                        className="w-[450px] h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto no-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-10 space-y-10 text-left">
                            <header className="flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-[2rem] bg-secondary border border-border flex items-center justify-center text-foreground text-2xl font-black relative">
                                        {selectedRider.rider_name.substring(0, 2).toUpperCase()}
                                        <div className={cn(
                                            "absolute -top-1 -right-1 h-6 w-6 rounded-full border-4 border-card",
                                            selectedRider.status === 'Offline' ? "bg-slate-300" : "bg-emerald-500 animate-pulse"
                                        )} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{selectedRider.rider_name}</h2>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Unit Status: {selectedRider.status}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRider(null)} className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted transition-colors border border-border"><XCircle className="h-6 w-6" /></button>
                            </header>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-secondary border border-border space-y-2">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase flex items-center gap-2"><CreditCard className="h-3 w-3" /> Balance</p>
                                    <p className="text-xl font-black text-foreground">{formatPrice(selectedRider.wallet?.balance || 0)}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary border border-border space-y-2">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase flex items-center gap-2"><Trophy className="h-3 w-3" /> Lifetime</p>
                                    <p className="text-xl font-black text-foreground">{formatPrice(selectedRider.wallet?.total_earned || 0)}</p>
                                </div>
                            </div>

                            {selectedRider.status === 'Delivering' && (
                                <div className="p-8 rounded-[2.5rem] bg-primary/5 border-2 border-primary/20 space-y-8 relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white"><Package className="h-5 w-5" /></div>
                                            <h3 className="text-lg font-black uppercase text-foreground">Mission Live</h3>
                                        </div>
                                        <span className="px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full animate-pulse uppercase">Tactical Pursuit</span>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Active Order</span>
                                            <span className="text-xs font-black text-foreground">#10492</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Payload</span>
                                            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">AMAYA AM-05 + 1 Other</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">ETA to Extraction</span>
                                            <span className="text-sm font-black text-primary uppercase">12 Minutes</span>
                                        </div>
                                    </div>

                                    <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest relative z-10 shadow-xl shadow-primary/20">
                                        View Flight Path
                                    </Button>

                                    <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12" />
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Communications</h3>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={() => window.open(`tel:${selectedRider.rider_phone}`, '_self')}
                                        variant="outline"
                                        className="flex-1 h-14 rounded-2xl border-border text-foreground font-black uppercase text-[10px] hover:bg-secondary transition-all"
                                    >
                                        <Phone className="h-4 w-4 mr-2" /> Call Unit
                                    </Button>
                                    <Button
                                        onClick={() => window.open(`https://wa.me/${selectedRider.rider_phone}`, '_blank')}
                                        className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                                    >
                                        WhatsApp
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-border flex flex-col gap-4">
                                <Button
                                    onClick={() => {
                                        const baseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin) : 'https://tech-paxv.onrender.com';
                                        const link = `${baseUrl}/rider/dashboard?phone=${selectedRider.rider_phone}`;
                                        navigator.clipboard.writeText(link);
                                        setMessage({ type: 'success', text: "Magic Link Copied! 🔗" });
                                        setTimeout(() => setMessage(null), 3000);
                                    }}
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-indigo-200 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all"
                                >
                                    Copy Rider Access Link
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`https://wa.me/${settings.contact.whatsapp}?text=Retire unit: ${selectedRider.rider_name}`, '_blank')}
                                    className="w-full h-14 rounded-2xl border-rose-100 text-rose-400 font-black uppercase text-[10px] hover:bg-rose-50 transition-all"
                                >
                                    Decommission Unit
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
