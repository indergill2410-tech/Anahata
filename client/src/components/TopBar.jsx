import React from 'react';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  dashboard: 'Anahata',
  sessions: 'History',
  profile: 'Profile'
};

export default function TopBar({ tab }) {
  const { user } = useAuth();
  return (
    <div className="topbar">
      <span className="topbar-logo">
        {tab === 'dashboard' ? <>Ana<span>hata</span></> : TITLES[tab]}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user && (
          <span style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent-low)', border: '1px solid rgba(109,74,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'var(--accent-hi)'
          }}>
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>
    </div>
  );
}
