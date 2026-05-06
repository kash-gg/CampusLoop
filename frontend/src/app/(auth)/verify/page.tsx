'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedEmail = localStorage.getItem('campusloop_auth_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

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

      // On successful verification, the middleware will handle redirecting to /listings
      // Or we can manually push
      router.push('/listings')

    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: 'var(--space-8)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Check your email</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          We sent a 6-digit code to <strong>{email || 'your email'}</strong>
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="token" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.875rem', fontWeight: 500 }}>
              6-Digit OTP
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
            {loading ? 'Verifying...' : 'Verify & Continue'}
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
