'use client';

import * as React from 'react';
import { useAdmin } from '@/context/AdminContext';
import {
    User,
    Lock,
    Key,
    ShieldCheck,
    Save,
    Loader2,
    Mail,
    Zap,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default function AdminProfilePage() {
    const { email, role } = useAdmin();
    const [isSaving, setIsSaving] = React.useState<string | null>(null);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form States
    const [newPin, setNewPin] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(newPin)) {
            alert("PIN must be 4 digits.");
            return;
        }

        setIsSaving('pin');
        try {
            const res = await fetch('/api/admin/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_pin', payload: { newPin } })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: "Authorization PIN updated successfully." });
                setNewPin('');
            } else {
                const data = await res.json();
                throw new Error(data.error || "Update failed.");
            }
        } catch (err: unknown) {
            setMessage({ type: 'error', text: (err as Error).message });
        } finally {
            setIsSaving(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setIsSaving('password');
        try {
            if (!supabase) throw new Error("Database not connected.");

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: "System password updated successfully." });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setMessage({ type: 'error', text: (err as Error).message });
        } finally {
            setIsSaving(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Identity Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">My Account</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Manage your administrative credentials and security settings.</p>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <div>
                        <p className="text-sm font-black uppercase tracking-tight">{message.type === 'success' ? 'Protocol Success' : 'Security Breach'}</p>
                        <p className="text-xs font-medium italic">{message.text}</p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-10">

                {/* 1. Identity Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                <User size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{email.split('@')[0]}</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">{role}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={20} /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[8px] font-black uppercase text-slate-300">System Email</p>
                                    <p className="text-xs font-bold text-foreground truncate">{email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck size={20} /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[8px] font-black uppercase text-slate-300">Authorization Level</p>
                                    <p className="text-xs font-bold text-foreground uppercase truncate">Standard Access</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-primary"><Zap size={24} /></div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Security Status</h3>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic opacity-80">
                                &quot;Your session is currently protected by a signed JWT cookie with high-entropy encryption.&quot;
                            </p>
                        </div>
                        <ShieldCheck className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 rotate-12" />
                    </Card>
                </div>

                {/* 2. Credential Management */}
                <div className="lg:col-span-2 space-y-10">

                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10">
                        <h2 className="text-2xl font-black text-foreground uppercase flex items-center gap-4 tracking-tight">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Lock size={20} /></div>
                            Authorization PIN
                        </h2>

                        <form onSubmit={handleUpdatePin} className="space-y-6 max-w-md text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New 4-Digit Security PIN</label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        maxLength={4}
                                        value={newPin}
                                        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="••••"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-lg tracking-widest pl-12"
                                        required
                                    />
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                            <Button type="submit" disabled={isSaving === 'pin'} className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {isSaving === 'pin' ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                Commit PIN Change
                            </Button>
                        </form>
                    </Card>

                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10">
                        <h2 className="text-2xl font-black text-foreground uppercase flex items-center gap-4 tracking-tight">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Key size={20} /></div>
                            System Password
                        </h2>

                        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSaving === 'password'} className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {isSaving === 'password' ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                Update Password
                            </Button>
                        </form>
                    </Card>

                </div>
            </div>
        </div>
    );
}
