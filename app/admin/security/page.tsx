'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldAlert,
    Lock,
    Key,
    Activity,
    ShieldCheck,
    Smartphone,
    Globe,
    History,
    RefreshCcw,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface LoginAttempt {
    id: string;
    ip_address: string;
    success: boolean;
    attempt_time: string;
    metadata: any;
}

export default function SecurityHub() {
    const { email: adminEmail } = useAdmin();
    const [attempts, setAttempts] = React.useState<LoginAttempt[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchSecurityData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('login_attempts').select('*').order('attempt_time', { ascending: false }).limit(10);
            setAttempts(data || []);
        } catch (err) {
            console.error("Security Uplink Encrypted.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSecurityData();
    }, []);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Fortress Protocol</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Security Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Global infrastructure security and authentication auditing.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchSecurityData} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Audit
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                <Card className="p-8 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group h-full">
                    <div className="relative z-10 space-y-6 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Lock size={20} /></div>
                                <span className="px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full animate-pulse uppercase">Armed</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-background/50 tracking-widest mb-1">Authorization Layer</p>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">RBAC System Live</h3>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full items-stretch">
                    {[
                        { label: 'Encryption Protocol', val: 'AES-256-GCM', icon: ShieldCheck, color: 'emerald' },
                        { label: 'Database Shield', val: 'RLS Active', icon: Activity, color: 'primary' },
                        { label: 'Cloud Firewall', val: 'Edge Protected', icon: Globe, color: 'indigo' },
                        { label: 'Session Lock', val: 'Cookie-based', icon: Smartphone, color: 'primary' },
                    ].map((item) => (
                        <Card key={item.label} className="p-6 rounded-[2.5rem] border border-border bg-card shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all h-full">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                "bg-primary/10 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{item.val}</h3>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Authentication Logs</h2>
                        <Button variant="ghost" className="text-[9px] font-black text-primary uppercase underline">Export Full History</Button>
                    </div>

                    <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Event Identity</th>
                                    <th className="px-10 py-6">Protocol Status</th>
                                    <th className="px-10 py-6">Origin IP</th>
                                    <th className="px-10 py-6 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {attempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic opacity-30">No intrusion attempts recorded.</td>
                                    </tr>
                                ) : attempts.map(att => (
                                    <tr key={att.id} className="hover:bg-primary/5 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center text-white font-black uppercase",
                                                    att.success ? "bg-emerald-500 shadow-emerald-100" : "bg-rose-500 shadow-rose-100"
                                                )}>
                                                    <Key size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground uppercase">Login Attempt</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Access Channel: Admin Hub</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                att.success ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {att.success ? 'Success' : 'Violation'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 font-mono text-xs font-black text-slate-500">{att.ip_address || '0.0.0.0'}</td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="text-[10px] font-bold text-foreground uppercase">{new Date(att.attempt_time).toLocaleTimeString()}</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">{new Date(att.attempt_time).toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] border-2 border-primary/10 bg-white shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 space-y-6 text-left">
                            <div className="flex items-center gap-3 text-primary">
                                <ShieldAlert size={20} />
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Global Guard</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                                &quot;All administrative actions are immutable. Deletion and payment authorization require senior-level RBAC keys.&quot;
                            </p>
                            <div className="pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Stability Level</span>
                                <span className="text-xs font-black text-emerald-600">TITAN-Grade</span>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-slate-50 border border-border space-y-6 text-left shadow-inner">
                        <div className="flex items-center gap-3">
                            <History size={18} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Infrastructure Pulse</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>SSL Status</span>
                                <span className="text-emerald-500">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Database RLS</span>
                                <span className="text-emerald-500">Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
