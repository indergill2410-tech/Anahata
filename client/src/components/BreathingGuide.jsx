import React, { useEffect, useState } from 'react';

const PHASES = [
  { label: 'Inhale',  duration: 4000, scale: 1.3  },
  { label: 'Hold',    duration: 2000, scale: 1.3  },
  { label: 'Exhale',  duration: 6000, scale: 0.85 },
  { label: 'Rest',    duration: 2000, scale: 0.85 },
];

export default function BreathingGuide({ onComplete, cycles = 2 }) {
  const [phase,   setPhase]   = useState(0);
  const [cycle,   setCycle]   = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeout;
    function next(p, c) {
      timeout = setTimeout(() => {
        const nextP = (p + 1) % PHASES.length;
        const nextC = nextP === 0 ? c + 1 : c;
        if (nextC >= cycles) {
          setVisible(false);
          setTimeout(onComplete, 600);
          return;
        }
        setPhase(nextP);
        setCycle(nextC);
        next(nextP, nextC);
      }, PHASES[p].duration);
    }
    next(phase, cycle);
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = PHASES[phase];
  const totalMs = PHASES.reduce((a, p) => a + p.duration, 0);
  const progressMs = PHASES.slice(0, phase).reduce((a, p) => a + p.duration, 0) + cycle * totalMs;
  const totalCycleMs = cycles * totalMs;
  const pct = Math.min((progressMs / totalCycleMs) * 100, 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(8,8,16,0.92)',
      backdropFilter: 'blur(16px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {/* Breathing circle */}
      <div style={{
        width: 180, height: 180,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 130, height: 130, borderRadius: '50%',
          border: '1.5px solid rgba(139,111,255,0.4)',
          transform: `scale(${current.scale})`,
          transition: `transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(109,74,255,0.12) 0%, transparent 70%)',
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            border: '1px solid rgba(139,111,255,0.6)',
            background: 'radial-gradient(circle, rgba(109,74,255,0.25) 0%, transparent 70%)',
          }} />
        </div>
      </div>

      <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--t1)', letterSpacing: '0.08em', marginTop: 24, marginBottom: 8 }}>
        {current.label}
      </p>
      <p style={{ fontSize: 13, color: 'var(--t3)' }}>
        Cycle {cycle + 1} of {cycles}
      </p>

      {/* Progress bar */}
      <div style={{ width: 160, height: 2, background: 'var(--bg-3)', borderRadius: 2, marginTop: 32 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s linear' }} />
      </div>

      <button
        onClick={() => { setVisible(false); setTimeout(onComplete, 300); }}
        style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--t3)', fontSize: 12, cursor: 'pointer' }}
      >
        Skip
      </button>
    </div>
  );
}
