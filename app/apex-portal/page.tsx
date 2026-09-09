'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Key, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { logAuditAction } from '@/lib/auditService';
import { supabase } from '@/lib/supabaseClient';

interface LoginStatus {
    type: 'idle' | 'error' | 'processing';
    message: string;
    is_new_device?: boolean;
    node_id?: string;
}

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [status, setStatus] = useState<LoginStatus>({
    type: 'idle',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      // 0. GHOST PROTOCOL: Hardware Fingerprinting
      let dId = localStorage.getItem('apex_node_id');
      if (!dId) {
          dId = `node_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('apex_node_id', dId);
      }
      setDeviceId(dId);

      const modeParam = searchParams.get('mode');
      const magicKey = searchParams.get('key');
      const secretFlag = searchParams.get('secret');

      // Check if unlocked via secret URL or session
      if (secretFlag === 'true') {
          setIsUnlocked(true);
      }

      if (supabase) {
          supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user.email === 'davidmaganga130@gmail.com') {
                  setIsUnlocked(true);
              }
          });
      }

      if (modeParam === 'email') {
          setMode('email');
      } else if (typeof window !== 'undefined') {
          const savedMode = localStorage.getItem('apex_admin_mode');
          if (savedMode === 'email' || savedMode === 'pin') setMode(savedMode as 'pin' | 'email');

          const savedEmail = localStorage.getItem('apex_admin_email');
          if (savedEmail) setEmail(savedEmail);
      }

      // MAGIC KEY: Instant Access Protocol
      if (magicKey && !hasAttemptedAutoLogin) {
          setHasAttemptedAutoLogin(true);
          handleAutoLogin(magicKey, dId);
      }
  }, [searchParams, hasAttemptedAutoLogin]);

  const handleAutoLogin = async (key: string, dId: string) => {
      setIsSubmitting(true);
      setStatus({ type: 'processing', message: 'Authorizing Magic Key...' });

      try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'pin',
                password: key,
                device_id: dId,
                device_name: 'Magic Key Entry'
            }),
          });

          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || 'Magic Key Invalid.');

          await logAuditAction('davidmaganga130@gmail.com', 'MAGIC_KEY_SESSION_START', { ip: payload.ip || 'logged' });
          window.location.href = '/admin';
      } catch (error: unknown) {
          setStatus({
            type: 'error',
            message: error instanceof Error ? error.message : 'Magic Key authentication failed.',
          });
          setIsSubmitting(false);
      }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // 1. Client-side Supabase Auth for session persistence
      if (mode === 'email' && supabase) {
          const { error: sbError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password
          });
          if (sbError) throw sbError;
      }

      // 2. Server-side session & RBAC
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mode,
            password,
            email: mode === 'email' ? email : undefined,
            device_id: deviceId,
            device_name: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'Web Node'
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed.');
      }

      // Persist login metadata
      localStorage.setItem('apex_admin_mode', mode);
      if (mode === 'email') localStorage.setItem('apex_admin_email', email);

      const adminEmail = mode === 'email' ? email : 'davidmaganga130@gmail.com';
      await logAuditAction(adminEmail, 'OS_SESSION_START', { mode, ip: payload.ip || 'logged' });

      // Wait a moment for the cookie to be set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/admin';
    } catch (error: unknown) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Login failed. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 text-left">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">

        {/* Rider / Partner View (Visible to everyone on the portal) */}
        {!isUnlocked ? (
            <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div className="mx-auto h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Truck className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Apex Partner Hub</h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium italic">
                        Fleet and Merchant logistics gateway.
                    </p>
                </div>
                <div className="space-y-3">
                    <Link href="/rider/login" className="block">
                        <Button className="w-full h-20 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all">
                            Fleet Portal Access
                        </Button>
                    </Link>
                    <Link href="/supplier/login" className="block">
                        <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                            Merchant Hub
                        </Button>
                    </Link>
                </div>
                <div className="pt-6 border-t border-slate-50">
                    <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-primary uppercase tracking-widest transition-colors">
                        ← Back to Shop
                    </Link>
                </div>
            </div>
        ) : (
            /* Administrative View (Hidden unless Unlocked) */
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Administrative Portal</h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium italic">
                        Authorized personnel only. Secure link established.
                    </p>
                </div>

                <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => setMode('pin')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            mode === 'pin' ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Admin PIN
                    </button>
                    <button
                        onClick={() => setMode('email')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            mode === 'email' ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Staff Login
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'email' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Email</label>
                        <div className="relative">
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="staff@apexstores.com"
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12"
                                disabled={isSubmitting}
                                required
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        {mode === 'pin' ? 'Secret PIN' : 'Password'}
                    </label>
                    <div className="relative">
                        <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={mode === 'pin' ? "••••••••" : "Your Password"}
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        required
                        />
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Authorizing...' : 'Enter Console'}
                </Button>
                </form>

                <div className="text-center pt-6 border-t border-slate-100">
                    <Link href="/" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                        ← Back to Shop
                    </Link>
                </div>
            </div>
        )}

        {status.message && (
          <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-center animate-shake mt-6">
            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest leading-relaxed">
              {status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>}>
            <AdminLoginContent />
        </Suspense>
    );
}
