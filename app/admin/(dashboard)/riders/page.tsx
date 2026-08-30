'use client';

import * as React from 'react';
import {
  Phone,
  Truck,
  Search,
  ChevronRight,
  ShieldAlert,
  Activity,
  User,
  ShieldCheck,
  CreditCard,
  XCircle,
  RefreshCcw,
  Star,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';
import Image from 'next/image';

interface Rider {
    id: number;
    rider_name: string;
    rider_phone: string;
    vehicle_type: string;
    vehicle_reg?: string;
    id_number?: string;
    license_number?: string;
    plate_number?: string;
    rider_photo_url?: string;
    vehicle_photo_url?: string;
    id_photo_front_url?: string;
    id_photo_back_url?: string;
    license_photo_url?: string;
    verification_status: 'Pending' | 'Verified' | 'Rejected';
    status: 'Idle' | 'Delivering' | 'Offline' | 'Delayed' | 'Break';
    rating: number;
    total_deliveries: number;
    total_missions_completed: number;
    avg_delivery_speed: number;
    area_zone: string;
    last_battery_sync?: string;
    battery_level?: number;
    pin: string;
}

interface MissionHistory {
    id: number;
    customer_name: string;
    total_price: number;
    status: string;
    created_at: string;
    dispatched_at?: string;
    delivered_at?: string;
    rider_rating?: number;
}

export default function AdminRidersPage() {
    const { role, email, permissions } = useAdmin();
    const [riders, setRiders] = React.useState<Rider[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [viewingDetails, setViewingDetails] = React.useState<Rider | null>(null);
    const [riderHistory, setRiderHistory] = React.useState<MissionHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadRiders = async () => {
        if (!supabase) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('rider_status')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRiders(data as Rider[]);
        } catch (err) {
            console.error('Error loading riders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadRiders();
    }, []);

    const loadRiderHistory = async (phone: string) => {
        if (!supabase) return;
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, customer_name, total_price, status, created_at, dispatched_at, delivered_at, rider_rating')
                .eq('rider_phone', phone)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRiderHistory(data as MissionHistory[]);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const updateRiderStatus = async (phone: string, status: 'Verified' | 'Rejected', customPin?: string) => {
        if (!supabase) return;
        try {
            const updatePayload: { verification_status: 'Verified' | 'Rejected'; pin?: string } = { verification_status: status };
            if (customPin) updatePayload.pin = customPin;

            const { error } = await supabase
                .from('rider_status')
                .update(updatePayload)
                .eq('rider_phone', phone);

            if (error) throw error;

            await logAuditAction(email, 'UPDATE_RIDER_VERIFICATION', { phone, status, pin_assigned: !!customPin });
            setRiders(prev => prev.map(r => r.rider_phone === phone ? { ...r, verification_status: status, pin: customPin || r.pin } : r));
            setMessage({ type: 'success', text: `Unit ${phone} marked as ${status}.` });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Verification update failed.' });
        }
    };

    const filteredRiders = React.useMemo(() => {
        const query = searchQuery.toLowerCase();
        return riders.filter(r => {
            const matchesSearch = r.rider_name.toLowerCase().includes(query) || r.rider_phone.includes(query);
            const matchesStatus = statusFilter === 'all' || r.verification_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [riders, searchQuery, statusFilter]);

    if (role !== 'owner' && role !== 'admin' && role !== 'staff') {
        return (
            <div className="p-24 flex flex-col items-center justify-center text-center">
                <ShieldAlert className="h-16 w-16 text-rose-500 mb-6" />
                <h2 className="text-2xl font-black uppercase text-foreground">Access Denied</h2>
                <p className="text-slate-500 mt-2">Only authorized personnel can view the logistics directory.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Rider Hub</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Fleet onboarding management and identity verification.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadRiders} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Sync Fleet
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    <Activity className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {['all', 'Pending', 'Verified', 'Rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                                statusFilter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search Unit Identity..."
                        className="h-14 pl-12 rounded-2xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] whitespace-nowrap">
                            <th className="px-8 py-6">Rider Identity</th>
                            <th className="px-8 py-6">Mission Stats</th>
                            <th className="px-8 py-6">Verification Protocol</th>
                            <th className="px-8 py-6">Sensitive Intel</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                        ) : filteredRiders.length === 0 ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase text-[10px] italic">No riders detected on the grid.</td></tr>
                        ) : filteredRiders.map((rider) => (
                            <tr key={rider.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-secondary border border-slate-100 flex items-center justify-center text-foreground font-black text-xl shadow-sm">
                                            {rider.rider_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground uppercase text-base tracking-tighter leading-none">{rider.rider_name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2"><Phone className="h-3 w-3" /> {rider.rider_phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                                            <span className="text-xs font-black text-foreground">{rider.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-3.5 w-3.5 text-slate-300" />
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{rider.total_deliveries} Drops</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                        rider.verification_status === 'Verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        rider.verification_status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                        "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                    )}>
                                        {rider.verification_status}
                                    </span>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Unit Credentials</h3>
                                            <div className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[8px] font-black uppercase text-indigo-600">
                                                {role === 'owner' ? 'Full Access' : 'Limited View'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">National ID</p>
                                                <p className="text-sm font-black text-foreground">
                                                    {role === 'owner' || permissions?.can_view_sensitive_rider_data
                                                        ? rider.id_number || 'NOT LOGGED'
                                                        : 'S-XXXXXX-X'}
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Plate Number</p>
                                                <p className="text-sm font-black text-foreground">{rider.plate_number || 'KXX 000X'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Face Profile</p>
                                                <div className="h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                    {rider.rider_photo_url ? (
                                                        <Image src={rider.rider_photo_url} alt="" fill className="object-cover" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={16} /></div>}
                                                </div>
                                            </div>

                                            {(role === 'owner' || permissions?.can_view_sensitive_rider_data) && (
                                                <>
                                                    <div className="space-y-2">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase ml-2">ID Front</p>
                                                        <div className="h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                            {rider.id_photo_front_url ? (
                                                                <Image src={rider.id_photo_front_url} alt="" fill className="object-cover" />
                                                            ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><CreditCard size={16} /></div>}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase ml-2">License Doc</p>
                                                        <div className="h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                            {rider.license_photo_url ? (
                                                                <Image src={rider.license_photo_url} alt="" fill className="object-cover" />
                                                            ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><Truck size={16} /></div>}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setViewingDetails(rider); loadRiderHistory(rider.rider_phone); }}
                                            className="h-10 px-4 rounded-xl text-primary font-black uppercase text-[8px] tracking-widest hover:bg-white hover:shadow-xl transition-all"
                                        >
                                            Insight <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                        {rider.verification_status !== 'Verified' && (
                                            <Button
                                                onClick={() => {
                                                    const pin = Math.floor(1000 + Math.random() * 9000).toString();
                                                    updateRiderStatus(rider.rider_phone, 'Verified', pin);
                                                    alert(`Unit Authorized! Assigned PIN: ${pin}`);
                                                }}
                                                className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Authorize
                                            </Button>
                                        )}
                                        {rider.verification_status === 'Pending' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => updateRiderStatus(rider.rider_phone, 'Rejected')}
                                                className="h-10 px-6 rounded-xl border-rose-100 text-rose-500 font-black uppercase text-[8px] tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all"
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-2" /> Decommission
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* UNIT INTEL OVERLAY */}
            {viewingDetails && (
                <div
                    className="fixed inset-0 z-[200] flex justify-end bg-background/20 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setViewingDetails(null)}
                >
                    <aside
                        className="w-full sm:w-[600px] h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto no-scrollbar flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-[2rem] bg-secondary border border-border flex items-center justify-center text-foreground text-2xl font-black relative overflow-hidden shadow-xl">
                                    {viewingDetails.rider_photo_url ? (
                                        <Image src={viewingDetails.rider_photo_url} alt="" fill className="object-cover" />
                                    ) : viewingDetails.rider_name.substring(0, 2).toUpperCase()}
                                    <div className={cn(
                                        "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card",
                                        viewingDetails.status === 'Offline' ? "bg-slate-300" : "bg-emerald-500 animate-pulse"
                                    )} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{viewingDetails.rider_name}</h2>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">{viewingDetails.status} • {viewingDetails.vehicle_type}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="h-12 w-12 rounded-xl hover:bg-secondary flex items-center justify-center text-muted transition-colors border border-border shadow-sm"><XCircle className="h-6 w-6" /></button>
                        </header>

                        <div className="p-8 space-y-10 flex-1">
                            {/* Performance HUD */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-3xl bg-secondary border border-border space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                                        <p className="text-lg font-black text-foreground">{viewingDetails.rating}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-3xl bg-secondary border border-border space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Avg Speed</p>
                                    <p className="text-lg font-black text-foreground">{viewingDetails.avg_delivery_speed || '12'}m</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-secondary border border-border space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Missions</p>
                                    <p className="text-lg font-black text-foreground">{viewingDetails.total_missions_completed || viewingDetails.total_deliveries}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-secondary border border-border space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Battery</p>
                                    <p className="text-lg font-black text-foreground">{viewingDetails.battery_level || '85'}%</p>
                                </div>
                            </div>

                            {/* Privacy Shield: Sensitive Data */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Unit Credentials</h3>
                                    <div className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[8px] font-black uppercase text-indigo-600">
                                        {role === 'owner' ? 'Full Access' : 'Limited View'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">National ID</p>
                                        <p className="text-sm font-black text-foreground">
                                            {role === 'owner' || permissions?.can_view_sensitive_rider_data
                                                ? viewingDetails.id_number || 'NOT LOGGED'
                                                : 'S-XXXXXX-X'}
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Plate Number</p>
                                        <p className="text-sm font-black text-foreground">{viewingDetails.plate_number || 'KXX 000X'}</p>
                                    </div>
                                </div>

                                {/* Legal Documents Gallery */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Vehicle Photo</p>
                                        <div className="h-32 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                            {viewingDetails.vehicle_photo_url ? (
                                                <Image src={viewingDetails.vehicle_photo_url} alt="" fill className="object-cover hover:scale-110 transition-transform cursor-zoom-in" />
                                            ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><Truck size={20} /></div>}
                                        </div>
                                    </div>

                                    {(role === 'owner' || permissions?.can_view_sensitive_rider_data) && (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-[7px] font-black text-slate-400 uppercase ml-2">ID Front</p>
                                                <div className="h-32 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                    {viewingDetails.id_photo_front_url ? (
                                                        <Image src={viewingDetails.id_photo_front_url} alt="" fill className="object-cover hover:scale-110 transition-transform cursor-zoom-in" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={20} /></div>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[7px] font-black text-slate-400 uppercase ml-2">ID Back</p>
                                                <div className="h-32 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                    {viewingDetails.id_photo_back_url ? (
                                                        <Image src={viewingDetails.id_photo_back_url} alt="" fill className="object-cover hover:scale-110 transition-transform cursor-zoom-in" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={20} /></div>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 lg:col-span-3">
                                                <p className="text-[7px] font-black text-slate-400 uppercase ml-2">Drivers License</p>
                                                <div className="h-40 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
                                                    {viewingDetails.license_photo_url ? (
                                                        <Image src={viewingDetails.license_photo_url} alt="" fill className="object-cover hover:scale-110 transition-transform cursor-zoom-in" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><CreditCard size={24} /></div>}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mission History Tab */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Mission History</h3>
                                <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-white/50 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                                    <th className="px-6 py-4">Mission ID</th>
                                                    <th className="px-6 py-4">Customer</th>
                                                    <th className="px-6 py-4 text-right">Payload</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {loadingHistory ? (
                                                    <tr><td colSpan={3} className="px-6 py-10 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" /></td></tr>
                                                ) : riderHistory.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium italic">No mission records found.</td></tr>
                                                ) : riderHistory.map(mission => (
                                                    <tr key={mission.id} className="hover:bg-white transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <p className="font-black text-foreground">#{mission.id}</p>
                                                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{new Date(mission.created_at).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="font-black text-slate-600 uppercase">{mission.customer_name}</p>
                                                            <div className="flex gap-0.5 mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={cn("h-2 w-2", i < (mission.rider_rating || 5) ? "text-amber-400 fill-current" : "text-slate-200")} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <p className="font-black text-primary">{formatPrice(mission.total_price)}</p>
                                                            <span className="text-[7px] font-black uppercase text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">{mission.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border sticky bottom-0 bg-card">
                             <Button
                                onClick={() => {
                                    const link = `${window.location.origin}/rider/dashboard?phone=${viewingDetails.rider_phone}`;
                                    navigator.clipboard.writeText(link);
                                    setMessage({ type: 'success', text: "Access Link Copied Protocol! 🔗" });
                                    setTimeout(() => setMessage(null), 3000);
                                }}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                            >
                                Copy Secure Access Link
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6">
                <div className="bg-white text-foreground p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Privileged Access</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verification logging enabled.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary" onClick={loadRiders}>Sync Data</Button>
                </div>
            </div>
        </div>
    );
}
