import React from 'react';
import { useAuth } from '../context/AuthContext';

const TITLES: Record<string,string> = { journey:'ANAHATA', studio:'STUDIO', sessions:'HISTORY', profile:'PROFILE' };

export default function TopBar({ tab, onSignIn }: { tab: string; onSignIn: () => void }) {
  const { user } = useAuth() as { user: { name?: string; email?: string } | null };
  return (
    <div className="topbar">
      <span className="topbar-logo">{TITLES[tab] || 'ANAHATA'}</span>
      {user ? (
        <span style={{ width:32, height:32, borderRadius:'50%', background:'var(--neon-red-lo)', border:'1px solid rgba(232,48,58,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--neon-red)', fontFamily:'Orbitron,sans-serif' }}>
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
        </span>
      ) : (
        <button onClick={onSignIn} style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:'var(--neon-red)', background:'var(--neon-red-lo)', border:'1px solid rgba(232,48,58,0.3)', borderRadius:20, padding:'6px 16px', cursor:'pointer', fontFamily:'inherit' }}>
          SIGN IN
        </button>
      )}
    </div>
  );
}
