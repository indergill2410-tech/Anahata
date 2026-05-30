import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink1)', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2, margin: 0 }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: value ? 'var(--violet)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.25s ease', flexShrink: 0,
        boxShadow: value ? '0 0 14px rgba(112,72,232,0.4)' : 'none',
      }}>
        <span style={{
          position: 'absolute', top: 4, left: value ? 22 : 4,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)', display: 'block',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }} />
      </button>
    </div>
  );
}

function StatRing({ value, max, label, color, unit }: { value: number; max: number; label: string; color: string; unit?: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}20`} strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { success }      = useToast();
  const [prefs, setPrefs] = useState({
    binaural:    JSON.parse(localStorage.getItem('pref_binaural')  ?? 'true'),
    reminders:   JSON.parse(localStorage.getItem('pref_reminders') ?? 'false'),
    haptics:     JSON.parse(localStorage.getItem('pref_haptics')   ?? 'true'),
    autoSession: JSON.parse(localStorage.getItem('pref_autoSession') ?? 'false'),
  });

  // Stats from journal store
  const store: Record<string, { mood: number }> = (() => {
    try { return JSON.parse(localStorage.getItem('anahata_journal') || '{}'); } catch { return {}; }
  })();
  const totalSessions = Object.keys(store).length;
  const totalHours    = Math.round(totalSessions * 18 / 60 * 10) / 10;

  let streak = 0;
  const cur = new Date(); cur.setHours(0, 0, 0, 0);
  while (true) {
    const k = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    if (store[k]) { streak++; cur.setDate(cur.getDate() - 1); } else break;
  }

  // Favourite mood
  const moodCounts: Record<number, number> = {};
  Object.values(store).forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const topMood = Object.keys(moodCounts).sort((a, b) => moodCounts[+b] - moodCounts[+a])[0];
  const MOOD_LABELS: Record<string, string> = { '1':'Rough', '2':'Okay', '3':'Good', '4':'Great', '5':'Blissful' };

  function setPref(key: string, val: boolean) {
    setPrefs(p => ({ ...p, [key]: val }));
    localStorage.setItem(`pref_${key}`, JSON.stringify(val));
    success('Saved');
  }

  const initials = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase();

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>

      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 4 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7048E8, #3B5BDB)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#fff',
          boxShadow: '0 8px 28px rgba(112,72,232,0.45)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>{initials}</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {user?.name || 'Meditator'}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Stat rings */}
      <div className="card" style={{ padding: '18px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>Your practice</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatRing value={streak}        max={30}  label="Day streak" color="#F59F00" />
          <StatRing value={totalSessions} max={100} label="Sessions"   color="#7048E8" />
          <StatRing value={totalHours}    max={50}  label="Hours"      color="#0CA678" />
        </div>
        {topMood && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>
            Most frequent mood: <span style={{ fontWeight: 700, color: 'var(--ink1)' }}>{MOOD_LABELS[topMood] || 'Unknown'}</span>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="card" style={{ padding: '4px 18px' }}>
        <Toggle label="Binaural Beats"     desc="Stereo headphones required"     value={prefs.binaural}    onChange={v => setPref('binaural', v)} />
        <Toggle label="Daily Reminders"    desc="Notify me to meditate each day" value={prefs.reminders}   onChange={v => setPref('reminders', v)} />
        <Toggle label="Haptic Feedback"    desc="Vibrate on connect events"      value={prefs.haptics}     onChange={v => setPref('haptics', v)} />
        <Toggle label="Auto-start Session" desc="Begin when watch connects"      value={prefs.autoSession} onChange={v => setPref('autoSession', v)} />
      </div>

      {/* App info */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <p style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.9, margin: 0 }}>
          Anahata v1.0.0 · {MOOD_LABELS['3']} vibes<br/>
          Binaural beats · Indian classical · Solfeggio
        </p>
      </div>

      {/* Sign out */}
      <button className="btn" onClick={logout} style={{
        width: '100%', height: 46, fontSize: 13, fontWeight: 600,
        color: '#f87171', background: 'rgba(248,113,113,0.07)',
        border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r)',
      }}>
        Sign Out
      </button>
    </div>
  );
}
