import React from 'react';
import { useAuth } from '../context/AuthContext';

const TITLES = { journey: 'Anahata', studio: 'Studio', sessions: 'History', profile: 'Profile' };

export default function TopBar({ tab, onSignIn }) {
  const { user } = useAuth();
  return (
    <div className="topbar">
      <span className="topbar-logo">
        {tab === 'journey' ? <>Ana<span style={{ color: 'var(--t2)' }}>hata</span></> : TITLES[tab]}
      </span>
      {user ? (
        <span style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--accent-low)', border: '1px solid rgba(196,97,58,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--accent)',
        }}>
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </span>
      ) : (
        <button onClick={onSignIn} style={{
          fontSize: 12, fontWeight: 600, color: 'var(--accent)',
          background: 'var(--accent-low)', border: '1px solid rgba(196,97,58,0.25)',
          borderRadius: 20, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Sign In
        </button>
      )}
    </div>
  );
}
