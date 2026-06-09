'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    // Domain validation
    if (!email.endsWith('.ac.in') && !email.endsWith('.edu.in') && !email.endsWith('.edu')) {
      setError('Please use a valid college email (.ac.in, .edu.in, .edu)')
      setLoading(false)
      return
    }

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/listings`,
          },
        })

        if (error) throw error

        setSuccessMessage('Check your email for the magic link!')
        localStorage.setItem('campusloop_auth_email', email)
        setTimeout(() => router.push('/verify'), 2000)
      } else {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/listings`,
            }
          })
          if (error) throw error

          if (data.session) {
            setSuccessMessage('Account created! Logging you in...')
            setTimeout(() => router.push('/listings'), 1500)
          } else {
            setSuccessMessage('Account created! Please sign in with your credentials.')
            setIsSignUp(false)
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          setSuccessMessage('Logged in successfully! Redirecting...')
          setTimeout(() => router.push('/listings'), 1500)
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: 'var(--space-8)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>CampusLoop</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Sign in with your campus email
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', padding: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => { setMode('magic'); setError(null); setSuccessMessage(null); }}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'magic' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'magic' ? 'white' : 'var(--text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setError(null); setSuccessMessage(null); }}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'password' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'password' ? 'white' : 'var(--text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Password
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.875rem', fontWeight: 500 }}>
              College Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.ac.in"
              className="input"
              required
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.875rem', fontWeight: 500 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', padding: 'var(--space-2)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', padding: 'var(--space-2)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              {successMessage}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            {loading ? 'Processing...' : (
              mode === 'magic' ? 'Send Magic Link' : (isSignUp ? 'Sign Up' : 'Sign In')
            )}
          </button>
        </form>

        {mode === 'password' && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}
        
        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
