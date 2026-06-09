'use client'

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import TrustBadge from "@/components/TrustBadge"
import Link from "next/link"

interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  condition: string
  category: string | null
  image_urls: string[]
  status: string
  created_at: string
  seller_name?: string
  seller_badge?: string
  seller_score?: number
}

export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    loadAuth()
  }, [])

  useEffect(() => {
    if (!id) return

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`)
        if (res.ok) {
          const data = await res.json()
          
          // Enrich with seller profile details
          const { data: profile } = await supabase
            .from('users')
            .select('display_name, trust_score, trust_badge')
            .eq('id', data.seller_id)
            .single()
            
          setListing({
            ...data,
            seller_name: profile?.display_name || 'Anonymous Student',
            seller_badge: profile?.trust_badge || 'New',
            seller_score: profile?.trust_score || 0.0
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  const handleInterest = async () => {
    if (!currentUserId || !listing) return
    
    // Check if the buyer is the seller themselves
    if (listing.seller_id === currentUserId) {
      setErrorMsg("You cannot express interest in your own listing.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const payload = {
        listing_id: id,
        buyer_id: currentUserId,
        seller_id: listing.seller_id
      }
      
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to create transaction.")
      }

      router.push("/transactions") // Redirect to transactions
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred expressing interest.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading item details...</div>
        </div>
      </>
    )
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger)' }}>Listing not found</h2>
          <Link href="/listings" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
            Back to search
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          style={{ 
            background: 'none', 
            color: 'var(--accent-primary)', 
            marginBottom: 'var(--space-6)', 
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          ← Back to listings
        </button>

        {errorMsg && (
          <div style={{ color: 'var(--danger)', padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
          {/* Left Panel: Image */}
          <div>
            {listing.image_urls && listing.image_urls.length > 0 ? (
              <div style={{ 
                width: '100%', 
                height: '400px', 
                borderRadius: 'var(--radius-lg)', 
                overflow: 'hidden', 
                border: '1px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src={listing.image_urls[0]} 
                  alt={listing.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            ) : (
              <div style={{ 
                width: '100%', 
                height: '400px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-lg)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                border: '1px solid var(--bg-tertiary)'
              }}>
                📦 No Image Provided
              </div>
            )}
          </div>

          {/* Right Panel: Listing Info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              {listing.category || 'General'}
            </span>
            <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--space-2)' }}>{listing.title}</h1>
            
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 'var(--space-6)' }}>
              ${listing.price.toFixed(2)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Condition:</span> {listing.condition}</p>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Posted:</span> {new Date(listing.created_at).toLocaleDateString()}</p>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span> 
                <span style={{ marginLeft: '6px', fontWeight: 600, color: listing.status === 'active' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                  {listing.status}
                </span>
              </p>
            </div>

            {/* Seller profile overview */}
            <div className="glass-panel" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)'
              }}>
                {listing.seller_name ? listing.seller_name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <Link href={`/profile/${listing.seller_id}`} style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', textDecoration: 'underline' }}>
                    {listing.seller_name}
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Seller Trust:</span>
                  <TrustBadge userId={listing.seller_id} initialScore={listing.seller_score} initialBadge={listing.seller_badge} size="sm" />
                </div>
              </div>
            </div>

            {/* Description details */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {listing.description || 'No description provided.'}
              </p>
            </div>

            {/* CTA action button */}
            {listing.status === 'active' && (
              <button 
                onClick={handleInterest}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 600 }}
              >
                {isSubmitting ? "Processing Interest..." : "I'm Interested"}
              </button>
            )}
            
            {listing.status === 'sold' && (
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                🤝 Sold
              </div>
            )}
            
            {listing.status === 'expired' && (
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Expired
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
