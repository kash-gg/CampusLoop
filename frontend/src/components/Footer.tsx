import React from 'react'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--bg-tertiary)',
      backgroundColor: 'var(--bg-secondary)',
      padding: 'var(--space-8) 0',
      marginTop: 'var(--space-16)',
      fontSize: '0.875rem',
      color: 'var(--text-secondary)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        <div>
          <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-display)' }}>🔄 CampusLoop</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Domain-scoped peer-to-peer student marketplace.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Terms</a>
          <a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Privacy</a>
          <a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Safety Guidelines</a>
        </div>
        <div>
          <span>© {new Date().getFullYear()} CampusLoop. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
