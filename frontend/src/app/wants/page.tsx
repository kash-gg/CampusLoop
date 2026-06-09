'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import TrustBadge from '@/components/TrustBadge'
import Link from 'next/link'

interface Want {
  id: string
  buyer_id: string
  title: string
  description: string | null
  max_budget: number | null
  institution_domain: string
  status: string
  created_at: string
  buyer_name?: string
  buyer_badge?: string
  buyer_score?: number
}

export default function WantsPage() {
  const [wants, setWants] = useState<Want[]>([])
  const [loading, setLoading] = useState(true)
  const [userDomain, setUserDomain] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [maxBudgetFilter, setMaxBudgetFilter] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const domain = user.email?.split('@')[1] || ''
        setUserDomain(domain)
        loadWants(domain)
      }
    }
    init()
  }, [])

  const loadWants = async (domain: string) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/wants?institution_domain=${domain}`)
      if (!res.ok) throw new Error()
      const data: Want[] = await res.json()
      
      // Enrich wants with buyer profile details
      const enriched = await Promise.all(data.map(async (want) => {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name, trust_score, trust_badge')
          .eq('id', want.buyer_id)
          .single()
          
        return {
          ...want,
          buyer_name: profile?.display_name || 'Anonymous Student',
          buyer_badge: profile?.trust_badge || 'New',
          buyer_score: profile?.trust_score || 0.0
        }
      }))
      
      setWants(enriched)
    } catch {
      console.error('Failed to load wants')
    } finally {
      setLoading(false)
    }
  }

  // Filter logic
  const filteredWants = wants.filter((want) => {
    const matchesSearch = want.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (want.description && want.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
    const matchesBudget = !maxBudgetFilter || 
      (want.max_budget !== null && want.max_budget <= parseFloat(maxBudgetFilter))
      
    return matchesSearch && matchesBudget
  })

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>🏫 Campus Want Board</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              See what students at <strong>{userDomain || 'your campus'}</strong> are looking to buy
            </p>
          </div>
          <Link href="/wants/new" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px' }}>
            ➕ Post What You Need
          </Link>
        </div>

        {/* Filters Panel */}
        <div className="glass-panel" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="🔍 Search wants (e.g. textbook, desk)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ width: '180px' }}>
            <input 
              type="number" 
              className="input" 
              placeholder="💰 Max Budget..." 
              value={maxBudgetFilter}
              onChange={(e) => setMaxBudgetFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Wants List */}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading want board...</div>
        ) : filteredWants.length === 0 ? (
          <div className="glass-panel" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No wants match your search filters. Be the first to post a want!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filteredWants.map((want) => (
              <div 
                key={want.id} 
                className="glass-panel"
                style={{
                  padding: 'var(--space-6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>{want.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-4)' }}>
                    {want.description || 'No description provided.'}
                  </p>
                  
                  {/* Buyer detail */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                    <span>Posted by:</span>
                    <Link href={`/profile/${want.buyer_id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      {want.buyer_name}
                    </Link>
                    <TrustBadge userId={want.buyer_id} initialScore={want.buyer_score} initialBadge={want.buyer_badge} size="sm" />
                    <span>• {new Date(want.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Budget & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px', gap: 'var(--space-3)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Max Budget</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                      {want.max_budget ? `$${want.max_budget.toFixed(2)}` : 'Flexible'}
                    </span>
                  </div>
                  
                  {want.buyer_id !== currentUserId ? (
                    <Link 
                      href={`/listings/new?prefill_title=${encodeURIComponent(want.title)}&prefill_desc=${encodeURIComponent(want.description || '')}&want_buyer_id=${want.buyer_id}`}
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      🤝 I Have This
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Your posting
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
