'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }
    getSession()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    setIsDropdownOpen(false)
  }

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      width: '100%',
      backgroundColor: 'rgba(var(--bg-primary), 0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--bg-tertiary)',
      height: '64px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        {/* Branding Logo */}
        <Link href={user ? "/listings" : "/"} style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--accent-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔄 CampusLoop
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginLeft: 'var(--space-8)', marginRight: 'auto' }}>
            <Link 
              href="/listings" 
              style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: isActive('/listings') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease'
              }}
            >
              Browse
            </Link>
            <Link 
              href="/wants" 
              style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: isActive('/wants') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease'
              }}
            >
              Want Board
            </Link>
            <Link 
              href="/transactions" 
              style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: isActive('/transactions') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease'
              }}
            >
              My Transactions
            </Link>
          </nav>
        )}

        {/* Action Elements / Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid var(--bg-tertiary)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setIsDropdownOpen(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }}
                    />
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        width: '200px',
                        zIndex: 50,
                        boxShadow: 'var(--shadow-lg)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </p>
                      </div>
                      <Link 
                        href={`/profile/${user.id}`} 
                        onClick={() => setIsDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: 'var(--space-2) var(--space-4)',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          transition: 'background-color 0.2s ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        My Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'block',
                          padding: 'var(--space-2) var(--space-4)',
                          fontSize: '0.9rem',
                          color: 'var(--danger)',
                          transition: 'background-color 0.2s ease',
                          textAlign: 'left',
                          background: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
