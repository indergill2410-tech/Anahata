import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkeletonTrackCard } from '../components/SkeletonCard';

interface Session { id: string; brainwave_state?: string; created_at: string; heart_rate?: number; duration_seconds?: number; }

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function tone(color: string, alpha = '18') {
  return `${color}${alpha}`;
}

const BW_COLOUR: Record<string, string> = { Delta: '#3B5BDB', Theta: '#7048E8', Alpha: '#0CA678', Beta: '#F59F00', Gamma: '#E64980' };

function SectionLabel({ children, color = 'var(--ink3)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase', color, fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}

function SessionOrb({ color, size = 58, children }: { color: string; size?: number; children?: React.ReactNode }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${tone(color, '24')}` }} />
      <span style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: `1.5px solid ${tone(color, '36')}`, boxShadow: `0 0 24px ${tone(color, '26')}` }} />
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(circle at 35% 28%, #FFFFFF, ${color} 52%, ${tone(color, '92')} 78%)`,
        color: '#FFFFFF',
        boxShadow: `inset 0 2px 12px rgba(255,255,255,0.4), 0 14px 34px ${tone(color, '30')}`,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 900,
      }}>
        {children}
      </div>
    </div>
  );
}

function SignalCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ borderRadius: 18, padding: '12px 10px', background: '#FFFFFF', border: `1px solid ${tone(color, '20')}`, boxShadow: '0 6px 18px rgba(23,18,10,0.045)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 14px ${tone(color, '62')}` }} />
        <span style={{ color: 'var(--ink3)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ color: 'var(--ink1)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, lineHeight: 1, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { authFetch } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [authFetch]);

  const stats = useMemo(() => {
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const heartRates = sessions.map(s => s.heart_rate).filter((v): v is number => typeof v === 'number');
    const waveCounts = sessions.reduce<Record<string, number>>((acc, s) => {
      const wave = s.brainwave_state || 'Meditation';
      acc[wave] = (acc[wave] || 0) + 1;
      return acc;
    }, {});
    const topWave = Object.entries(waveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ready';
    return {
      totalMinutes: Math.round(totalSeconds / 60),
      avgHeartRate: heartRates.length ? Math.round(heartRates.reduce((sum, v) => sum + v, 0) / heartRates.length) : null,
      topWave,
    };
  }, [sessions]);

  const heroColor = BW_COLOUR[stats.topWave] || '#7048E8';

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>
      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 30, padding: '20px 18px', background: '#17120A', color: '#FFFFFF', boxShadow: '0 18px 54px rgba(23,18,10,0.22)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 82% 6%, ${tone(heroColor, '42')}, transparent 34%), radial-gradient(circle at 10% 90%, rgba(12,166,120,0.18), transparent 32%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <SessionOrb color={heroColor} size={76}>
            <span style={{ fontSize: 20 }}>{sessions.length || '-'}</span>
          </SessionOrb>
          <div style={{ minWidth: 0, flex: 1 }}>
            <SectionLabel color="rgba(255,255,255,0.62)">Practice archive</SectionLabel>
            <h1 style={{ margin: '5px 0 3px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, lineHeight: 1.02, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0 }}>Sessions</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.5 }}>
              Breath, sound, wave state, and body signals from completed practice.
            </p>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
        <SignalCard label="Time" value={loading ? '-' : fmtDur(stats.totalMinutes * 60)} color="#0CA678" />
        <SignalCard label="BPM" value={loading ? '-' : stats.avgHeartRate || '-'} color="#E64980" />
        <SignalCard label="Wave" value={loading ? '-' : stats.topWave} color={heroColor} />
      </section>

      {loading && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonTrackCard key={i} />)}
        </section>
      )}

      {error && (
        <section style={{ borderRadius: 24, padding: 20, textAlign: 'center', color: '#D9480F', fontSize: 13, background: 'rgba(217,72,15,0.08)', border: '1px solid rgba(217,72,15,0.2)' }}>
          We could not gather your sessions right now.
        </section>
      )}

      {!loading && !error && sessions.length === 0 && (
        <section style={{ borderRadius: 30, padding: 26, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <SessionOrb color="#7048E8" size={86}>
              <span style={{ fontSize: 22 }}>0</span>
            </SessionOrb>
          </div>
          <SectionLabel color="#7048E8">Waiting for signal</SectionLabel>
          <p style={{ margin: '8px auto 0', color: 'var(--ink3)', fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>
            Complete a meditation and this becomes a personal practice archive with duration, wave state, and body signals.
          </p>
        </section>
      )}

      {!loading && sessions.length > 0 && (
        <section style={{ borderRadius: 30, padding: 17, background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <SectionLabel color={heroColor}>Session stream</SectionLabel>
            <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 900 }}>{sessions.length} saved</span>
          </div>

          {sessions.map(s => {
            const wave = s.brainwave_state || 'Meditation';
            const color = BW_COLOUR[wave] || '#7048E8';
            return (
              <button key={s.id} style={{
                width: '100%',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '48px minmax(0, 1fr) auto',
                gap: 12,
                alignItems: 'center',
                padding: '13px 14px',
                borderRadius: 22,
                border: `1px solid ${tone(color, '20')}`,
                background: `linear-gradient(180deg, #FFFFFF, ${tone(color, '08')})`,
                boxShadow: '0 4px 14px rgba(23,18,10,0.04)',
              }}>
                <SessionOrb color={color} size={38}>
                  <span style={{ fontSize: 10 }}>{s.heart_rate || '-'}</span>
                </SessionOrb>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 900, color: 'var(--ink1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {wave} session
                  </span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--ink3)' }}>{fmt(s.created_at)}</span>
                </span>
                <span style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'block', color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 900 }}>{s.duration_seconds ? fmtDur(s.duration_seconds) : '-'}</span>
                  <span style={{ display: 'block', color: 'var(--ink3)', fontSize: 10, fontWeight: 900 }}>{s.heart_rate ? `${s.heart_rate} bpm` : 'no bpm'}</span>
                </span>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
