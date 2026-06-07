import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useJournalSummary } from '../hooks/useJournalSummary';

type PrefKey = 'binaural' | 'reminders' | 'haptics' | 'autoSession';

type ToggleProps = {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Okay',
  3: 'Good',
  4: 'Great',
  5: 'Blissful',
};

function readPref(key: PrefKey, fallback: boolean) {
  try {
    const stored = localStorage.getItem(`pref_${key}`);
    return stored === null ? fallback : Boolean(JSON.parse(stored));
  } catch {
    return fallback;
  }
}

function formatDate(key?: string) {
  if (!key) return 'No entries yet';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function compactNumber(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

function Toggle({ label, desc, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(23,18,10,0.06)', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '2px 0 0' }}>{desc}</p>}
      </div>
      <button
        aria-pressed={value}
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          border: 'none',
          cursor: 'pointer',
          background: value ? 'var(--violet)' : 'rgba(23,18,10,0.12)',
          position: 'relative',
          transition: 'background 0.25s ease',
          flexShrink: 0,
          boxShadow: value ? '0 0 14px rgba(112,72,232,0.28)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute',
          top: 4,
          left: value ? 22 : 4,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'block',
          boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
        }} />
      </button>
    </div>
  );
}

function StatRing({ value, max, label, color, unit = '' }: { value: number; max: number; label: string; color: string; unit?: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}20`} strokeWidth="5" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{compactNumber(value)}{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const { summary, loading: journalLoading, error: journalError, isCloud } = useJournalSummary(140);
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    binaural: readPref('binaural', true),
    reminders: readPref('reminders', false),
    haptics: readPref('haptics', true),
    autoSession: readPref('autoSession', false),
  });

  function setPref(key: PrefKey, val: boolean) {
    setPrefs(p => ({ ...p, [key]: val }));
    localStorage.setItem(`pref_${key}`, JSON.stringify(val));
    success('Saved');
  }

  const initials = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const topMood = summary.topMood ? MOOD_LABELS[summary.topMood] : null;
  const recent = summary.lastEntry;
  const milestones = [
    { label: 'First reflection', unlocked: summary.totalEntries > 0, color: '#7048E8', hint: 'Save one entry' },
    { label: 'Seven-day rhythm', unlocked: summary.streak >= 7, color: '#F59F00', hint: `${Math.min(summary.streak, 7)}/7 days` },
    { label: 'Dream keeper', unlocked: summary.dreamCount >= 3, color: '#6366F1', hint: `${Math.min(summary.dreamCount, 3)}/3 dreams` },
    { label: 'Deep writer', unlocked: summary.totalWords >= 1000, color: '#0CA678', hint: `${Math.min(summary.totalWords, 1000)}/1000 words` },
  ];

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 4 }}>
        <div style={{
          width: 78,
          height: 78,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7048E8, #3B5BDB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 900,
          color: '#fff',
          boxShadow: '0 10px 30px rgba(112,72,232,0.42)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>{initials}</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {user?.name || 'Meditator'}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink3)' }}>{user?.email}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '18px 16px', borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <SectionTitle>Your practice</SectionTitle>
          <span style={{ fontSize: 10, fontWeight: 800, color: isCloud ? '#0CA678' : '#D97706', textTransform: 'uppercase' }}>
            {journalLoading ? 'Syncing' : isCloud ? 'Account saved' : 'Device saved'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
          <StatRing value={summary.streak} max={30} label="Day streak" color="#F59F00" />
          <StatRing value={summary.totalEntries} max={100} label="Entries" color="#7048E8" />
          <StatRing value={summary.totalWords} max={5000} label="Words" color="#0CA678" />
        </div>
        {topMood && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>
            Most frequent mood: <span style={{ fontWeight: 800, color: 'var(--ink1)' }}>{topMood}</span>
          </div>
        )}
        {journalError && <p style={{ margin: '12px 0 0', fontSize: 11, color: '#D97706', textAlign: 'center' }}>Showing cached journal memory.</p>}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <SectionTitle>Journal memory</SectionTitle>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 700 }}>{formatDate(recent?.entry_date)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Check-ins', value: summary.checkinCount, color: '#7048E8' },
            { label: 'Daily', value: summary.dailyCount, color: '#D97706' },
            { label: 'Dreams', value: summary.dreamCount, color: '#6366F1' },
          ].map(item => (
            <div key={item.label} style={{ borderRadius: 14, padding: '11px 8px', background: `${item.color}0F`, border: `1px solid ${item.color}24`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 900, color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {recent ? (
          <div style={{ borderRadius: 16, padding: 14, background: 'rgba(23,18,10,0.035)', border: '1px solid rgba(23,18,10,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Latest {recent.entry_type}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65 }}>
              {recent.text.length > 140 ? `${recent.text.slice(0, 140)}...` : recent.text}
            </p>
          </div>
        ) : (
          <div style={{ borderRadius: 16, padding: 18, background: 'rgba(112,72,232,0.06)', border: '1px dashed rgba(112,72,232,0.22)', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
            Your profile will grow as journal entries are saved.
          </div>
        )}

        {summary.topTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {summary.topTags.map(item => (
              <span key={item.tag} style={{ borderRadius: 999, padding: '6px 10px', background: 'rgba(112,72,232,0.08)', color: 'var(--violet)', fontSize: 11, fontWeight: 800 }}>
                {item.tag} x{item.count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20 }}>
        <SectionTitle>Milestones</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9, marginTop: 12 }}>
          {milestones.map(item => (
            <div key={item.label} style={{
              borderRadius: 15,
              padding: 12,
              border: `1px solid ${item.unlocked ? `${item.color}35` : 'rgba(23,18,10,0.07)'}`,
              background: item.unlocked ? `${item.color}10` : '#FFFFFF',
              opacity: item.unlocked ? 1 : 0.72,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: item.unlocked ? item.color : 'var(--bg3)', marginBottom: 8, boxShadow: item.unlocked ? `0 0 14px ${item.color}45` : 'none' }} />
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink1)', lineHeight: 1.25 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 3, fontWeight: 700 }}>{item.unlocked ? 'Unlocked' : item.hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '4px 18px', borderRadius: 20 }}>
        <Toggle label="Binaural beats" desc="Stereo headphones recommended" value={prefs.binaural} onChange={v => setPref('binaural', v)} />
        <Toggle label="Daily reminders" desc="A small nudge to return" value={prefs.reminders} onChange={v => setPref('reminders', v)} />
        <Toggle label="Haptic feedback" desc="Vibrate on connect events" value={prefs.haptics} onChange={v => setPref('haptics', v)} />
        <Toggle label="Auto-start session" desc="Begin when watch connects" value={prefs.autoSession} onChange={v => setPref('autoSession', v)} />
      </div>

      <div className="card" style={{ padding: '14px 18px', borderRadius: 20 }}>
        <p style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.9, margin: 0 }}>
          Anahata v1.0.0<br />
          PocketBase account memory, binaural beats, Indian classical layers, and Solfeggio textures.
        </p>
      </div>

      <button className="btn" onClick={logout} style={{
        width: '100%',
        height: 46,
        fontSize: 13,
        fontWeight: 700,
        color: '#D9480F',
        background: 'rgba(217,72,15,0.07)',
        border: '1px solid rgba(217,72,15,0.2)',
        borderRadius: 'var(--r)',
      }}>
        Sign out
      </button>
    </div>
  );
}
