import React, { useEffect, useState } from 'react';

interface Session { id: string; created_at: string; heart_rate?: number; brainwave_state?: string; }

export default function SessionLog() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('anahata_token');
    if (!token) return;

    fetch('/api/sessions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  if (!sessions.length) return null;

  return (
    <div className="card">
      <h2>Recent Sessions</h2>
      {sessions.slice(0, 5).map((s) => (
        <div className="metric" key={s.id}>
          <span className="metric-label">
            {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontFamily: 'sans-serif', fontSize: '0.85rem', color: 'var(--accent-soft)' }}>
            {s.heart_rate} BPM → {s.brainwave_state}
          </span>
        </div>
      ))}
    </div>
  );
}
