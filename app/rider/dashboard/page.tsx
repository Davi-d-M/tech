'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Truck,
    LogOut,
    PhoneCall,
    Search,
    Loader2,
    Star,
    Navigation,
    Fingerprint,
    MessageCircle,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import EarningsCenter from '@/components/rider/EarningsCenter';
import PerformanceHub from '@/components/rider/PerformanceHub';
import { authenticateBiometrics } from '@/lib/biometricService';

const GoogleMap = dynamic(() => import('@/components/admin/dispatch/LiveDispatchMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center animate-pulse rounded-[3rem] border border-slate-100"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
});

interface Mission {
    id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    total_price: number;
    payment_method: string;
    note: string;
    created_at: string;
    latitude?: number;
    longitude?: number;
}

function RiderDashboardContent() {
    const searchParams = useSearchParams();
    const phoneParam = searchParams.get('phone');

    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [isIdentified, setIsIdentified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [authError, setAuthError] = useState<string | null>(null);

    // TechPax Pro States
    const [isOnline, setIsOnline] = useState(false);
    const [wallet, setWallet] = useState({ balance: 0, total_earned: 0 });
    const [stats, setStats] = useState({ tier: 'Bronze', rating: 5.0, acceptance: 100, maintenance: 'Healthy' });
    const [activeMission, setActiveMission] = useState<Mission | null>(null);

    useEffect(() => {
        const savedPhone = localStorage.getItem('apex_rider_phone');
        const savedPin = localStorage.getItem('apex_rider_pin');
        if (savedPhone && savedPin) {
            setPhone(savedPhone);
            setPin(savedPin);
            verifyAndFetch(savedPhone, savedPin);
        } else if (phoneParam) {
            setPhone(phoneParam);
        }
    }, [phoneParam]);

    const verifyAndFetch = async (riderPhone: string, riderPin: string) => {
        if (!supabase) return;
        setLoading(true);
        setAuthError(null);
        try {
            const { data: rider, error: authErr } = await supabase
                .from('rider_status')
                .select('*')
                .eq('rider_phone', riderPhone.replace(/^0/, '').trim())
                .eq('pin', riderPin.trim())
                .maybeSingle();

            if (authErr || !rider) {
                setAuthError("Identity Link Terminated. Check Phone Number & PIN.");
                return;
            }

            if (rider.verification_status !== 'Verified') {
                setAuthError(`Status: ${rider.verification_status || 'Pending'}. Approval Required.`);
                return;
            }

            // Fetch Real Stats & Wallet
            const { data: walletData } = await supabase.from('rider_wallets').select('*').eq('rider_phone', riderPhone.trim()).maybeSingle();
            if (walletData) setWallet({ balance: walletData.balance, total_earned: walletData.total_earned });

            setStats({
                tier: rider.current_tier || 'Bronze',
                rating: rider.rating || 5.0,
                acceptance: rider.acceptance_rate || 100,
                maintenance: 'Healthy'
            });

            const { data: orders } = await supabase.from('orders').select('*').eq('rider_phone', riderPhone.trim()).order('created_at', { ascending: false });

            // AUTO-SELECT ACTIVE MISSION
            const currentMissions = (orders as Mission[]) || [];
            const dispatched = currentMissions.find(m => m.status === 'Dispatched');
            if (dispatched) setActiveMission(dispatched);

            localStorage.setItem('apex_rider_phone', riderPhone);
            localStorage.setItem('apex_rider_pin', riderPin);
            setMissions(currentMissions);
            setIsIdentified(true);
            setIsOnline(rider.status !== 'Offline');
        } catch {
            setAuthError("Tactical link unstable.");
        } finally {
            setLoading(false);
        }
    };

    const handleBioAuth = async () => {
        try {
            const cred = await authenticateBiometrics();
            if (cred && phone && pin) {
                verifyAndFetch(phone, pin);
            }
        } catch {
            // Biometric auth failed or cancelled
        }
    };

    const handleToggleOnline = async () => {
        if (!supabase || !phone) return;
        setLoading(true);
        const newStatus = isOnline ? 'Offline' : 'Idle';

        try {
            const { error } = await supabase
                .from('rider_status')
                .update({
                    status: newStatus,
                    online_since: isOnline ? null : new Date().toISOString(),
                    updated_at: new Date().toISOString() // Heartbeat update
                })
                .eq('rider_phone', phone);

            if (!error) {
                setIsOnline(!isOnline);
                // Also update local session status
                localStorage.setItem('apex_rider_status', newStatus);
            } else {
                throw error;
            }
        } catch (err) {
            console.error("Status Sync Error:", err);
            setAuthError("Failed to update status on grid.");
        } finally {
            setLoading(false);
        }
    };

    // PULSE HEARTBEAT while online
    useEffect(() => {
        if (!isOnline || !phone || !supabase) return;

        const pulse = setInterval(async () => {
            if (supabase) {
                await supabase
                    .from('rider_status')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('rider_phone', phone);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(pulse);
    }, [isOnline, phone]);

    const handleCompleteMission = async (orderId: number) => {
        if (!supabase || !phone) return;
        setLoading(true);
        try {
            // 1. Update Order Status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'Delivered', updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (orderError) throw orderError;

            // 2. Calculate Commission (Standard 430 per drop)
            const commission = 430;

            // 3. Update Wallet Balance
            const { error: walletError } = await supabase.rpc('credit_rider_wallet', {
                phone_input: phone,
                amount_input: commission
            });

            // Fallback if RPC doesn't exist yet: Direct Update (Less Secure)
            if (walletError) {
                const { data: wallet } = await supabase.from('rider_wallets').select('balance, total_earned').eq('rider_phone', phone).single();
                if (wallet) {
                    await supabase.from('rider_wallets').update({
                        balance: (wallet.balance || 0) + commission,
                        total_earned: (wallet.total_earned || 0) + commission,
                        updated_at: new Date().toISOString()
                    }).eq('rider_phone', phone);
                }
            }

            // 4. UI Update
            setMissions(prev => prev.map(m => m.id === orderId ? { ...m, status: 'Delivered' } : m));
            setActiveMission(null);
            setWallet(prev => ({ ...prev, balance: prev.balance + commission, total_earned: prev.total_earned + commission }));

        } catch (err) {
            console.error("Mission Finalization Error:", err);
            setAuthError("Mission verify failed. Grid update pending.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('apex_rider_phone');
        localStorage.removeItem('apex_rider_pin');
        setIsIdentified(false);
        setMissions([]);
        setPhone('');
        setPin('');
    };

    if (!isIdentified) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 selection:bg-primary/20">
                <Card className="max-w-md w-full p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="text-center space-y-4 relative z-10">
                        <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm group-hover:scale-110 transition-transform">
                            <Truck className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">Rider Command</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify to Begin Missions</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 text-sm font-black" />
                                <PhoneCall className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                            <div className="relative">
                                <Input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" maxLength={4} className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 text-sm font-black" />
                                <Zap className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>

                        {authError && <p className="text-[9px] font-black uppercase text-rose-500 text-center">{authError}</p>}

                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={() => verifyAndFetch(phone, pin)} disabled={loading} className="h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize"}
                            </Button>
                            <Button onClick={handleBioAuth} variant="outline" className="h-16 rounded-2xl border-slate-100 text-slate-400 hover:text-primary active:scale-95 transition-all">
                                <Fingerprint className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="pt-4 text-center border-t border-slate-50">
                            <Link href="/rider/onboarding" className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Apply for Duty &rarr;</Link>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-left selection:bg-primary/20 flex flex-col">
            {/* 🗺️ LIVE TACTICAL GRID (Top 60%) */}
            <div className="h-[60dvh] relative">
                <GoogleMap riders={[]} />

                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start">
                    <Card className="p-4 rounded-3xl bg-white/90 backdrop-blur shadow-2xl border-none flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-xl">
                            {phone.slice(-2)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-amber-500 fill-current" />
                                <span className="text-xs font-black text-foreground">{stats.rating}</span>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stats.tier} Operator</p>
                        </div>
                    </Card>

                    <button onClick={handleLogout} className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur shadow-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-95">
                        <LogOut className="h-6 w-6" />
                    </button>
                </div>

                {/* PULSING ONLINE ACTION */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
                    <Button
                        onClick={handleToggleOnline}
                        className={cn(
                            "h-20 px-12 rounded-full font-black uppercase tracking-[0.3em] text-xs shadow-[0_0_50px_rgba(255,107,0,0.3)] transition-all active:scale-90",
                            isOnline ? "bg-white text-rose-500 border-4 border-rose-50" : "bg-primary text-white border-4 border-white animate-pulse"
                        )}
                    >
                        {isOnline ? "Go Offline" : "Go Online"}
                    </Button>
                </div>
            </div>

            {/* 📋 DYNAMIC MISSION SHEET (Bottom 40%) */}
            <div className="flex-1 bg-white rounded-t-[3.5rem] -mt-10 relative z-[1001] shadow-2xl p-8 sm:p-12 overflow-y-auto no-scrollbar border-t border-slate-50">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10 cursor-grab active:cursor-grabbing" />

                {activeMission ? (
                    <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000 ease-in-out">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                    Tactical Mission
                                </p>
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-[0.9]">Deliver to <br/><span className="text-primary">{activeMission.customer_name}</span></h2>
                            </div>
                            <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center text-foreground border-2 border-slate-100 shadow-inner">
                                <p className="text-[8px] font-black uppercase text-slate-400">UNIT</p>
                                <p className="text-2xl font-black tabular-nums">{activeMission.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={() => window.open(`tel:${activeMission.customer_phone}`, '_self')}
                                className="group h-20 rounded-3xl bg-slate-50 hover:bg-slate-100 text-foreground font-black uppercase text-[10px] tracking-widest border border-slate-100 shadow-sm transition-all overflow-hidden relative"
                            >
                                <div className="relative z-10 flex items-center gap-3">
                                    <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" /> Chat
                                </div>
                            </Button>
                            <Button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${activeMission.latitude},${activeMission.longitude}`, '_blank')}
                                className="group h-20 rounded-3xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black uppercase text-[10px] tracking-widest border border-indigo-100 shadow-sm transition-all"
                            >
                                <div className="relative z-10 flex items-center gap-3">
                                    <Navigation className="h-5 w-5 group-hover:rotate-12 transition-transform" /> Guide
                                </div>
                            </Button>
                        </div>

                        <div className="pt-8 border-t border-slate-50 space-y-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                                <span>Slide to verify drop</span>
                                <Truck className="h-4 w-4 animate-bounce" />
                            </div>
                            <Button
                                onClick={() => handleCompleteMission(activeMission.id)}
                                className="w-full h-24 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-sm tracking-[0.5em] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95 transition-all relative overflow-hidden group"
                            >
                                <span className="relative z-10">Complete Drop</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Waiting State */}
                        <div className="text-center space-y-8 py-12 relative overflow-hidden group">
                            <div className="relative z-10 space-y-6">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <Search className={cn("h-10 w-10 text-slate-200 transition-all", isOnline && "animate-pulse text-primary")} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">
                                        {isOnline ? "Scanning Grid" : "Link Terminated"}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-10">
                                        {isOnline
                                            ? "High demand detected in Central Hub. Maintain tactical position."
                                            : "Establish secure link to enter the mission queue."
                                        }
                                    </p>
                                </div>
                            </div>
                            {/* Animated Background Pulse */}
                            {isOnline && (
                                <div className="absolute inset-0 flex items-center justify-center -z-0">
                                    <div className="h-40 w-40 bg-primary/5 rounded-full animate-ping" />
                                </div>
                            )}
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

                        <PerformanceHub
                            tier={stats.tier}
                            rating={stats.rating}
                            acceptance={stats.acceptance}
                            maintenanceStatus={stats.maintenance}
                        />
                        <EarningsCenter
                            balance={wallet.balance}
                            totalEarned={wallet.total_earned}
                            orders={missions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RiderDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4"><Loader2 className="h-10 w-10 text-primary animate-spin" /><p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Establishing Secure Uplink...</p></div>}>
            <RiderDashboardContent />
        </Suspense>
    );
}
