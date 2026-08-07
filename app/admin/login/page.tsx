'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mode,
            password,
            email: mode === 'email' ? email : undefined
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed.');
      }

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Control Center</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium italic">
            Authorize your access to continue.
          </p>
        </div>

        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button
                onClick={() => setMode('pin')}
                className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    mode === 'pin' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
            >
                Owner PIN
            </button>
            <button
                onClick={() => setMode('email')}
                className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    mode === 'email' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
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
            {isSubmitting ? 'Authenticating...' : 'Enter Dashboard'}
          </Button>
        </form>

        {status.message && (
          <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-center animate-shake">
            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">
              ⚠️ {status.message}
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
          >
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
