'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function NewWantPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userDomain, setUserDomain] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setUserDomain(user.email?.split('@')[1] || '')
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !userDomain) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const wantPayload = {
        buyer_id: currentUserId,
        title,
        description,
        max_budget: maxBudget ? parseFloat(maxBudget) : null,
        institution_domain: userDomain
      }

      const res = await fetch('http://localhost:8000/api/wants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wantPayload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to submit want request')
      }

      router.push('/wants')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '600px' }}>
        <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '2rem' }}>Post to Want Board</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Let students on your campus know what you are looking to buy.
        </p>

        {errorMsg && (
          <div style={{ color: 'var(--danger)', padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="title" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>
              What are you looking for?
            </label>
            <input 
              id="title"
              type="text" 
              className="input" 
              placeholder="e.g. Ergonomic Office Chair, Calculus 3rd Ed" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div>
            <label htmlFor="description" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>
              Description / Details
            </label>
            <textarea 
              id="description"
              className="input" 
              rows={4}
              placeholder="Describe condition details, preferred brands, or meetup constraints..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label htmlFor="budget" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 600 }}>
              Max Budget ($) (Optional)
            </label>
            <input 
              id="budget"
              type="number" 
              className="input" 
              placeholder="Leave empty for flexible budget" 
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()} style={{ flex: 1 }}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
