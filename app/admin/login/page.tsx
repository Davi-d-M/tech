'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Invalid Admin PIN.');
      }

      // Wait a moment for the cookie to be set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/admin/upload';
    } catch (error: unknown) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Invalid PIN. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          🔐 PIN-Based Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your secret PIN to access the admin dashboard. No email login required.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Admin PIN
              <span className="ml-1 text-destructive">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your secret PIN"
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !password}
          >
            {isSubmitting ? 'Verifying PIN...' : 'Access Dashboard'}
          </Button>
        </form>

        {status.message && (
          <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              ⚠️ {status.message}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <Link
            href="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Back to shop
          </Link>
        </div>

        <div className="mt-4 rounded-md bg-primary/5 px-3 py-2 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This is a PIN-only login. You do not need Gmail or email credentials to access the admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
