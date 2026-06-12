'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check for error in query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error_description') || params.get('error')
      if (errorParam) {
        let message = decodeURIComponent(errorParam).replace(/\+/g, ' ')
        if (params.get('error_code') === 'otp_expired') {
          message = 'The sign-in link is invalid or has expired. This often happens if the link was clicked multiple times or pre-scanned by your email provider.'
        }
        setUrlError(message)
      }
    }
  }, [])

  useEffect(() => {
    // 1. If user clicked the magic link, Supabase client will automatically consume the URL hash
    // and establish a session. We check for this session and redirect automatically.
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/listings')
      }
    }
    checkSessionAndRedirect()

    // Listen for auth state change (e.g. after magic link is clicked and hash is processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/listings')
      }
    })

    // 2. Set the email input from local storage for manual OTP fallback
    const savedEmail = localStorage.getItem('campusloop_auth_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !token) {
      setError('Email and OTP are required')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error

      // On successful verification, redirect to /listings
      router.push('/listings')

    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: 'var(--space-8)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Check your email</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          We sent a sign-in verification link to <strong>{email || 'your email'}</strong>.
        </p>

        {urlError && (
          <div style={{
            color: 'var(--danger)',
            fontSize: '0.875rem',
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            lineHeight: '1.4'
          }}>
            <strong>Error:</strong> {urlError}
            <div style={{ marginTop: 'var(--space-2)' }}>
              Please return to the <a href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Login Page</a> and request a new link, or sign in using a password.
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
            ✉️ Sign In via Magic Link
          </p>
          <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Simply click the <strong>"Sign in"</strong> button/link in the email you received. This page will automatically redirect you once you do!
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-6) 0', color: 'var(--text-secondary)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.2 }}></div>
          <span style={{ padding: '0 var(--space-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR USE OTP CODE</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.2 }}></div>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="token" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.875rem', fontWeight: 500 }}>
              6-Digit OTP (if provided)
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456"
              className="input"
              maxLength={6}
              required
              style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem' }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', padding: 'var(--space-2)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            {loading ? 'Verifying...' : 'Verify OTP & Continue'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <button 
            type="button" 
            onClick={() => router.push('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  )
}
