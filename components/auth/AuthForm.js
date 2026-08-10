// components/auth/AuthForm.js
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabaseClient'

export default function AuthForm({ initialMode = 'signin' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdminPin, setShowAdminPin] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const COOLDOWN_DURATION = 60 // 60 seconds between sign-up attempts

  useEffect(() => {
    setIsSignUp(initialMode === 'signup')
  }, [initialMode])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        const newValue = prev - 1
        if (newValue <= 0) {
          clearInterval(timer)
          setMessage('')
        }
        return newValue
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const handleAuth = async (e) => {
    e.preventDefault()

    // Check if in cooldown for sign-ups
    if (isSignUp && cooldownSeconds > 0) {
      setMessage(`Please wait ${cooldownSeconds} seconds before trying again.`)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (!supabase) {
        throw new Error(
          'Authentication service is not configured. Please check your Supabase setup.'
        )
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        setMessage('Check your email for the confirmation link!')
        setCooldownSeconds(COOLDOWN_DURATION)
        router.push('/')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage('Logged in successfully!')
      router.push('/')
      return
    } catch (error) {
      console.error('Auth error:', error)
      const errorMsg =
        error?.message || 'An error occurred. Please check your connection and try again.'

      // Start cooldown on rate limit error
      if (errorMsg.includes('email rate limit') || errorMsg.includes('rate limit')) {
        setCooldownSeconds(COOLDOWN_DURATION)
        setMessage(`Rate limit exceeded. Please try again in ${COOLDOWN_DURATION} seconds.`)
      } else if (errorMsg.includes('Invalid login credentials')) {
        setMessage(
          'Invalid email or password. If you just signed up, please check your email for a confirmation link and click it before logging in.'
        )
      } else {
        setMessage(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdminAccess = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPin }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Invalid Admin PIN.')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/admin/upload')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid PIN. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground text-center mb-6">
        {showAdminPin ? '🔐 Admin Access' : isSignUp ? 'Create an Account' : 'Welcome Back'}
      </h2>

      {showAdminPin ? (
        <form onSubmit={handleAdminAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Admin PIN</label>
            <input
              type="password"
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground"
              placeholder="Enter your secret PIN"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (isSignUp && cooldownSeconds > 0)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : isSignUp && cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : isSignUp
                  ? 'Sign Up'
                  : 'Log In'}
          </button>

          {!showAdminPin && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or Secure Entry</span></div>
            </div>
          )}

          {!showAdminPin && (
            <button
              type="button"
              onClick={async () => {
                if (!supabase) return;
                setLoading(true);
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: window.location.origin }
                });
                if (error) setMessage(error.message);
                setLoading(false);
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-foreground font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with Google
            </button>
          )}
        </form>
      )}

      {message && (
        <p className="mt-4 text-sm text-center font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
        {!showAdminPin && (
          <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => {
                setShowAdminPin(true)
                setMessage('')
                setAdminPin('')
                }}
                className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-foreground hover:bg-slate-50 p-3 rounded-xl transition-all border border-transparent hover:border-slate-100"
            >
                🔐 Admin
            </button>
            <button
                onClick={() => router.push('/rider/login')}
                className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 p-3 rounded-xl transition-all border border-transparent hover:border-primary/10"
            >
                🚚 Rider
            </button>
          </div>
        )}
        {showAdminPin && (
          <button
            onClick={() => {
              setShowAdminPin(false)
              setMessage('')
              setAdminPin('')
            }}
            className="block w-full text-center text-sm font-medium text-slate-600 hover:text-foreground hover:bg-slate-50 p-2.5 rounded-xl transition-colors"
          >
            ← Back to Login
          </button>
        )}
        {!showAdminPin && (
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-medium text-slate-600 hover:underline block w-full text-center"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        )}
      </div>
    </div>
  )
}