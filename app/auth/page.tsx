import Link from 'next/link';

import AuthForm from '@/src/components/AuthForm';

interface AuthPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams.mode === 'signup' ? 'signup' : 'signin';

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Customer access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {mode === 'signup' ? 'Create an account to keep shopping' : 'Welcome back'}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            {mode === 'signup'
              ? 'Create your account to save your order details and keep your shopping journey going.'
              : 'Sign in to continue where you left off, or open a new account if you are just getting started.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth?mode=signin"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signin'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-foreground hover:bg-accent'
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-foreground hover:bg-accent'
              }`}
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
          <AuthForm initialMode={mode} />
        </div>
      </div>
    </main>
  );
}
