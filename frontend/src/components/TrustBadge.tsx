'use client'

import { useState } from 'react'

interface TrustBreakdown {
  completion_rate_score: number
  condition_accuracy_score: number
  response_time_score: number
  dispute_penalty_score: number
  account_age_bonus: number
  days_inactive: number
  decay_applied: number
}

interface TrustResponse {
  score: number
  badge: string
  breakdown: TrustBreakdown
}

interface TrustBadgeProps {
  userId: string
  initialScore?: number
  initialBadge?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function TrustBadge({ userId, initialScore, initialBadge, size = 'md' }: TrustBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [loading, setLoading] = useState(false)
  const [breakdown, setBreakdown] = useState<TrustBreakdown | null>(null)
  const [error, setError] = useState(false)
  const [currentScore, setCurrentScore] = useState<number | undefined>(initialScore)
  const [currentBadge, setCurrentBadge] = useState<string | undefined>(initialBadge)

  const fetchBreakdown = async () => {
    if (breakdown) return // Already loaded
    
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/trust/${userId}`)
      if (!res.ok) throw new Error()
      const data: TrustResponse = await res.json()
      setBreakdown(data.breakdown)
      setCurrentScore(data.score)
      setCurrentBadge(data.badge)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const badge = currentBadge || 'New'
  const score = currentScore !== undefined ? currentScore : 0.0

  // Styles based on badge
  const colors = {
    Trusted: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#10b981',
      glow: '0 0 8px rgba(16, 185, 129, 0.2)'
    },
    Verified: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#3b82f6',
      glow: 'none'
    },
    New: {
      bg: 'rgba(156, 163, 175, 0.1)',
      border: 'rgba(156, 163, 175, 0.3)',
      text: '#9ca3af',
      glow: 'none'
    },
    Flagged: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#ef4444',
      glow: '0 0 8px rgba(239, 68, 68, 0.2)'
    }
  }[badge as 'Trusted' | 'Verified' | 'New' | 'Flagged'] || {
    bg: 'rgba(156, 163, 175, 0.1)',
    border: 'rgba(156, 163, 175, 0.3)',
    text: '#9ca3af',
    glow: 'none'
  }

  const badgeSize = {
    sm: { padding: '2px 8px', fontSize: '0.75rem' },
    md: { padding: '4px 12px', fontSize: '0.85rem' },
    lg: { padding: '6px 16px', fontSize: '0.95rem' }
  }[size]

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => {
        setShowTooltip(true)
        fetchBreakdown()
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Visual Badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 600,
          borderRadius: '9999px',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          boxShadow: colors.glow,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'var(--font-display)',
          ...badgeSize
        }}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.text
        }} />
        {badge} {score.toFixed(1)}
      </span>

      {/* Tooltip Popup */}
      {showTooltip && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-10px)',
            zIndex: 50,
            width: '260px',
            padding: 'var(--space-4)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            textAlign: 'left',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>Trust Score Details</span>
            <span style={{ color: colors.text, fontWeight: 700 }}>{badge}</span>
          </div>

          {loading && (
            <div style={{ padding: 'var(--space-2) 0', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Loading metrics...
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', textAlign: 'center' }}>
              Failed to load metrics.
            </div>
          )}

          {!loading && !error && breakdown && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completion (35%)</span>
                <strong>{breakdown.completion_rate_score.toFixed(1)}/5.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Accuracy (25%)</span>
                <strong>{breakdown.condition_accuracy_score.toFixed(1)}/5.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Response Speed (15%)</span>
                <strong>{breakdown.response_time_score.toFixed(1)}/5.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Dispute Penalty (15%)</span>
                <strong>{breakdown.dispute_penalty_score.toFixed(1)}/5.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Account Age (10%)</span>
                <strong>{breakdown.account_age_bonus.toFixed(1)}/5.0</strong>
              </div>
              
              {breakdown.decay_applied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', borderTop: '1px dashed var(--danger)', paddingTop: '4px', marginTop: '2px' }}>
                  <span>Inactivity Decay</span>
                  <strong>-{breakdown.decay_applied.toFixed(1)}</strong>
                </div>
              )}
              
              <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '6px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Based on {breakdown.days_inactive} days of activity history.
              </div>
            </div>
          )}

          {!breakdown && !loading && !error && (
            <div>Hover to load breakdown.</div>
          )}
        </div>
      )}
    </div>
  )
}
