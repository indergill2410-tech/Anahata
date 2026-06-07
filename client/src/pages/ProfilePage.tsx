import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useUserDashboard } from '../hooks/useUserDashboard';

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

function compactNumber(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

function shortText(text = '', max = 132) {
  const clean = text.trim();
  if (!clean) return 'No note yet.';
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function formatDate(value?: string) {
  if (!value) return 'No activity yet';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No activity yet';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function Toggle({ label, desc, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(23,18,10,0.06)', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink1)', margin: 0 }}>{label}</p>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

function MetricTile({ label, value, color, note }: { label: string; value: string; color: string; note?: string }) {
  return (
    <div style={{ borderRadius: 16, padding: 14, background: '#FFFFFF', border: `1px solid ${color}24`, boxShadow: '0 2px 10px rgba(23,18,10,0.045)', minWidth: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, boxShadow: `0 0 14px ${color}42`, marginBottom: 10 }} />
      <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 800, marginTop: 5 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color, fontWeight: 800, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</div>}
    </div>
  );
}

function ActivityRow({ color, title, meta, body }: { color: string; title: string; meta: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(23,18,10,0.055)' }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}36`, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800, flexShrink: 0 }}>{meta}</div>
        </div>
        <p style={{ margin: 0, color: 'var(--ink3)', fontSize: 12, lineHeight: 1.55 }}>{body}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const dashboard = useUserDashboard();
  const summary = dashboard.journal.summary;
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
  const topMood = summary.topMood ? MOOD_LABELS[summary.topMood] : 'Not enough data';
  const latestJournal = summary.lastEntry;
  const latestDream = dashboard.dreamEntries[0];
  const latestSession = dashboard.sessions[0];
  const latestPlay = dashboard.library.recentPlay;
  const sessionMinutes = dashboard.totals.sessionMinutes;
  const topBrainwave = dashboard.sessionStats.topBrainwaveState || 'New practice';

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7048E8, #3B5BDB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 25,
          fontWeight: 900,
          color: '#fff',
          boxShadow: '0 10px 30px rgba(112,72,232,0.38)',
          fontFamily: "'Space Grotesk', sans-serif",
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 25, fontWeight: 900, color: 'var(--ink1)', letterSpacing: '0' }}>
            Your dashboard
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Meditator'} - {user?.email}
          </p>
        </div>
        <span style={{ borderRadius: 999, padding: '6px 9px', background: dashboard.loading ? 'rgba(217,119,6,0.08)' : 'rgba(12,166,120,0.08)', color: dashboard.loading ? '#D97706' : '#0CA678', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
          {dashboard.loading ? 'Syncing' : 'Saved'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <MetricTile label="Journal entries" value={compactNumber(dashboard.totals.journalEntries)} color="#7048E8" note={`${summary.streak} day streak`} />
        <MetricTile label="Dream logs" value={compactNumber(dashboard.totals.dreamLogs)} color="#6366F1" note={dashboard.dreamLucidityAverage ? `${dashboard.dreamLucidityAverage}/5 lucidity` : 'Start tonight'} />
        <MetricTile label="Sessions" value={compactNumber(dashboard.totals.sessions)} color="#0CA678" note={formatMinutes(sessionMinutes)} />
        <MetricTile label="Music plays" value={compactNumber(dashboard.totals.plays)} color="#D97706" note={`${dashboard.totals.favourites} favourites`} />
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <SectionTitle>Practice memory</SectionTitle>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 800 }}>{formatDate(latestJournal?.entry_date)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Words', value: compactNumber(summary.totalWords), color: '#7048E8' },
            { label: 'Mood', value: topMood, color: '#E64980' },
            { label: 'Brainwave', value: topBrainwave, color: '#0CA678' },
          ].map(item => (
            <div key={item.label} style={{ borderRadius: 14, padding: '11px 8px', background: `${item.color}0F`, border: `1px solid ${item.color}24`, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.2, fontWeight: 900, color: item.color, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 800, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        {latestJournal ? (
          <ActivityRow
            color={latestJournal.entry_type === 'dream' ? '#6366F1' : latestJournal.entry_type === 'daily' ? '#D97706' : '#7048E8'}
            title={`Latest ${latestJournal.entry_type}`}
            meta={formatDate(latestJournal.entry_date)}
            body={shortText(latestJournal.text)}
          />
        ) : (
          <div style={{ borderRadius: 16, padding: 18, background: 'rgba(112,72,232,0.06)', border: '1px dashed rgba(112,72,232,0.22)', color: 'var(--ink3)', fontSize: 13, textAlign: 'center' }}>
            Save a journal entry and your dashboard will start building a personal memory map.
          </div>
        )}
        {dashboard.error && <p style={{ margin: 0, fontSize: 11, color: '#D97706' }}>Some dashboard data is cached until the next sync.</p>}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Dream logs</SectionTitle>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#6366F1' }}>{dashboard.totals.dreamLogs} total</span>
        </div>
        {latestDream ? (
          <>
            <ActivityRow color="#6366F1" title="Latest dream" meta={formatDate(latestDream.entry_date)} body={shortText(latestDream.text)} />
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 2 }}>
              {latestDream.tags.slice(0, 6).map(tag => (
                <span key={tag} style={{ borderRadius: 999, padding: '6px 10px', background: 'rgba(99,102,241,0.08)', color: '#6366F1', fontSize: 11, fontWeight: 900 }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7 }}>Dreams saved from the Journal will appear here as a private dream log.</p>
        )}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Sessions</SectionTitle>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#0CA678' }}>{formatMinutes(sessionMinutes)}</span>
        </div>
        {latestSession ? (
          <ActivityRow
            color="#0CA678"
            title={`${latestSession.brainwave_state || 'Meditation'} session`}
            meta={formatDate(latestSession.created || latestSession.created_at)}
            body={`${latestSession.heart_rate || '-'} bpm average - ${formatMinutes(Math.round((latestSession.duration_seconds || 0) / 60))}`}
          />
        ) : (
          <p style={{ margin: 0, color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7 }}>Completed meditation sessions will collect here with brainwave, duration, and heart data.</p>
        )}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Music memory</SectionTitle>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#D97706' }}>{dashboard.library.totalPlays} plays</span>
        </div>
        {latestPlay ? (
          <>
            <ActivityRow color={latestPlay.albumColor} title={latestPlay.title} meta={formatDate(latestPlay.created)} body={`${latestPlay.artist} - ${latestPlay.albumTitle}`} />
            <div style={{ marginTop: 4, borderRadius: 14, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)', padding: 12, fontSize: 12, color: 'var(--ink2)' }}>
              Most returned-to album: <strong>{dashboard.library.topAlbum || 'Still discovering'}</strong>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7 }}>Library plays and favourite tracks will shape your music memory once listening is recorded.</p>
        )}
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 20 }}>
        <SectionTitle>Personal settings</SectionTitle>
        <div style={{ marginTop: 6 }}>
          <Toggle label="Binaural beats" desc="Stereo headphones recommended" value={prefs.binaural} onChange={v => setPref('binaural', v)} />
          <Toggle label="Daily reminders" desc="A small nudge to return" value={prefs.reminders} onChange={v => setPref('reminders', v)} />
          <Toggle label="Haptic feedback" desc="Vibrate on connection events" value={prefs.haptics} onChange={v => setPref('haptics', v)} />
          <Toggle label="Auto-start session" desc="Begin when watch connects" value={prefs.autoSession} onChange={v => setPref('autoSession', v)} />
        </div>
      </div>

      <button className="btn" onClick={logout} style={{
        width: '100%',
        height: 46,
        fontSize: 13,
        fontWeight: 800,
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
