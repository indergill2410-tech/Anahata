import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SessionsPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/sessions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dashboard fade-in">
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-label">Session History</span>
          <span className="text-subtle" style={{ fontSize: 12 }}>{sessions.length} sessions</span>
        </div>

        {loading && <p className="text-muted" style={{ fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading...</p>}
        {!loading && !sessions.length && (
          <p className="text-subtle" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No sessions yet. Start your first meditation.</p>
        )}
        {sessions.map(s => (
          <div className="session-row" key={s.id}>
            <div className="session-row-left">
              <span className="session-row-date">{fmt(s.created_at)}</span>
              <span className="session-row-meta">{s.musical_tempo} BPM tempo · {s.binaural_hz}Hz binaural</span>
            </div>
            <div className="session-row-right">
              <span className="session-row-bpm">{s.heart_rate} BPM</span>
              <span className="session-row-state">{s.brainwave_state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
