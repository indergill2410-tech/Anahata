import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useUserDashboard } from '../hooks/useUserDashboard';
import InstallAppControl from '../components/InstallAppControl';
import { createJournalApi } from '../services/journalApi';
import { clearLocalJournalEntries } from '../services/journalMemory';

type PrefKey = 'binaural' | 'reminders' | 'haptics' | 'autoSession';

type ToggleProps = {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

type OrbProps = {
  color: string;
  accent?: string;
  size?: number;
  children?: React.ReactNode;
};

const DEFAULT_PREFS: Record<PrefKey, boolean> = {
  binaural: true,
  reminders: false,
  haptics: true,
  autoSession: false,
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

function shortText(text = '', max = 136) {
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

function sourceLabel(source?: string) {
  if (source === 'watch') return 'Smart watch';
  if (source === 'demo') return 'Practice signal';
  if (source === 'websocket') return 'Live watch';
  return 'Entered signal';
}

function SectionLabel({ children, color = 'var(--ink3)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase', color, fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

function ResonanceOrb({ color, accent = '#FFFFFF', size = 92, children }: OrbProps) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: -13, borderRadius: '50%', border: `1px solid ${color}24` }} />
      <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid ${color}38`, boxShadow: `0 0 28px ${color}28` }} />
      <span style={{ position: 'absolute', width: size * 0.2, height: size * 0.2, right: -2, top: size * 0.18, borderRadius: '50%', background: accent, border: `2px solid ${color}40`, boxShadow: `0 0 18px ${color}34` }} />
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(circle at 34% 30%, ${accent}E6, ${color} 48%, ${color}92 76%, rgba(23,18,10,0.08))`,
        boxShadow: `inset 0 2px 12px rgba(255,255,255,0.36), 0 18px 42px ${color}35`,
        color: '#FFFFFF',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 900,
      }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid rgba(23,18,10,0.06)', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: 'var(--ink3)', margin: '2px 0 0' }}>{desc}</p>}
      </div>
      <button
        aria-pressed={value}
        onClick={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          border: `1px solid ${value ? 'rgba(112,72,232,0.3)' : 'rgba(23,18,10,0.08)'}`,
          background: value ? 'linear-gradient(135deg, #7048E8, #3B5BDB)' : 'rgba(23,18,10,0.08)',
          position: 'relative',
          transition: 'background 0.25s ease',
          flexShrink: 0,
          boxShadow: value ? '0 0 16px rgba(112,72,232,0.24)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute',
          top: 4,
          left: value ? 24 : 4,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#FFFFFF',
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'block',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function RhythmRow({ color, label, meta, body }: { color: string; label: string; meta: string; body: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'start', padding: '12px 0', borderBottom: '1px solid rgba(23,18,10,0.055)' }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #FFFFFF, ${color} 58%, ${color}88)`, border: `1px solid ${color}40`, boxShadow: `0 0 18px ${color}32` }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 900, flexShrink: 0 }}>{meta}</div>
        </div>
        <p style={{ margin: 0, color: 'var(--ink3)', fontSize: 12, lineHeight: 1.55 }}>{body}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, authFetch, requestVerification } = useAuth();
  const { success, error, info } = useToast();
  const dashboard = useUserDashboard();
  const journalApi = useMemo(() => createJournalApi(authFetch), [authFetch]);
  const summary = dashboard.journal.summary;
  const [privacyBusy, setPrivacyBusy] = useState<'export' | 'delete' | null>(null);
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    binaural: readPref('binaural', DEFAULT_PREFS.binaural),
    reminders: readPref('reminders', DEFAULT_PREFS.reminders),
    haptics: readPref('haptics', DEFAULT_PREFS.haptics),
    autoSession: readPref('autoSession', DEFAULT_PREFS.autoSession),
  });

  useEffect(() => {
    let active = true;
    authFetch('/api/profile/preferences')
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (!active || !data?.preferences) return;
        const next = { ...DEFAULT_PREFS, ...data.preferences };
        setPrefs(next);
        (Object.keys(next) as PrefKey[]).forEach(key => {
          localStorage.setItem(`pref_${key}`, JSON.stringify(next[key]));
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [authFetch, user?.id]);

  async function ensureVerified(message: string) {
    if (user?.verified === true) return true;
    try { await requestVerification(); } catch { /* global banner keeps retry available */ }
    info(message);
    return false;
  }

  async function setPref(key: PrefKey, val: boolean) {
    if (!(await ensureVerified('Verify your email to save personal settings.'))) return;

    const next = { ...prefs, [key]: val };
    try {
      const res = await authFetch('/api/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: { [key]: val } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Preference save failed');
      const saved = { ...next, ...(data.preferences || {}) };
      setPrefs(saved);
      (Object.keys(saved) as PrefKey[]).forEach(prefKey => {
        localStorage.setItem(`pref_${prefKey}`, JSON.stringify(saved[prefKey]));
      });
      success('Saved');
    } catch (err) {
      error((err as Error).message || 'Personal settings need another try.');
    }
  }

  async function handleExportJournal() {
    setPrivacyBusy('export');
    try {
      const data = await journalApi.exportEntries();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anahata-journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      success(data.count ? 'Your journal copy is ready.' : 'Your journal is still waiting for its first entry.');
    } catch (err) {
      error((err as Error).message || 'Your journal copy needs another try.');
    } finally {
      setPrivacyBusy(null);
    }
  }

  async function handleClearJournal() {
    if (!(await ensureVerified('Verify your email before clearing private journal data.'))) return;

    const ok = window.confirm('This clears your private journal entries from this account and this device. This cannot be undone. Continue?');
    if (!ok) {
      info('Nothing changed.');
      return;
    }

    setPrivacyBusy('delete');
    try {
      const result = await journalApi.deleteAll();
      clearLocalJournalEntries();
      localStorage.removeItem('anahata_pending_journal');
      await dashboard.refresh();
      success(result.deleted ? 'Your private journal has been cleared.' : 'There was no journal writing to clear.');
    } catch (err) {
      error((err as Error).message || 'Your journal needs another try before it can be cleared.');
    } finally {
      setPrivacyBusy(null);
    }
  }

  const initials = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const topMood = summary.topMood ? MOOD_LABELS[summary.topMood] : 'New signal';
  const latestJournal = summary.lastEntry;
  const latestDream = dashboard.dreamEntries[0];
  const latestSession = dashboard.sessions[0];
  const latestPlay = dashboard.library.recentPlay;
  const latestBiometric = dashboard.biometrics.latestSample || dashboard.biometrics.samples[0];
  const biometricAdvice = dashboard.biometrics.advice;
  const sessionMinutes = dashboard.totals.sessionMinutes;
  const biometricMetrics = biometricAdvice?.metrics;
  const biometricBreathing = biometricAdvice?.breathing;
  const biometricMusic = biometricAdvice?.music;
  const biometricZone = biometricMetrics?.zone;
  const biometricTrend = biometricMetrics?.trend;
  const topBrainwave = dashboard.sessionStats.topBrainwaveState || biometricMusic?.brainwave || 'Theta';
  const resonanceColor = biometricZone?.color || '#7048E8';
  const resonanceTitle = biometricZone?.label || topBrainwave;
  const primaryAdvice = biometricAdvice?.primaryAction || 'Begin with one saved journal entry, one breath, or one listening session to build your pattern.';
  const memoryOrbitSignal = latestBiometric?.heart_rate
    ?? biometricMetrics?.heartRate
    ?? (summary.streak > 0 ? summary.streak : dashboard.totals.sessions > 0 ? dashboard.totals.sessions : '-');
  const watchSummary = biometricAdvice
    ? `${sourceLabel(biometricMetrics?.source)} - ${biometricZone?.label || 'Gentle signal'} - ${biometricTrend?.label || 'Learning your rhythm'}`
    : 'Connect a watch from Home to shape breath and music guidance around your body signals.';

  const memoryNodes = [
    { label: 'Journal', color: '#7048E8' },
    { label: 'Dreams', color: '#6366F1' },
    { label: 'Sessions', color: '#0CA678' },
    { label: 'Music', color: '#D97706' },
  ];

  return (
    <div className="dashboard fade-in" style={{ gap: 18 }}>
      <section data-effect="profile-identity" style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 28,
        padding: '22px 18px',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,233,224,0.7))',
        border: '1px solid rgba(23,18,10,0.07)',
        boxShadow: '0 18px 48px rgba(23,18,10,0.08)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 84% 18%, ${resonanceColor}20, transparent 34%), radial-gradient(circle at 10% 100%, rgba(12,166,120,0.12), transparent 34%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <ResonanceOrb color={resonanceColor} accent="#FFFFFF" size={78}>{initials}</ResonanceOrb>
          <div style={{ minWidth: 0, flex: 1 }}>
            <SectionLabel color={resonanceColor}>Personal resonance</SectionLabel>
            <h1 style={{ margin: '5px 0 2px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, lineHeight: 1.04, fontWeight: 900, color: 'var(--ink1)', letterSpacing: 0 }}>
              {user?.name || 'Your practice'}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'Private account'}
            </p>
          </div>
          <span style={{ alignSelf: 'flex-start', borderRadius: 999, padding: '6px 9px', background: dashboard.loading ? 'rgba(217,119,6,0.1)' : 'rgba(12,166,120,0.1)', color: dashboard.loading ? '#D97706' : '#0CA678', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
            {dashboard.loading ? 'Updating' : 'Saved'}
          </span>
        </div>

        <p style={{ position: 'relative', margin: '16px 0 0', color: 'var(--ink3)', fontSize: 12, lineHeight: 1.65 }}>
          Your resonance adapts from writing, sound choices, sessions, and body signals without turning the page into a scoreboard.
        </p>
      </section>

      <section data-effect="profile-orbit" style={{ position: 'relative', minHeight: 250, borderRadius: 30, padding: 18, background: '#17120A', color: '#FFFFFF', overflow: 'hidden', boxShadow: '0 18px 54px rgba(23,18,10,0.22)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 38%, ${resonanceColor}38, transparent 33%), radial-gradient(circle at 10% 12%, rgba(245,159,0,0.16), transparent 28%), radial-gradient(circle at 88% 88%, rgba(12,166,120,0.18), transparent 30%)` }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <SectionLabel color="rgba(255,255,255,0.62)">Your rhythm</SectionLabel>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>Journals, dreams, sessions, music, and body signals gathered clearly.</p>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '18px auto 0', width: 210, height: 154 }}>
          <span style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.13)' }} />
          <span style={{ position: 'absolute', inset: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <ResonanceOrb color={resonanceColor} accent="#FFFFFF" size={74}>
              <span style={{ fontSize: 18 }}>{memoryOrbitSignal}</span>
            </ResonanceOrb>
          </div>
          {memoryNodes.map((node, index) => {
            const positions = [
              { left: 3, top: 12 },
              { right: 0, top: 9 },
              { left: 8, bottom: 4 },
              { right: 8, bottom: 2 },
            ];
            return (
              <div key={node.label} style={{ position: 'absolute', ...positions[index], display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: node.color, boxShadow: `0 0 18px ${node.color}70`, border: '1px solid rgba(255,255,255,0.32)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 900 }}>{node.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section data-effect="profile-guidance" style={{ borderRadius: 26, padding: 17, background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(12,166,120,0.07))', border: '1px solid rgba(12,166,120,0.14)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
          <div>
            <SectionLabel color="#0CA678">Today's guidance</SectionLabel>
            <p style={{ margin: '7px 0 0', color: 'var(--ink2)', fontSize: 13, lineHeight: 1.6 }}>{primaryAdvice}</p>
          </div>
          <ResonanceOrb color={resonanceColor} accent="#FFFFFF" size={54}>
            <span style={{ fontSize: 12 }}>{biometricMusic?.brainwave || topBrainwave}</span>
          </ResonanceOrb>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ borderRadius: 999, padding: '7px 11px', background: `${resonanceColor}12`, color: resonanceColor, fontSize: 11, fontWeight: 900 }}>{biometricBreathing?.label || 'Open with breath'}</span>
          <span style={{ borderRadius: 999, padding: '7px 11px', background: 'rgba(59,91,219,0.08)', color: '#3B5BDB', fontSize: 11, fontWeight: 900 }}>{biometricMusic?.brainwave || topBrainwave}</span>
          <span style={{ borderRadius: 999, padding: '7px 11px', background: 'rgba(245,159,0,0.1)', color: '#D97706', fontSize: 11, fontWeight: 900 }}>{formatMinutes(sessionMinutes)} practiced</span>
        </div>
      </section>

      <section data-effect="profile-rhythm" style={{ borderRadius: 26, padding: 17, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <SectionLabel>Practice rhythm</SectionLabel>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 900 }}>{formatDate(latestJournal?.entry_date)}</span>
        </div>
        {latestJournal ? (
          <RhythmRow color={latestJournal.entry_type === 'dream' ? '#6366F1' : latestJournal.entry_type === 'daily' ? '#D97706' : '#7048E8'} label={latestJournal.entry_type === 'checkin' ? 'Latest check-in' : latestJournal.entry_type === 'dream' ? 'Latest dream' : 'Latest reflection'} meta={formatDate(latestJournal.entry_date)} body={shortText(latestJournal.text)} />
        ) : (
          <RhythmRow color="#7048E8" label="Journal" meta="Start here" body="Save a journal entry and this becomes your personal practice timeline." />
        )}
        {latestDream ? (
          <RhythmRow color="#6366F1" label="Dream log" meta={formatDate(latestDream.entry_date)} body={shortText(latestDream.text)} />
        ) : (
          <RhythmRow color="#6366F1" label="Dream log" meta="Tonight" body="Dreams saved from Journal will gather here with symbols and lucidity." />
        )}
        {latestSession ? (
          <RhythmRow color="#0CA678" label={`${latestSession.brainwave_state || 'Meditation'} session`} meta={formatDate(latestSession.created || latestSession.created_at)} body={`${latestSession.heart_rate || '-'} bpm average - ${formatMinutes(Math.round((latestSession.duration_seconds || 0) / 60))}`} />
        ) : (
          <RhythmRow color="#0CA678" label="Sessions" meta="Ready" body="Completed sessions collect here with wave state, duration, and body data." />
        )}
        {latestPlay ? (
          <RhythmRow color={latestPlay.albumColor} label={latestPlay.title} meta={formatDate(latestPlay.created)} body={`${latestPlay.artist} - ${latestPlay.albumTitle}`} />
        ) : (
          <RhythmRow color="#D97706" label="Music" meta="Listening" body="Library plays will shape your personal sound profile." />
        )}
      </section>

      <section data-effect="profile-watch" style={{ borderRadius: 26, padding: 17, background: 'linear-gradient(135deg, #FFFFFF, rgba(59,91,219,0.07))', border: '1px solid rgba(59,91,219,0.14)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div>
            <SectionLabel color="#3B5BDB">Smart watch</SectionLabel>
            <p style={{ margin: '7px 0 0', fontSize: 12, color: 'var(--ink3)', lineHeight: 1.65 }}>
              {watchSummary}
            </p>
          </div>
        </div>
        {biometricAdvice && (
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <div style={{ borderRadius: 16, padding: 12, background: 'rgba(12,166,120,0.08)', border: '1px solid rgba(12,166,120,0.16)' }}>
              <div style={{ fontSize: 10, color: '#0CA678', fontWeight: 900, textTransform: 'uppercase' }}>Breath</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink1)', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biometricBreathing?.pattern || 'Finding your rhythm'}</div>
            </div>
            <div style={{ borderRadius: 16, padding: 12, background: 'rgba(112,72,232,0.08)', border: '1px solid rgba(112,72,232,0.16)' }}>
              <div style={{ fontSize: 10, color: '#7048E8', fontWeight: 900, textTransform: 'uppercase' }}>Music</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink1)', fontWeight: 900 }}>{biometricMusic?.brainwave || topBrainwave} - {biometricMusic?.tempo ?? '-'} BPM</div>
            </div>
          </div>
        )}
      </section>

      <section data-effect="profile-settings" style={{ borderRadius: 26, padding: 17, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <SectionLabel>Personal settings</SectionLabel>
        <div style={{ marginTop: 8 }}>
          <Toggle label="Binaural beats" desc="Stereo headphones recommended" value={prefs.binaural} onChange={v => setPref('binaural', v)} />
          <Toggle label="Daily reminders" desc="A small nudge to return" value={prefs.reminders} onChange={v => setPref('reminders', v)} />
          <Toggle label="Gentle vibration" desc="Soft cues for important moments" value={prefs.haptics} onChange={v => setPref('haptics', v)} />
          <Toggle label="Begin with watch" desc="Start when your watch connects" value={prefs.autoSession} onChange={v => setPref('autoSession', v)} />
        </div>
      </section>

      <section data-effect="profile-memory" style={{ borderRadius: 26, padding: 17, background: 'linear-gradient(135deg, #FFFFFF, rgba(112,72,232,0.07))', border: '1px solid rgba(112,72,232,0.16)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <SectionLabel color="#7048E8">Private memory</SectionLabel>
            <p style={{ margin: '7px 0 0', color: 'var(--ink3)', fontSize: 12, lineHeight: 1.65 }}>
              Your journal belongs to you. Download a copy whenever you need it, or clear it from this account when a clean page feels right.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 15 }}>
          <button
            type="button"
            onClick={handleExportJournal}
            disabled={Boolean(privacyBusy)}
            style={{
              minHeight: 48,
              borderRadius: 17,
              border: '1px solid rgba(112,72,232,0.22)',
              background: '#FFFFFF',
              color: '#7048E8',
              fontSize: 12,
              fontWeight: 900,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {privacyBusy === 'export' ? 'Preparing' : 'Download copy'}
          </button>
          <button
            type="button"
            onClick={handleClearJournal}
            disabled={Boolean(privacyBusy)}
            style={{
              minHeight: 48,
              borderRadius: 17,
              border: '1px solid rgba(217,72,15,0.22)',
              background: 'rgba(217,72,15,0.06)',
              color: '#D9480F',
              fontSize: 12,
              fontWeight: 900,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {privacyBusy === 'delete' ? 'Clearing' : 'Clear journal'}
          </button>
        </div>
      </section>

      <InstallAppControl />

      {dashboard.error && <p style={{ margin: 0, fontSize: 11, color: '#D97706', textAlign: 'center' }}>Some information will refresh soon.</p>}

      <button className="btn" onClick={logout} style={{
        width: '100%',
        height: 46,
        fontSize: 13,
        fontWeight: 900,
        color: '#D9480F',
        background: 'rgba(217,72,15,0.07)',
        border: '1px solid rgba(217,72,15,0.2)',
        borderRadius: 18,
      }}>
        Sign out
      </button>
    </div>
  );
}
