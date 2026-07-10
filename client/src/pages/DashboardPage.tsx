import React, { useEffect, useRef, useState } from 'react';

// ─── Time helpers ─────────────────────────────────────────────────────────────
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text: 'Still awake?',    sub: 'Delta sleep journey recommended', bw: 'Delta', color: '#3B5BDB' };
  if (h < 12) return { text: 'Good morning',    sub: 'Beta clarity for a focused start', bw: 'Beta',  color: '#F59F00' };
  if (h < 14) return { text: 'Midday reset',    sub: 'Alpha flow to recenter', bw: 'Alpha', color: '#0CA678' };
  if (h < 17) return { text: 'Good afternoon',  sub: 'Theta creativity wave', bw: 'Theta', color: '#7048E8' };
  if (h < 20) return { text: 'Golden hour',     sub: 'Alpha unwind ritual', bw: 'Alpha', color: '#E64980' };
  return       { text: 'Good evening',          sub: 'Delta deep sleep preparation', bw: 'Delta', color: '#3B5BDB' };
}

// ─── Breathing Orb canvas ────────────────────────────────────────────────────
function HomeOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const S = 220; cvs.width = S; cvs.height = S;
    const cx = S / 2, cy = S / 2;
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, S, S);
      t += 0.008;

      // Breathing scale: 4s in, 4s hold, 6s out → 14s cycle
      const cycle = (t % (Math.PI * 2 * 14 / (Math.PI * 2))) / 14;
      let breathScale: number;
      if (cycle < 4/14)       breathScale = cycle / (4/14);
      else if (cycle < 8/14)  breathScale = 1;
      else                    breathScale = 1 - (cycle - 8/14) / (6/14);
      breathScale = 0.82 + 0.18 * breathScale;

      const r = 70 * breathScale;

      // Outer glow rings
      for (let i = 3; i >= 1; i--) {
        const rr = r + i * 18;
        const alpha = (0.06 - i * 0.015) * breathScale;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(112,72,232,${alpha})`;
        ctx.fill();
      }

      // Core gradient
      const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
      grad.addColorStop(0,   `rgba(180,140,255,0.95)`);
      grad.addColorStop(0.5, `rgba(112,72,232,0.85)`);
      grad.addColorStop(1,   `rgba(59,91,219,0.7)`);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(112,72,232,0.5)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner shimmer
      const sg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r * 0.6);
      sg.addColorStop(0, 'rgba(255,255,255,0.28)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      // Orbiting particles
      const particles = [
        { angle: t * 0.9,   dist: r + 22, size: 3,   alpha: 0.7 },
        { angle: t * 0.9 + Math.PI * 2/3, dist: r + 22, size: 2.5, alpha: 0.6 },
        { angle: t * 0.9 + Math.PI * 4/3, dist: r + 22, size: 3.5, alpha: 0.8 },
        { angle: -t * 0.6 + 0.5, dist: r + 38, size: 2, alpha: 0.4 },
        { angle: -t * 0.6 + Math.PI, dist: r + 38, size: 1.5, alpha: 0.35 },
      ];
      for (const p of particles) {
        const px = cx + Math.cos(p.angle) * p.dist;
        const py = cy + Math.sin(p.angle) * p.dist;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,140,255,${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 220, height: 220, display: 'block' }} />;
}

// ─── Suggested session card ───────────────────────────────────────────────────
const SUGGESTIONS: Record<string, { title: string; desc: string; duration: string; color: string }> = {
  Delta: { title: 'Deep Delta Sleep',  desc: 'Ocean waves + 2Hz binaural drift',   duration: '28 min', color: '#3B5BDB' },
  Theta: { title: 'Theta Dreamweave', desc: 'Crystal bowls + Theta entrainment',   duration: '22 min', color: '#7048E8' },
  Alpha: { title: 'Alpha Flow State', desc: 'Forest ambience + Alpha waves',        duration: '18 min', color: '#0CA678' },
  Beta:  { title: 'Morning Clarity',  desc: 'Tibetan bells + Beta activation',      duration: '15 min', color: '#F59F00' },
  Gamma: { title: 'Gamma Peak Focus', desc: 'High Gamma + rhythmic pulses',          duration: '20 min', color: '#E64980' },
};

// ─── Recent activity dots ─────────────────────────────────────────────────────
function ActivityDots({ store }: { store: Record<string, { mood: number }> }) {
  const days: Array<{ key: string; mood: number | null }> = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    days.push({ key, mood: store[key]?.mood ?? null });
  }
  const MOOD_COLORS = ['', '#E64980', '#F59F00', '#0CA678', '#3B5BDB', '#7048E8'];
  const DAY_LABELS  = ['S','M','T','W','T','F','S'];
  const startIdx    = today.getDay(); // 0=Sun
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'space-between' }}>
      {days.map((d, i) => {
        const dayIdx = (startIdx - 6 + i + 7) % 7;
        return (
          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: d.mood ? MOOD_COLORS[d.mood] : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${d.mood ? MOOD_COLORS[d.mood] + '60' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: d.mood ? `0 0 10px ${MOOD_COLORS[d.mood]}40` : 'none',
              transition: 'all 0.3s',
            }} />
            <span style={{ fontSize: 9, color: 'var(--ink4)', fontWeight: 700 }}>{DAY_LABELS[dayIdx]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { text, sub, bw, color } = getTimeGreeting();
  const suggestion = SUGGESTIONS[bw] || SUGGESTIONS.Alpha;
  const [store] = useState<Record<string, { mood: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('anahata_journal') || '{}'); } catch { return {}; }
  });

  // Streak calc
  let streak = 0;
  const cur = new Date(); cur.setHours(0, 0, 0, 0);
  while (true) {
    const k = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    if (store[k]) { streak++; cur.setDate(cur.getDate() - 1); } else break;
  }

  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  useEffect(() => {
    const phases: Array<['inhale' | 'hold' | 'exhale', number]> = [['inhale', 4000], ['hold', 4000], ['exhale', 6000]];
    let idx = 0;
    const tick = () => {
      idx = (idx + 1) % 3;
      setBreathPhase(phases[idx][0]);
      timer = setTimeout(tick, phases[idx][1]);
    };
    let timer = setTimeout(tick, phases[0][1]);
    return () => clearTimeout(timer);
  }, []);

  const breathLabel = breathPhase === 'inhale' ? 'Breathe in' : breathPhase === 'hold' ? 'Hold' : 'Breathe out';

  return (
    <div className="dashboard fade-in" style={{ gap: 16 }}>

      {/* Hero section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 8 }}>
        <HomeOrb />
        <div style={{ textAlign: 'center', marginTop: -8 }}>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--ink1)', letterSpacing: '-0.02em' }}>{text}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink3)' }}>{sub}</p>
        </div>
        {/* Breathwork guide */}
        <div style={{ marginTop: 8, padding: '8px 20px', borderRadius: 24, background: 'rgba(112,72,232,0.08)', border: '1px solid rgba(112,72,232,0.15)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{breathLabel}</span>
        </div>
      </div>

      {/* Suggested session */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${suggestion.color}20, ${suggestion.color}08)`, borderBottom: `1px solid ${suggestion.color}20`, padding: '10px 16px 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: suggestion.color, fontFamily: "'JetBrains Mono', monospace" }}>
            {bw} · Suggested for now
          </span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <h3 style={{ margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--ink1)' }}>{suggestion.title}</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--ink3)' }}>{suggestion.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', background: suggestion.color, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{suggestion.duration}</span>
          </div>
        </div>
      </div>

      {/* Weekly mood heatmap */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif" }}>This week</span>
          <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{streak > 0 ? `${streak}-day streak 🔥` : 'Start your streak today'}</span>
        </div>
        <ActivityDots store={store} />
      </div>

      {/* Breathwork card */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>4-4-6 Breath</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['inhale', 'hold', 'exhale'] as const).map((phase) => (
            <div key={phase} style={{
              flex: phase === 'exhale' ? 1.5 : 1,
              padding: '10px 6px',
              borderRadius: 12,
              background: breathPhase === phase ? 'rgba(112,72,232,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${breathPhase === phase ? 'rgba(112,72,232,0.3)' : 'rgba(255,255,255,0.06)'}`,
              textAlign: 'center',
              transition: 'all 0.6s ease',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: breathPhase === phase ? 'var(--violet)' : 'var(--ink3)', textTransform: 'capitalize' }}>{phase}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: breathPhase === phase ? 'var(--violet)' : 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>
                {phase === 'inhale' ? 4 : phase === 'hold' ? 4 : 6}s
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
