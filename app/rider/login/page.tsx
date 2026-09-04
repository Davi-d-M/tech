'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Truck, Loader2, ArrowLeft, Lock, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { authenticateBiometrics } from '@/lib/biometricService';

export default function RiderLogin() {
    const router = useRouter();
    const [phone, setPhone] = React.useState('');
    const [pin, setPin] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [nodeId, setNodeId] = React.useState('');

    React.useEffect(() => {
        let dId = localStorage.getItem('apex_node_id');
        if (!dId) {
            dId = `node_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('apex_node_id', dId);
        }
        setNodeId(dId);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'rider',
                    phone,
                    password: pin,
                    device_id: nodeId,
                    device_name: 'Logistics Handheld'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Authorization Denied.");

            // Save rider session
            localStorage.setItem('apex_rider_phone', phone);
            localStorage.setItem('apex_rider_pin', pin);
            router.push(`/rider/dashboard?phone=${phone}`);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            const assertion = await authenticateBiometrics();
            if (!assertion) throw new Error("Biometric challenge failed or cancelled.");

            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'rider_biometric', assertion })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Biometric Authorization Denied.");

            localStorage.setItem('apex_rider_phone', data.phone);
            router.push(`/rider/dashboard?phone=${data.phone}`);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Truck className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Fleet Portal</h1>
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mt-2">Logistics Access Hub</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Phone Number</label>
                        <div className="relative">
                            <Input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="07XXXXXXXX"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                required
                            />
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Secure PIN</label>
                        <div className="relative">
                            <Input
                                type="password"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="••••"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                maxLength={4}
                                required
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            disabled={loading}
                            className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : 'Sign In'}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleBiometricAuth}
                            disabled={loading}
                            variant="outline"
                            className="w-full h-16 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                        >
                            <Fingerprint className="h-5 w-5 text-primary" /> Login with Fingerprint
                        </Button>
                    </div>
                </form>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center animate-shake">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">Error: {error}</p>
                        {error.includes('UNAUTHORIZED') && (
                            <div className="mt-4 p-3 bg-white rounded-xl border border-rose-100">
                                <p className="text-[7px] font-black text-slate-400 uppercase">Device ID (Copy for Dispatch)</p>
                                <code
                                    onClick={() => { navigator.clipboard.writeText(nodeId); alert('ID Copied!'); }}
                                    className="text-[9px] font-mono font-black text-primary cursor-pointer"
                                >
                                    {nodeId}
                                </code>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center pt-4 border-t border-slate-50">
                    <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowLeft size={12} /> Back to Shop
                    </Link>
                </div>
            </div>
        </div>
    );
}
