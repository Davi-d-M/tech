'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Phone, Truck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function RiderLogin() {
    const router = useRouter();
    const [phone, setPhone] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!supabase) throw new Error("Infrastructure Offline.");

            const { data, error: fetchError } = await supabase
                .from('rider_status')
                .select('*')
                .eq('rider_phone', phone.replace(/^0/, '').trim())
                .single();

            if (fetchError || !data) {
                throw new Error("Rider Profile Not Found.");
            }

            if (data.verification_status !== 'Verified') {
                throw new Error(`Status: ${data.verification_status || 'Pending'}. Approval Required.`);
            }

            // Save rider session
            localStorage.setItem('apex_rider_phone', phone);
            localStorage.setItem('rider_name', data.rider_name);

            router.push(`/rider/dashboard?phone=${phone}`);
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
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Rider Terminal</h1>
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mt-2">Logistics Authorization</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tactical Phone</label>
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

                    <Button
                        disabled={loading}
                        className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : 'Establish Uplink'}
                    </Button>
                </form>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center animate-shake">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">Violation: {error}</p>
                    </div>
                )}

                <div className="text-center pt-4 border-t border-slate-50">
                    <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowLeft size={12} /> Abort to Base
                    </Link>
                </div>
            </div>
        </div>
    );
}
