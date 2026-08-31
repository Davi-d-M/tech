'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Store,
    User,
    Lock,
    CheckCircle2,
    Loader2,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function AdminActivationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
    const [form, setForm] = React.useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [inviteInfo, setInviteInfo] = React.useState<{ tenant_id: string, role: string } | null>(null);

    React.useEffect(() => {
        const verifyToken = async () => {
            if (!token || !supabase) return;
            const { data, error } = await supabase
                .from('invitations')
                .select('tenant_id, role, email')
                .eq('token', token)
                .single();

            if (error || (data.role !== 'OWNER' && data.role !== 'STAFF')) {
                setStatus('error');
                return;
            }
            setInviteInfo({ tenant_id: data.tenant_id, role: data.role });
            setForm(prev => ({ ...prev, email: data.email || '' }));
        };
        verifyToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            alert("Password mismatch, bro.");
            return;
        }
        if (!inviteInfo || !supabase) return;

        setLoading(true);
        try {
            // 1. Create User in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        full_name: form.name,
                        tenant_id: inviteInfo.tenant_id
                    }
                }
            });

            if (authError || !authData.user) throw authError;

            // 2. Create Staff Entry
            const { error: staffError } = await supabase
                .from('staff')
                .insert({
                    id: authData.user.id,
                    email: form.email,
                    role: inviteInfo.role.toLowerCase(),
                    tenant_id: inviteInfo.tenant_id,
                    can_manage_inventory: true,
                    can_manage_orders: true
                });

            if (staffError) throw staffError;

            // 3. Mark Invitation as Claimed
            await supabase.from('invitations').update({ status: 'Claimed' }).eq('token', token);

            setStatus('success');
            setTimeout(() => router.push('/admin/login'), 3000);
        } catch (e) {
            console.error(e);
            alert("Activation Error: Deployment failed.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'error') return <div className="p-20 text-center uppercase font-black text-rose-500 tracking-widest">Protocol Violation: Invalid Invitation.</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
            <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-700 relative overflow-hidden">

                {status === 'idle' && (
                    <form onSubmit={handleActivate} className="space-y-8 relative z-10">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Activate Admin</h1>
                            <p className="text-slate-500 font-medium">Provision your administrative node on the Apex OS grid.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Admin Call Sign</label>
                                <div className="relative">
                                    <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="David Maganga" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Secret Password</label>
                                <div className="relative">
                                    <Input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirm Protocol</label>
                                <Input required type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-4 font-bold" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Deploy Administrative Access"}
                        </Button>
                    </form>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-8 py-10 animate-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Node Activated</h2>
                            <p className="text-slate-500 font-medium">Your organization is live. Redirecting to Terminal...</p>
                        </div>
                        <Zap size={24} className="text-primary animate-pulse mx-auto" />
                    </div>
                )}

                <Store className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
            </Card>
        </div>
    );
}
