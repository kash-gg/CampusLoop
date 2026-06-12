'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import TrustBadge from '@/components/TrustBadge'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'


interface UserProfile {
  id: string
  email: string
  institution_domain: string
  display_name: string | null
  avatar_url: string | null
  trust_score: number
  trust_badge: string
  account_created_at: string
}

interface Listing {
  id: string
  title: string
  description: string | null
  condition: string
  price: number
  category: string | null
  image_urls: string[]
  status: string
  created_at: string
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const userId = resolvedParams.id
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        
        // 1. Fetch user profile
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (userErr) throw userErr
        if (!userData) throw new Error('User not found')
        
        setProfile(userData as UserProfile)

        // 2. Fetch user's listings
        const { data: listingsData, error: listingsErr } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', userId)
          .order('created_at', { ascending: false })

        if (listingsErr) throw listingsErr
        setListings(listingsData || [])

      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>
        </div>
      </>
    )
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger)' }}>Error loading profile</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{error || 'User not found.'}</p>
          <Link href="/listings" className="btn btn-secondary">
            Back to browse
          </Link>
        </div>
      </>
    )
  }

  const joinDate = new Date(profile.account_created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        
        {/* Profile Card Header */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-display)'
            }}>
              {profile.display_name ? profile.display_name[0].toUpperCase() : 'U'}
            </div>
            
            {/* User Details */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>{profile.display_name || 'Anonymous User'}</h1>
                <TrustBadge userId={profile.id} initialScore={profile.trust_score} initialBadge={profile.trust_badge} size="lg" />
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontSize: '0.95rem' }}>
                🎓 {profile.institution_domain}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Member since {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: 'var(--space-2)' }}>
            Seller Listings ({listings.length})
          </h2>
          
          {listings.length === 0 ? (
            <div className="glass-panel" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              This user hasn't posted any listings yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {listings.map((item) => (
                <div key={item.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                  <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: 'var(--bg-tertiary)' }}>
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img 
                        src={item.image_urls[0]} 
                        alt={item.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                        No Image
                      </div>
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {item.condition}
                    </span>
                    {item.status !== 'active' && (
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'var(--danger)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </h3>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: 'var(--space-4)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.7em'
                    }}>
                      {item.description || 'No description provided.'}
                    </p>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ${item.price.toFixed(2)}
                      </span>
                      <Link href={`/listings/${item.id}`} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
