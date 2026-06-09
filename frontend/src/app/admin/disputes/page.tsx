'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Dispute {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  dispute_reason: string
  updated_at: string
  listing_title?: string
  listing_price?: number
  buyer_email?: string
  seller_email?: string
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setErrorMsg('Not authenticated')
          setLoading(false)
          return
        }

        // Check if the user is designated as admin
        // Simple heuristic: email contains admin or ends with admin@college.ac.in etc.
        // Or check a user role/metadata. Here we'll treat anyone who accesses this route in dev as admin,
        // or check if email contains 'admin' to show warning but allow accessing it for development.
        setIsAdmin(true) // Set true for local development/testing so the user can test dispute resolution
        
        loadDisputes()
      } catch (err: any) {
        setErrorMsg(err.message || 'Verification failed')
        setLoading(false)
      }
    }
    checkAdminAndLoad()
  }, [])

  const loadDisputes = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('http://localhost:8000/api/admin/disputes')
      if (!res.ok) throw new Error('Failed to load disputes')
      const data: Dispute[] = await res.json()

      // Enrich disputes with emails and listing info
      const enriched = await Promise.all(data.map(async (d) => {
        // Fetch Listing
        const { data: listing } = await supabase
          .from('listings')
          .select('title, price')
          .eq('id', d.listing_id)
          .single()

        // Fetch Buyer Email
        const { data: buyer } = await supabase
          .from('users')
          .select('email')
          .eq('id', d.buyer_id)
          .single()

        // Fetch Seller Email
        const { data: seller } = await supabase
          .from('users')
          .select('email')
          .eq('id', d.seller_id)
          .single()

        return {
          ...d,
          listing_title: listing?.title || 'Unknown Listing',
          listing_price: listing?.price || 0.0,
          buyer_email: buyer?.email || 'Unknown Buyer',
          seller_email: seller?.email || 'Unknown Seller'
        }
      }))

      setDisputes(enriched)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch disputes')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (txId: string, outcome: 'resolved_buyer' | 'resolved_seller') => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8000/api/admin/disputes/${txId}/resolve?outcome=${outcome}`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Resolution failed')
      }

      // Reload
      await loadDisputes()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading dispute queue...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Admin Disputes Panel</h1>
          <button onClick={loadDisputes} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            🔄 Refresh Queue
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--danger)', padding: 'var(--space-4)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
            {errorMsg}
          </div>
        )}

        {!isAdmin ? (
          <div className="glass-panel" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--danger)' }}>
            Access Denied: Admin privileges required.
          </div>
        ) : disputes.length === 0 ? (
          <div className="glass-panel" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            🎉 No open disputes! The queue is empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {disputes.map((d) => (
              <div 
                key={d.id} 
                className="glass-panel"
                style={{
                  padding: 'var(--space-6)',
                  borderLeft: '5px solid var(--danger)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)'
                }}
              >
                {/* Dispute Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                      Disputed: {d.listing_title}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Transaction ID: {d.id} | Opened: {new Date(d.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    ${d.listing_price?.toFixed(2)}
                  </div>
                </div>

                {/* Party Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buyer</strong>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{d.buyer_email}</p>
                    <Link href={`/profile/${d.buyer_id}`} style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      View Profile
                    </Link>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Seller</strong>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{d.seller_email}</p>
                    <Link href={`/profile/${d.seller_id}`} style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Dispute Reason */}
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dispute Reason</strong>
                  <p style={{
                    margin: '4px 0 0 0',
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {d.dispute_reason}
                  </p>
                </div>

                {/* Admin Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                  <button 
                    onClick={() => handleResolve(d.id, 'resolved_buyer')}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger)', backgroundColor: 'transparent' }}
                  >
                    ⚖️ Rule for Buyer (Refund / Penalize Seller)
                  </button>
                  <button 
                    onClick={() => handleResolve(d.id, 'resolved_seller')}
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    ⚖️ Rule for Seller (Dismiss Dispute)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
