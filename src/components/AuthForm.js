// src/components/AuthForm.js
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { signInLocal, signUpLocal } from '@/lib/localAuth'
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
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
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
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
              placeholder="Enter your secret PIN"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
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
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
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
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (isSignUp && cooldownSeconds > 0)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : isSignUp && cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : isSignUp
                  ? 'Sign Up'
                  : 'Log In'}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-4 text-sm text-center font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
        {!showAdminPin && (
          <button
            onClick={() => {
              setShowAdminPin(true)
              setMessage('')
              setAdminPin('')
            }}
            className="block w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2.5 rounded-xl transition-colors"
          >
            🔐 Admin Access
          </button>
        )}
        {showAdminPin && (
          <button
            onClick={() => {
              setShowAdminPin(false)
              setMessage('')
              setAdminPin('')
            }}
            className="block w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2.5 rounded-xl transition-colors"
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