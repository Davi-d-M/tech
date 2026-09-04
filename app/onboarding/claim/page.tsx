'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Rocket,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    Zap,
    Lock,
    Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function ClaimInvitationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = React.useState(searchParams.get('token') || '');
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = React.useState('');
    const [claimData, setClaimData] = React.useState<{ tenant_name: string, role: string } | null>(null);

    const handleClaim = async () => {
        if (!token || !supabase) return;
        setLoading(true);
        setStatus('claiming');
        try {
            // 1. Verify and Fetch Invite Details
            const { data: invite, error: fetchError } = await supabase
                .from('invitations')
                .select('tenant_id, role, tenants(name)')
                .eq('token', token)
                .eq('status', 'Unused')
                .single();

            if (fetchError || !invite) {
                throw new Error("Invalid or expired invitation token.");
            }

            const role = invite.role;
            const tenantName = (invite.tenants as unknown as { name: string }).name;

            setClaimData({ tenant_name: tenantName, role });

            // 2. Execute Claim (Mark as Claimed)
            const { error: updateError } = await supabase
                .from('invitations')
                .update({ status: 'Claimed' })
                .eq('token', token);

            if (updateError) throw updateError;

            // 3. Complete Provisioning
            setStatus('success');

            // Redirect after 3s
            setTimeout(() => {
                if (role === 'RIDER') router.push(`/rider/activate?token=${token}`);
                else if (role === 'OWNER' || role === 'STAFF') router.push(`/admin/activate?token=${token}`);
                else router.push(`/apex-portal?token=${token}`);
            }, 3000);

        } catch (e) {
            console.error(e);
            setStatus('error');
            setErrorMsg((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
            <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-700">

                {status === 'idle' && (
                    <div className="space-y-8">
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Rocket size={40} className="animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Activate Invitation</h1>
                            <p className="text-slate-500 font-medium">Claim your invitation to join your organization&apos;s workspace.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    value={token}
                                    onChange={e => setToken(e.target.value.toUpperCase())}
                                    placeholder="ENTER INVITATION TOKEN"
                                    className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 font-black tracking-widest text-sm"
                                />
                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                            <Button
                                onClick={handleClaim}
                                disabled={!token || loading}
                                className="w-full h-18 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Verify Invitation"}
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'claiming' && (
                    <div className="space-y-8 text-center py-10">
                        <Loader2 size={64} className="animate-spin text-primary mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Processing...</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Authorizing credentials</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Access Granted</h2>
                            <p className="text-slate-500 font-medium leading-tight px-4">
                                Welcome to <span className="text-primary font-black uppercase">{claimData?.tenant_name}</span>.
                                Your <span className="text-indigo-600 font-black uppercase">{claimData?.role}</span> workspace is ready.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-3">
                            <Zap size={16} className="text-primary animate-bounce" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Redirecting to Dashboard...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-8 text-center">
                        <div className="h-20 w-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto shadow-inner">
                            <Lock size={32} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-tight">Verification Failed</h2>
                            <p className="text-rose-500 font-bold text-xs italic">{errorMsg}</p>
                        </div>
                        <Button onClick={() => setStatus('idle')} className="w-full h-14 rounded-xl bg-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">Try Different Token</Button>
                    </div>
                )}

                <footer className="pt-8 text-center border-t border-slate-50 opacity-30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ShieldCheck size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secured by Apex Platform</span>
                    </div>
                </footer>
            </Card>
        </div>
    );
}
