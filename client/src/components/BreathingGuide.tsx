import React, { useEffect, useState } from 'react';

const PHASES = [
  { label: 'Inhale',  duration: 4000, scale: 1.3  },
  { label: 'Hold',    duration: 2000, scale: 1.3  },
  { label: 'Exhale',  duration: 6000, scale: 0.85 },
  { label: 'Rest',    duration: 2000, scale: 0.85 },
];

const PHASE_COLOR = { Inhale: '#7B8B5E', Hold: '#9B6B9A', Exhale: '#4A7FA5', Rest: '#C4613A' };

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
        if (nextC >= cycles) { setVisible(false); setTimeout(onComplete, 600); return; }
        setPhase(nextP); setCycle(nextC);
        next(nextP, nextC);
      }, PHASES[p].duration);
    }
    next(phase, cycle);
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line

  const current = PHASES[phase];
  const totalMs = PHASES.reduce((a, p) => a + p.duration, 0);
  const progressMs = PHASES.slice(0, phase).reduce((a, p) => a + p.duration, 0) + cycle * totalMs;
  const pct     = Math.min((progressMs / (cycles * totalMs)) * 100, 100);
  const color   = PHASE_COLOR[current.label];

  return (
    <div className="breathing-overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: visible ? 'auto' : 'none' }}>
      <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', border:`1.5px solid ${color}30`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
        <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', border:`2px solid ${color}55`, background:`radial-gradient(circle, ${color}0A 0%, transparent 70%)`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
        <div style={{ width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${color}30 0%, ${color}10 70%)`, border:`2px solid ${color}60`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
      </div>

      <p style={{ fontSize:26, fontWeight:300, color:'var(--t1)', letterSpacing:'0.06em', fontFamily:'Lora, serif', marginTop:20, marginBottom:6 }}>
        {current.label}
      </p>
      <p style={{ fontSize:13, color:'var(--t3)' }}>Cycle {cycle + 1} of {cycles}</p>

      <div style={{ width:160, height:3, background:'var(--bg-2)', borderRadius:2, marginTop:28 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.5s linear' }} />
      </div>

      <button onClick={() => { setVisible(false); setTimeout(onComplete, 300); }}
        style={{ marginTop:24, background:'none', border:'none', color:'var(--t3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
        Skip
      </button>
    </div>
  );
}
