'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import TrustBadge from "@/components/TrustBadge"

interface Listing {
  id: string
  seller_id: string
  title: string
  price: number
  condition: string
  category: string | null
  image_urls: string[]
  similarity?: number
  seller_name?: string
  seller_badge?: string
  seller_score?: number
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [userDomain, setUserDomain] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const domain = user.email?.split('@')[1] || ""
        setUserDomain(domain)
        fetchListings(domain, "")
      }
    }
    loadAuth()
  }, [])

  const fetchListings = async (domain: string, searchQuery = "") => {
    setLoading(true)
    try {
      let url = `/api/listings?institution_domain=${domain}`
      
      if (searchQuery) {
        url = `/api/search?q=${encodeURIComponent(searchQuery)}&institution=${domain}`
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        
        // Enrich listings with seller trust profile
        const enriched = await Promise.all(data.map(async (item: any) => {
          const { data: profile } = await supabase
            .from('users')
            .select('display_name, trust_score, trust_badge')
            .eq('id', item.seller_id)
            .single()
            
          return {
            ...item,
            seller_name: profile?.display_name || 'Anonymous User',
            seller_badge: profile?.trust_badge || 'New',
            seller_score: profile?.trust_score || 0.0
          }
        }))
        
        setListings(enriched)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userDomain) return
    const delayDebounceFn = setTimeout(() => {
      fetchListings(userDomain, query)
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query, userDomain])

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Browse Campus Deals</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Showing listings for students at <strong>{userDomain}</strong>
            </p>
          </div>
          <Link href="/listings/new" className="btn btn-primary">
            + Sell an Item
          </Link>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <input 
            type="text" 
            placeholder="🔍 Search for textbooks, electronics, furniture (e.g. 'ergonomic chair for exam studying')..." 
            className="input"
            style={{ padding: 'var(--space-4)', fontSize: '1.05rem', boxShadow: 'var(--shadow-sm)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="glass-panel" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No active listings found on your campus. Be the first to post something!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {listings.map((item) => (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Image panel */}
                <div style={{ position: 'relative', width: '100%', height: '190px', backgroundColor: 'var(--bg-tertiary)' }}>
                  {item.image_urls?.[0] ? (
                    <img 
                      src={item.image_urls[0]} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                      📦 No Photo
                    </div>
                  )}
                  
                  {/* Condition Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {item.condition}
                  </span>
                  
                  {/* Semantic Search score */}
                  {item.similarity && (
                    <span style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      🎯 {Math.round(item.similarity * 100)}% Match
                    </span>
                  )}
                </div>

                {/* Info details */}
                <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </h3>
                  </div>
                  
                  {/* Category & Category */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                    {item.category || "General"}
                  </div>

                  {/* Seller Trust score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                    <span>Seller:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.seller_name}</strong>
                    <TrustBadge userId={item.seller_id} initialScore={item.seller_score} initialBadge={item.seller_badge} size="sm" />
                  </div>

                  {/* Footer pricing */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      ${item.price.toFixed(2)}
                    </span>
                    <Link href={`/listings/${item.id}`} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.85rem' }}>
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
