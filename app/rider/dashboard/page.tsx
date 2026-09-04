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
    Loader2,
    ShieldCheck,
    Key,
    Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { Input } from '@/components/ui/input';

interface Mission {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    status: string;
    address: string;
    created_at: string;
}

interface TitanNode {
    toggleTracking: (active: boolean) => void;
}

export default function RiderDashboard() {
    const router = useRouter();
    const { email: riderPhone, tenant_id } = useAdmin();
    const [loading, setLoading] = React.useState(true);
    const [missions, setMissions] = React.useState<Mission[]>([]);
    const [stats, setStats] = React.useState({ completed: 0, earnings: 0 });
    const [activeTab, setActiveTab] = React.useState<'missions' | 'stats' | 'profile'>('missions');

    // PIN Change State
    const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
    const [newPin, setNewPin] = React.useState('');
    const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);

    const fetchMissions = React.useCallback(async () => {
        setLoading(true);
        if (!supabase || !riderPhone) return;
        try {
            // Securely filter by current rider's phone and tenant
            const query = supabase
                .from('orders')
                .select('*')
                .eq('rider_phone', riderPhone)
                .eq('tenant_id', tenant_id)
                .in('status', ['Dispatched', 'Processing', 'Delivered'])
                .order('created_at', { ascending: false });

            const { data } = await query.limit(10);

            setMissions((data as Mission[]) || []);

            const completed = (data || []).filter(m => m.status === 'Delivered').length;
            const earnings = (data || []).filter(m => m.status === 'Delivered').reduce((s) => s + 450, 0); // Flat KSh 450/drop

            setStats({ completed, earnings });
        } finally {
            setLoading(false);
        }
    }, [riderPhone, tenant_id]);

    React.useEffect(() => {
        fetchMissions();

        // Initialize high-velocity tracking node
        const win = window as unknown as Window & { TitanNode?: TitanNode };
        if (typeof window !== 'undefined' && win.TitanNode?.toggleTracking) {
            win.TitanNode.toggleTracking(true);
        }
    }, [fetchMissions]);

    const handleLogout = () => {
        document.cookie = 'admin_session=; path=/; max-age=0';
        router.push('/apex-portal');
    };

    const handleChangePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(newPin)) {
            alert("PIN must be exactly 4 digits.");
            return;
        }

        setIsUpdatingPin(true);
        try {
            const res = await fetch('/api/rider/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_pin', newPin })
            });

            if (res.ok) {
                alert("PIN updated successfully! Use your new PIN for the next login.");
                setIsPinModalOpen(false);
                setNewPin('');
            } else {
                const data = await res.json();
                throw new Error(data.error || "Update failed.");
            }
        } catch (err: unknown) {
            alert((err as Error).message);
        } finally {
            setIsUpdatingPin(false);
        }
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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Connected</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-none">Fleet Dashboard</h1>
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
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Tasks</p>
                        <p className="text-2xl font-black">{stats.completed} Done</p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8 mt-4">
                {activeTab === 'missions' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Active Mission Alert */}
                        <Card className="p-6 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden border-none">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={18} className="animate-pulse" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Active Task</h3>
                                </div>
                                <p className="text-lg font-bold leading-tight">Proceed to Westlands Central for pickup of Order #10291</p>
                                <Button className="w-full h-14 rounded-2xl bg-white text-indigo-600 font-black uppercase text-xs tracking-widest shadow-xl">Start Navigation</Button>
                            </div>
                            <Truck className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
                        </Card>

                        {/* Mission Stream */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Recent Mission History</h3>
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
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                         <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Earnings Insights</h3>
                         <div className="grid gap-6">
                            <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Velocity</p>
                                    <h4 className="text-2xl font-black text-foreground">+12.5% vs Last Week</h4>
                                </div>
                            </Card>
                         </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Rider Identity</h3>

                         <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">Rider Profile</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone size={12} className="text-slate-300" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rider ID: {riderPhone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 space-y-4">
                                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group transition-all hover:bg-white hover:shadow-lg hover:border-primary/10 border border-transparent">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><ShieldCheck size={20} /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Security Access</span>
                                    </div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded">Active</span>
                                </div>

                                <button
                                    onClick={() => setIsPinModalOpen(true)}
                                    className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl group transition-all hover:bg-white hover:shadow-lg hover:border-primary/10 border border-transparent"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><Key size={20} /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Update Security PIN</span>
                                    </div>
                                    <Zap size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
                                </button>
                            </div>

                            <Button onClick={handleLogout} variant="ghost" className="w-full h-14 rounded-2xl text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50">
                                Sign Out
                            </Button>
                         </Card>
                    </div>
                )}
            </main>

            {/* Tactical Navigation Bar */}
            <nav className="fixed bottom-8 left-6 right-8 h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl flex items-center justify-around px-8 z-50">
                <button
                    onClick={() => setActiveTab('missions')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === 'missions' ? "text-primary" : "text-slate-300 hover:text-foreground"
                    )}
                >
                    <Truck size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Missions</span>
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === 'stats' ? "text-primary" : "text-slate-300 hover:text-foreground"
                    )}
                >
                    <TrendingUp size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        activeTab === 'profile' ? "text-primary" : "text-slate-300 hover:text-foreground"
                    )}
                >
                    <User size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </nav>

            {/* PIN CHANGE MODAL */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-6">
                    <Card className="max-w-sm w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 shadow-sm"><Key size={24} /></div>
                            <h3 className="text-xl font-black uppercase text-foreground">Update Secret PIN</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Authorization Override Required</p>
                        </div>

                        <form onSubmit={handleChangePin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">New 4-Digit PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-center font-black text-lg tracking-widest"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={isUpdatingPin}
                                    className="flex-1 h-14 rounded-xl bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                                >
                                    {isUpdatingPin ? <Loader2 className="animate-spin h-4 w-4" /> : 'Commit'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPinModalOpen(false)}
                                    className="flex-1 h-14 rounded-xl border-slate-200 font-black uppercase text-[10px]"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
