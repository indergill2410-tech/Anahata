import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkeletonTrackCard } from '../components/SkeletonCard';

interface Session { id: string; brainwave_state?: string; created_at: string; heart_rate?: number; duration_seconds?: number; }

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}
function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
}

const BW_COLOUR: Record<string, string> = { Delta:'#818cf8', Theta:'#a78bfa', Alpha:'#34d399', Beta:'#fbbf24', Gamma:'#f472b6' };

export default function SessionsPage() {
  const { authFetch } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [authFetch]);

  return (
    <div className="dashboard fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:'var(--t3)' }}>
          {loading ? '' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {loading && Array.from({length:5}).map((_,i) => <SkeletonTrackCard key={i} />)}

      {error && (
        <div className="card" style={{ padding:20, textAlign:'center', color:'#f87171', fontSize:13 }}>
          Failed to load sessions: {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--t3)' }}>
          <p style={{ fontSize:36, marginBottom:12 }}>🪷</p>
          <p style={{ fontSize:14 }}>No sessions yet.</p>
          <p style={{ fontSize:12, marginTop:6 }}>Complete your first meditation to see it here.</p>
        </div>
      )}

      {!loading && sessions.map(s => (
        <div key={s.id} className="card" style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>
                {s.brainwave_state
                  ? <span style={{ color: BW_COLOUR[s.brainwave_state] || 'var(--t2)' }}>{s.brainwave_state}</span>
                  : 'Meditation'} Session
              </p>
              <p style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{fmt(s.created_at)}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:20, fontWeight:300, color:'var(--t1)', fontVariantNumeric:'tabular-nums' }}>
                {s.heart_rate ?? '—'}
                <span style={{ fontSize:11, color:'var(--t3)', marginLeft:3 }}>bpm</span>
              </p>
              {s.duration_seconds && (
                <p style={{ fontSize:10, color:'var(--t3)' }}>{fmtDur(s.duration_seconds)}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
