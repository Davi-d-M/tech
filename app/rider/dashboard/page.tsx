'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Truck,
    MapPin,
    Zap,
    TrendingUp,
    User,
    Activity,
    LogOut,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Mission {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    status: string;
    address: string;
    created_at: string;
}

export default function RiderDashboard() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [missions, setMissions] = React.useState<Mission[]>([]);
    const [stats, setStats] = React.useState({ completed: 0, earnings: 0 });

    const fetchMissions = React.useCallback(async () => {
        setLoading(true);
        if (!supabase) return;
        try {
            // In a real scenario, we'd filter by the authenticated rider's phone
            const { data } = await supabase
                .from('orders')
                .select('*')
                .in('status', ['Dispatched', 'Processing', 'Delivered'])
                .order('created_at', { ascending: false })
                .limit(5);

            setMissions((data as Mission[]) || []);

            const completed = (data || []).filter(m => m.status === 'Delivered').length;
            const earnings = (data || []).filter(m => m.status === 'Delivered').reduce((s) => s + 450, 0); // Flat KSh 450/drop for demo

            setStats({ completed, earnings });
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    const handleLogout = () => {
        document.cookie = 'admin_session=; path=/; max-age=0';
        router.push('/admin/login');
    };

    if (loading && missions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary h-10 w-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-left pb-32">
            {/* High-Velocity Header */}
            <header className="bg-white p-8 pt-12 border-b border-slate-100 sticky top-0 z-50">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Titan Node Active</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-none">Titan Console</h1>
                    </div>
                    <button onClick={handleLogout} className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-3xl bg-primary text-white space-y-1 shadow-lg shadow-primary/20">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Earnings</p>
                        <p className="text-2xl font-black">{formatPrice(stats.earnings)}</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Missions</p>
                        <p className="text-2xl font-black">{stats.completed} Done</p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8 mt-4">
                {/* Active Mission Alert */}
                <Card className="p-6 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden border-none">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <Activity size={18} className="animate-pulse" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Active Dispatch</h3>
                        </div>
                        <p className="text-lg font-bold leading-tight">Proceed to Westlands Central for pickup of Payload #10291</p>
                        <Button className="w-full h-14 rounded-2xl bg-white text-indigo-600 font-black uppercase text-xs tracking-widest shadow-xl">Start Navigation</Button>
                    </div>
                    <Truck className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
                </Card>

                {/* Mission Stream */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Chronological Missions</h3>
                    <div className="space-y-4">
                        {missions.map(m => (
                            <Card key={m.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                        m.status === 'Delivered' ? "bg-emerald-50 text-emerald-500" : "bg-primary/10 text-primary"
                                    )}>
                                        {m.status === 'Delivered' ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{m.id.toString().substring(0,5)}</p>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                                m.status === 'Delivered' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                            )}>{m.status}</span>
                                        </div>
                                        <h4 className="font-black text-foreground uppercase tracking-tight text-sm truncate max-w-[150px]">{m.customer_name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1 truncate max-w-[150px]"><MapPin size={10} /> {m.address || 'Nairobi Area'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-foreground">{formatPrice(m.total_price)}</p>
                                    <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Fee: KSh 450</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            {/* Tactical Navigation Bar */}
            <nav className="fixed bottom-8 left-6 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl flex items-center justify-around px-8 z-50">
                <button className="text-primary flex flex-col items-center gap-1">
                    <Truck size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Missions</span>
                </button>
                <button className="text-slate-300 flex flex-col items-center gap-1 hover:text-foreground transition-colors">
                    <TrendingUp size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
                </button>
                <button className="text-slate-300 flex flex-col items-center gap-1 hover:text-foreground transition-colors">
                    <User size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </nav>
        </div>
    );
}
