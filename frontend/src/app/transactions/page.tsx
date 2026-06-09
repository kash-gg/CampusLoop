'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import TrustBadge from '@/components/TrustBadge'
import Link from 'next/link'

interface Transaction {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: string
  buyer_condition_rating: string | null
  dispute_reason: string | null
  meetup_location: string | null
  meetup_time: string | null
  created_at: string
  updated_at: string
  listing_title?: string
  listing_price?: number
  listing_image?: string
  other_party_name?: string
  other_party_badge?: string
  other_party_score?: number
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // State for forms
  const [meetupLocation, setMeetupLocation] = useState('')
  const [meetupTime, setMeetupTime] = useState('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'meetup' | 'complete' | 'dispute' | null>(null)
  
  const [rating, setRating] = useState('Good')
  const [disputeReason, setDisputeReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        loadTransactions(user.id, activeTab)
      }
    }
    init()
  }, [activeTab])

  const loadTransactions = async (userId: string, mode: 'buying' | 'selling') => {
    setLoading(true)
    setErrorMsg(null)
    try {
      // 1. Fetch raw transaction records from backend
      const res = await fetch(`http://localhost:8000/api/transactions?user_id=${userId}&mode=${mode}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const txs: Transaction[] = await res.json()

      // 2. Fetch listing & user profiles to enrich transaction details
      const enrichedTxs = await Promise.all(txs.map(async (tx) => {
        // Fetch Listing details
        const { data: listingData } = await supabase
          .from('listings')
          .select('title, price, image_urls')
          .eq('id', tx.listing_id)
          .single()

        // Fetch other party profile details
        const otherPartyId = mode === 'buying' ? tx.seller_id : tx.buyer_id
        const { data: profileData } = await supabase
          .from('users')
          .select('display_name, trust_score, trust_badge')
          .eq('id', otherPartyId)
          .single()

        return {
          ...tx,
          listing_title: listingData?.title || 'Unknown Item',
          listing_price: listingData?.price || 0.0,
          listing_image: listingData?.image_urls?.[0] || undefined,
          other_party_name: profileData?.display_name || 'Anonymous User',
          other_party_badge: profileData?.trust_badge || 'New',
          other_party_score: profileData?.trust_score || 0.0
        }
      }))

      setTransactions(enrichedTxs)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred loading transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSellerResponse = async (txId: string, action: 'confirm' | 'decline') => {
    if (!currentUserId) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8000/api/transactions/${txId}/${action}`, {
        method: 'PATCH'
      })
      if (!res.ok) throw new Error(`Failed to ${action} transaction`)
      
      // Reload list
      await loadTransactions(currentUserId, activeTab)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !selectedTxId || !actionType) return
    
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      let url = ''
      let options: RequestInit = { method: 'PATCH' }

      if (actionType === 'meetup') {
        url = `http://localhost:8000/api/transactions/${selectedTxId}/meetup`
        options = {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: meetupLocation,
            time: new Date(meetupTime).toISOString()
          })
        }
      } else if (actionType === 'complete') {
        url = `http://localhost:8000/api/transactions/${selectedTxId}/complete?condition_rating=${rating}`
      } else if (actionType === 'dispute') {
        url = `http://localhost:8000/api/transactions/${selectedTxId}/dispute?dispute_reason=${encodeURIComponent(disputeReason)}`
        options = { method: 'POST' }
      }

      const res = await fetch(url, options)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to complete transaction update')
      }

      // Reset states
      setSelectedTxId(null)
      setActionType(null)
      setMeetupLocation('')
      setMeetupTime('')
      setDisputeReason('')
      
      // Reload list
      await loadTransactions(currentUserId, activeTab)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interested': return 'var(--info)'
      case 'confirmed': return 'var(--accent-primary)'
      case 'meetup_arranged': return 'var(--warning)'
      case 'completed': return 'var(--success)'
      case 'disputed': return 'var(--danger)'
      case 'declined': return 'var(--text-tertiary)'
      case 'resolved_seller':
      case 'resolved_buyer':
        return 'var(--success)'
      default: return 'var(--text-secondary)'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'interested': return 'New Interest'
      case 'confirmed': return 'Confirmed'
      case 'meetup_arranged': return 'Meetup Scheduled'
      case 'completed': return 'Completed'
      case 'disputed': return 'Disputed'
      case 'declined': return 'Declined'
      case 'resolved_seller': return 'Resolved (Seller Favored)'
      case 'resolved_buyer': return 'Resolved (Buyer Favored)'
      default: return status
    }
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <h1 style={{ marginBottom: 'var(--space-6)', fontSize: '2rem' }}>My Transactions</h1>

        {/* Buying / Selling Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--bg-tertiary)', marginBottom: 'var(--space-6)', paddingBottom: '1px' }}>
          <button 
            onClick={() => setActiveTab('buying')}
            style={{
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '1rem',
              color: activeTab === 'buying' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'buying' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            🛍️ Buying
          </button>
          <button 
            onClick={() => setActiveTab('selling')}
            style={{
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '1rem',
              color: activeTab === 'selling' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'selling' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            🏷️ Selling
          </button>
        </div>

        {/* Modal overlays for Actions */}
        {selectedTxId && actionType && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <form onSubmit={handleSubmitAction} className="glass-panel" style={{
              maxWidth: '450px',
              width: '100%',
              padding: 'var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)'
            }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: 0 }}>
                {actionType === 'meetup' && 'Coordinate Meetup Details'}
                {actionType === 'complete' && 'Complete Transaction'}
                {actionType === 'dispute' && 'Raise a Dispute'}
              </h2>

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>
                  {errorMsg}
                </div>
              )}

              {/* Meetup Fields */}
              {actionType === 'meetup' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 500 }}>Meetup Location</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Campus Library Entrance" 
                      value={meetupLocation}
                      onChange={(e) => setMeetupLocation(e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 500 }}>Meetup Time</label>
                    <input 
                      type="datetime-local" 
                      className="input" 
                      value={meetupTime}
                      onChange={(e) => setMeetupTime(e.target.value)}
                      required 
                    />
                  </div>
                </>
              )}

              {/* Complete Fields */}
              {actionType === 'complete' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 500 }}>
                    How would you rate the condition of the received item?
                  </label>
                  <select 
                    className="input" 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)}
                  >
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="For Parts">For Parts</option>
                  </select>
                </div>
              )}

              {/* Dispute Fields */}
              {actionType === 'dispute' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Provide a detailed explanation for this dispute:
                  </label>
                  <textarea 
                    className="input" 
                    rows={4}
                    placeholder="Describe what went wrong (e.g. item condition misrepresented, seller didn't show up)..." 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setSelectedTxId(null); setActionType(null); }} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="glass-panel" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found in this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-6)',
                  padding: 'var(--space-6)',
                  alignItems: 'center',
                  borderLeft: `5px solid ${getStatusColor(tx.status)}`
                }}
              >
                {/* Product Image */}
                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  {tx.listing_image ? (
                    <img src={tx.listing_image} alt={tx.listing_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem' }}>📦</div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <span 
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: getStatusColor(tx.status) + '15',
                        color: getStatusColor(tx.status)
                      }}
                    >
                      {getStatusLabel(tx.status)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      Updated {new Date(tx.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{tx.listing_title}</h3>
                  
                  {/* Participant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>{activeTab === 'buying' ? 'Seller:' : 'Buyer:'}</span>
                    <Link href={`/profile/${activeTab === 'buying' ? tx.seller_id : tx.buyer_id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      {tx.other_party_name}
                    </Link>
                    <TrustBadge userId={activeTab === 'buying' ? tx.seller_id : tx.buyer_id} initialScore={tx.other_party_score} initialBadge={tx.other_party_badge} size="sm" />
                  </div>
                </div>

                {/* Price & Meetup Details */}
                <div style={{ minWidth: '150px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    ${tx.listing_price?.toFixed(2)}
                  </div>
                  {tx.meetup_location && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      📍 {tx.meetup_location}<br />
                      📅 {new Date(tx.meetup_time!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                </div>

                {/* State Machine Action Controls */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {tx.status === 'interested' && activeTab === 'selling' && (
                    <>
                      <button 
                        onClick={() => handleSellerResponse(tx.id, 'decline')} 
                        className="btn btn-secondary" 
                        disabled={isSubmitting}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleSellerResponse(tx.id, 'confirm')} 
                        className="btn btn-primary" 
                        disabled={isSubmitting}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Accept Request
                      </button>
                    </>
                  )}

                  {tx.status === 'interested' && activeTab === 'buying' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Waiting for seller to accept...
                    </span>
                  )}

                  {(tx.status === 'confirmed' || tx.status === 'meetup_arranged') && (
                    <button 
                      onClick={() => { setSelectedTxId(tx.id); setActionType('meetup'); }}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      {tx.meetup_location ? 'Reschedule Meetup' : 'Arrange Meetup'}
                    </button>
                  )}

                  {tx.status === 'meetup_arranged' && activeTab === 'buying' && (
                    <>
                      <button 
                        onClick={() => { setSelectedTxId(tx.id); setActionType('dispute'); }}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)' }}
                      >
                        File Dispute
                      </button>
                      <button 
                        onClick={() => { setSelectedTxId(tx.id); setActionType('complete'); }}
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Confirm Receipt & Rate
                      </button>
                    </>
                  )}

                  {tx.status === 'meetup_arranged' && activeTab === 'selling' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Waiting for buyer to complete...
                    </span>
                  )}

                  {tx.status === 'disputed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                        Disputed: {tx.dispute_reason}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Waiting for admin review.
                      </span>
                    </div>
                  )}

                  {tx.status === 'completed' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
                      🎉 Transaction completed. Rated condition: {tx.buyer_condition_rating}
                    </span>
                  )}

                  {tx.status === 'declined' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      Seller declined request.
                    </span>
                  )}

                  {(tx.status === 'resolved_buyer' || tx.status === 'resolved_seller') && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontStyle: 'italic' }}>
                      Dispute resolved: {tx.status === 'resolved_buyer' ? 'Favored Buyer' : 'Favored Seller'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
