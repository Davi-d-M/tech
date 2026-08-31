'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    User,
    Lock,
    Truck,
    CheckCircle2,
    Loader2,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function RiderActivationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
    const [form, setForm] = React.useState({
        name: '',
        phone: '',
        pin: '',
        confirmPin: ''
    });
    const [inviteInfo, setInviteInviteInfo] = React.useState<{ tenant_id: string } | null>(null);

    React.useEffect(() => {
        const verifyToken = async () => {
            if (!token || !supabase) return;
            const { data, error } = await supabase
                .from('invitations')
                .select('tenant_id, role, phone')
                .eq('token', token)
                .single();

            if (error || data.role !== 'RIDER') {
                setStatus('error');
                return;
            }
            setInviteInviteInfo({ tenant_id: data.tenant_id });
            setForm(prev => ({ ...prev, phone: data.phone || '' }));
        };
        verifyToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.pin !== form.confirmPin) {
            alert("PIN mismatch, bro.");
            return;
        }
        if (!inviteInfo || !supabase) return;

        setLoading(true);
        try {
            // 1. Create or Update Rider Profile
            const { error: upsertError } = await supabase
                .from('rider_status')
                .upsert({
                    rider_phone: form.phone,
                    rider_name: form.name,
                    pin: form.pin,
                    tenant_id: inviteInfo.tenant_id,
                    verification_status: 'Verified', // Pre-verified because they were invited
                    status: 'Idle'
                }, { onConflict: 'rider_phone' });

            if (upsertError) throw upsertError;

            // 2. Mark Invitation as Claimed (if not already done by claim page)
            await supabase.from('invitations').update({ status: 'Claimed' }).eq('token', token);

            setStatus('success');
            setTimeout(() => router.push('/rider/login'), 3000);
        } catch (e) {
            console.error(e);
            alert("Activation Error: Link lost.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'error') return <div className="p-20 text-center uppercase font-black text-rose-500">Illegal Token Entry. Access Denied.</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
            <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-700 overflow-hidden relative">

                {status === 'idle' && (
                    <form onSubmit={handleActivate} className="space-y-8 relative z-10">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Activate Rider</h1>
                            <p className="text-slate-500 font-medium italic">&quot;Establishing your unit on the grid.&quot;</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Call Sign (Full Name)</label>
                                <div className="relative">
                                    <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Brian Omondi" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tactical PIN</label>
                                    <div className="relative">
                                        <Input required type="password" maxLength={4} value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} placeholder="••••" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-black tracking-widest" />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirm</label>
                                    <Input required type="password" maxLength={4} value={form.confirmPin} onChange={e => setForm({...form, confirmPin: e.target.value})} placeholder="••••" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-4 font-black tracking-widest" />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Authorize Unit"}
                        </Button>
                    </form>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-8 py-10">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Unit Authorized</h2>
                            <p className="text-slate-500 font-medium">Your node is now live on the grid. Redirecting to Terminal...</p>
                        </div>
                        <Zap size={24} className="text-primary animate-pulse mx-auto" />
                    </div>
                )}

                <Truck className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
            </Card>
        </div>
    );
}
