'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        loadNotifications(user.id)
        
        // Setup real-time listener for notifications
        const channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const newNotification = payload.new as Notification
              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((c) => c + 1)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }
    
    getUser()
  }, [])

  const loadNotifications = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (error) throw error
      
      setNotifications(data || [])
      setUnreadCount((data || []).filter((n: Notification) => !n.read).length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        
      if (error) throw error
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false)
        
      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          padding: '6px',
          color: 'var(--text-primary)',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close click outside */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99
            }}
          />
          
          <div 
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '10px',
              width: '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--space-2) 0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              borderBottom: '1px solid var(--bg-tertiary)'
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    textDecoration: 'underline'
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading && notifications.length === 0 && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: 'var(--space-6)' }}>
                  Loading...
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: 'var(--space-6)' }}>
                  No notifications yet.
                </div>
              )}

              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--bg-tertiary)',
                    backgroundColor: n.read ? 'transparent' : 'rgba(79, 70, 229, 0.04)',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</span>
                    {!n.read && (
                      <button 
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{
                          background: 'none',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        ✓ Mark read
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {n.message}
                  </p>
                  {n.link && (
                    <Link 
                      href={n.link} 
                      onClick={() => {
                        setIsOpen(false)
                        handleMarkAsRead(n.id)
                      }}
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--accent-primary)',
                        fontWeight: 500,
                        marginTop: '4px',
                        display: 'inline-block'
                      }}
                    >
                      View Details →
                    </Link>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
