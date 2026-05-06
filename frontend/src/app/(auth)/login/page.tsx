'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      })

      if (error) throw error

      setSuccessMessage('Check your email for the magic link or OTP!')
      // In a real app we might redirect to a 'check email' page, or store email in localStorage and redirect to /verify to enter OTP
      localStorage.setItem('campusloop_auth_email', email)
      setTimeout(() => router.push('/verify'), 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
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
            {loading ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
