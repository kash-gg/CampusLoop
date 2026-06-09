'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import TrustBadge from '@/components/TrustBadge'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  trust_score: number
  trust_badge: string
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [surgeActive, setSurgeActive] = useState(false)
  const [surgeCount, setSurgeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Fetch profile
        const { data: prof } = await supabase
          .from('users')
          .select('id, email, display_name, trust_score, trust_badge')
          .eq('id', user.id)
          .single()
          
        setProfile(prof as UserProfile)
        
        // Fetch Surge Status
        const domain = user.email?.split('@')[1] || ''
        try {
          const res = await fetch(`http://localhost:8000/api/surge/${domain}`)
          if (res.ok) {
            const data = await res.json()
            setSurgeActive(data.is_surge)
            setSurgeCount(data.today_count)
          }
        } catch {
          // Ignore
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading CampusLoop...</div>
      </div>
    )
  }

  // MARKETING HOMEPAGE (Not logged in)
  if (!user) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Subtle glowing mesh backgrounds */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
            zIndex: -1
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '50%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0) 70%)',
            zIndex: -1
          }} />

          <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center', maxWidth: '800px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '6px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-primary)',
              borderRadius: '9999px',
              marginBottom: 'var(--space-6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Exclusively for College Students
            </span>

            <h1 style={{
              fontSize: '3.5rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 'var(--space-4)'
            }}>
              The Peer-to-Peer Marketplace Built on <span style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--success) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Campus Trust</span>
            </h1>

            <p style={{
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--space-8)',
              maxWidth: '650px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Buy and sell electronics, textbooks, furniture, and transit items securely with students at your university. Scoped domains, smart search, and multi-factor trust ratings.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}>
                Start Trading Now
              </Link>
              <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '12px 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}>
                See How It Works
              </a>
            </div>

            {/* Mockup Showcase Card */}
            <div style={{ marginTop: 'var(--space-16)', display: 'flex', justifyContent: 'center' }}>
              <div 
                className="glass-panel" 
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  padding: 'var(--space-6)',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-glass)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  gap: 'var(--space-6)',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>FEATURED LISTING</span>
                  <h3 style={{ fontSize: '1.4rem', margin: '4px 0 8px 0' }}>Dell UltraSharp 27" 4K Monitor</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)' }}>
                    Perfect condition desk monitor. Moving back home next week and can't take it. Meet up at Library lobby.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-primary)', marginRight: '8px' }}>$180</span>
                    <span style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontWeight: 600 }}>Like New</span>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  width: '220px',
                  border: '1px solid var(--bg-tertiary)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>SELLER CREDENTIALS</span>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>Aarav Sharma</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>🎓 iitd.ac.in</div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    🟢 Trusted 4.8
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How it works section */}
          <section id="how-it-works" style={{ borderTop: '1px solid var(--bg-tertiary)', padding: 'var(--space-16) 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 'var(--space-12)' }}>Built on Three Core Principles</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-8)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🛡️</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Scoped Security</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    You only trade with students from your own verified college domain (e.g. .ac.in / .edu).
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📊</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Verified Trust Scores</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Every user has a public trust rating based on completion history, condition accuracy, and dispute records.
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎯</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Smart Semantic Search</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Vector embeddings allow natural query matchings (e.g. "comfy seat for study" displays desk chairs).
                  </p>
                </div>
              </div>
            </div>
          </section>
          <Footer />
        </main>
      </>
    )
  }

  // STUDENT DASHBOARD (Logged in)
  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        
        {/* Welcome Dashboard Banner */}
        <div 
          className="glass-panel" 
          style={{
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-6)'
          }}
        >
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--space-2)' }}>
              Welcome back, {profile?.display_name || 'Student'}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Scoping deals at <strong>{user.email?.split('@')[1]}</strong>.
            </p>
          </div>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px var(--space-4)', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Your Seller Rating:</span>
              <TrustBadge userId={profile.id} initialScore={profile.trust_score} initialBadge={profile.trust_badge} size="md" />
            </div>
          )}
        </div>

        {/* Surge Banner */}
        {surgeActive && (
          <div 
            className="glass-panel" 
            style={{
              padding: 'var(--space-4) var(--space-6)',
              marginBottom: 'var(--space-8)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.5rem' }}>📈</span>
              <div>
                <strong style={{ color: 'var(--warning)', fontSize: '1rem' }}>Semester End Surge Detected!</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  Students are listing items in high volume ({surgeCount} items added today). Competitively price your listings or grab hot deals.
                </p>
              </div>
            </div>
            <Link href="/listings" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', backgroundColor: 'var(--warning)', color: '#000', fontWeight: 600 }}>
              Browse Hot Deals
            </Link>
          </div>
        )}

        {/* Quick Access Menu Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
          <Link href="/listings" className="glass-panel" style={{ padding: 'var(--space-6)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Browse Listings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Search campus items with smart search filters.</p>
          </Link>

          <Link href="/listings/new" className="glass-panel" style={{ padding: 'var(--space-6)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem' }}>🛍️</div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Sell an Item</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Post items for sale and negotiate meetups.</p>
          </Link>

          <Link href="/wants" className="glass-panel" style={{ padding: 'var(--space-6)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem' }}>🏫</div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Want Board</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Request items you need or fulfill student requests.</p>
          </Link>

          <Link href="/transactions" className="glass-panel" style={{ padding: 'var(--space-6)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem' }}>🤝</div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>My Transactions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Coordinate meetups, rates, or resolve disputes.</p>
          </Link>
        </div>

        {/* Feature section info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-8)'
        }}>
          {/* Dispute alert section */}
          <div className="glass-panel" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)' }}>🛡️ Trust Guidelines</h3>
            <ul style={{ paddingLeft: 'var(--space-4)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.9rem' }}>
              <li><strong>Verify Item Condition:</strong> Inspect items thoroughly during the meetup.</li>
              <li><strong>Rate Honestly:</strong> Confirming receipt requires condition accuracy ratings.</li>
              <li><strong>Safe Meetups:</strong> Coordinate meetups at public campus locations (e.g. library, cafeteria).</li>
              <li><strong>Resolve Disputes:</strong> File disputes if item is misrepresented. Outcomes affect user trust badges.</li>
            </ul>
          </div>
          
          <div className="glass-panel" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)' }}>📈 Surge Detection Insights</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Our engine tracks listings frequency dynamically. When semester ends approach, graduation spikes are detected. We guide you to pricing competitively to help clean out your dorm rooms faster!
            </p>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}
