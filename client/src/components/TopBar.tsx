import React from 'react';
import { useAuth } from '../context/AuthContext';

const TITLES: Record<string, string> = {
  journey: 'ANAHATA',
  library: 'Library',
  studio: 'Studio',
  journal: 'Journal',
  sessions: 'History',
  profile: 'Dashboard',
};

interface TopBarProps {
  tab: string;
  onSignIn: () => void;
  onBack?: () => void;
}

export default function TopBar({ tab, onSignIn, onBack }: TopBarProps) {
  const { user } = useAuth() as { user: { name?: string; email?: string } | null };
  const isHome = tab === 'journey';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isHome && onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 6px rgba(23,18,10,0.07)',
              flexShrink: 0,
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg2)';
              e.currentTarget.style.transform = 'translateX(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg1)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <span
          className="topbar-logo"
          style={{
            fontFamily: isHome ? undefined : "'Space Grotesk', sans-serif",
            fontSize: isHome ? undefined : 17,
            fontWeight: isHome ? undefined : 900,
            letterSpacing: isHome ? undefined : '0',
            color: isHome ? undefined : 'var(--ink1)',
            textTransform: isHome ? undefined : 'none',
          }}
        >
          {TITLES[tab] || 'ANAHATA'}
        </span>
      </div>

      {user ? (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--violet), var(--blue))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          flexShrink: 0,
        }}>
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </div>
      ) : (
        <button
          onClick={onSignIn}
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0',
            color: 'var(--violet)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(112,72,232,0.08))',
            border: '1px solid rgba(112,72,232,0.18)',
            borderRadius: 20,
            padding: '8px 15px',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: '0 8px 18px rgba(112,72,232,0.12)',
            transition: 'all 0.18s ease',
          }}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
