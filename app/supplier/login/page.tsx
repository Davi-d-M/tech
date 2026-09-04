'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LoginError {
    error: string;
    is_new_device?: boolean;
    node_id?: string;
}

export default function SupplierLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const [nodeId, setNodeId] = useState('');

    useEffect(() => {
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
                    mode: 'email',
                    email,
                    password,
                    device_id: nodeId,
                    device_name: 'Merchant Dashboard'
                })
            });

            const data = await res.json();
            if (!res.ok) throw data;

            router.push('/supplier');
        } catch (err: unknown) {
            setError(err as LoginError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left selection:bg-primary/20">
            <div className="max-w-md w-full space-y-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Briefcase className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Merchant Portal</h1>
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mt-2">Partner Access Control</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Business Email</label>
                        <div className="relative">
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="merchant@domain.com"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                required
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Password</label>
                        <div className="relative">
                            <Input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                required
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>

                    <Button
                        disabled={loading}
                        className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-sm tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : 'Sign In'}
                    </Button>
                </form>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center animate-shake">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">Error: {error.error || "Access Denied"}</p>
                        {error.is_new_device && (
                            <div className="mt-4 p-3 bg-white rounded-xl border border-rose-100">
                                <p className="text-[7px] font-black text-slate-400 uppercase">Device Identity ID (Copy for Admin)</p>
                                <code
                                    onClick={() => { navigator.clipboard.writeText(nodeId); alert('ID Copied!'); }}
                                    className="text-[9px] font-mono font-black text-primary cursor-pointer hover:underline"
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
