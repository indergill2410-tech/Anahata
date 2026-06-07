import React, { useEffect, useMemo, useState } from 'react';

export interface BreathingPattern {
  label?: string;
  pattern?: string;
  inhale: number;
  hold?: number;
  exhale: number;
  rest?: number;
  instruction?: string;
}

interface Phase {
  label: 'Inhale' | 'Hold' | 'Exhale' | 'Rest';
  duration: number;
  scale: number;
}

const DEFAULT_PATTERN: BreathingPattern = {
  label: 'Opening breath',
  pattern: '4 in / 2 hold / 6 out / 2 rest',
  inhale: 4,
  hold: 2,
  exhale: 6,
  rest: 2,
};

const PHASE_COLOR: Record<Phase['label'], string> = { Inhale: '#7B8B5E', Hold: '#9B6B9A', Exhale: '#4A7FA5', Rest: '#C4613A' };

interface BreathingGuideProps {
  onComplete: () => void;
  cycles?: number;
  pattern?: BreathingPattern;
  title?: string;
}

function secondsToMs(value: number | undefined, fallback = 0) {
  const seconds = Number.isFinite(value) ? Number(value) : fallback;
  return Math.max(0, seconds) * 1000;
}

function buildPhases(pattern?: BreathingPattern): Phase[] {
  const p = pattern || DEFAULT_PATTERN;
  const phases: Phase[] = [
    { label: 'Inhale', duration: secondsToMs(p.inhale, DEFAULT_PATTERN.inhale), scale: 1.3 },
  ];

  if (secondsToMs(p.hold) > 0) phases.push({ label: 'Hold', duration: secondsToMs(p.hold), scale: 1.3 });
  phases.push({ label: 'Exhale', duration: secondsToMs(p.exhale, DEFAULT_PATTERN.exhale), scale: 0.85 });
  if (secondsToMs(p.rest) > 0) phases.push({ label: 'Rest', duration: secondsToMs(p.rest), scale: 0.85 });

  return phases.filter(phase => phase.duration > 0);
}

export default function BreathingGuide({ onComplete, cycles = 2, pattern, title }: BreathingGuideProps) {
  const [phase,   setPhase]   = useState(0);
  const [cycle,   setCycle]   = useState(0);
  const [visible, setVisible] = useState(true);
  const activePattern = pattern || DEFAULT_PATTERN;
  const phases = useMemo(
    () => buildPhases(pattern),
    [pattern?.inhale, pattern?.hold, pattern?.exhale, pattern?.rest]
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function next(p: number, c: number) {
      timeout = setTimeout(() => {
        const nextP = (p + 1) % phases.length;
        const nextC = nextP === 0 ? c + 1 : c;
        if (nextC >= cycles) { setVisible(false); setTimeout(onComplete, 600); return; }
        setPhase(nextP); setCycle(nextC);
        next(nextP, nextC);
      }, phases[p].duration);
    }
    next(phase, cycle);
    return () => clearTimeout(timeout);
  }, [phases, cycles]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = phases[phase] || phases[0];
  const totalMs = phases.reduce((a, p) => a + p.duration, 0);
  const progressMs = phases.slice(0, phase).reduce((a, p) => a + p.duration, 0) + cycle * totalMs;
  const pct     = Math.min((progressMs / (cycles * totalMs)) * 100, 100);
  const color   = PHASE_COLOR[current.label];
  const heading = title || activePattern.label;

  return (
    <div className="breathing-overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: visible ? 'auto' : 'none' }}>
      {heading && (
        <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 22 }}>
          {heading}
        </p>
      )}

      <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', border:`1.5px solid ${color}30`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
        <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', border:`2px solid ${color}55`, background:`radial-gradient(circle, ${color}0A 0%, transparent 70%)`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
        <div style={{ width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${color}30 0%, ${color}10 70%)`, border:`2px solid ${color}60`, transform:`scale(${current.scale})`, transition:`transform ${current.duration}ms cubic-bezier(0.4,0,0.2,1)` }} />
      </div>

      <p style={{ fontSize:26, fontWeight:300, color:'var(--t1)', letterSpacing:'0.06em', fontFamily:'Lora, serif', marginTop:20, marginBottom:6 }}>
        {current.label}
      </p>
      <p style={{ fontSize:13, color:'var(--t3)' }}>Cycle {cycle + 1} of {cycles}</p>
      {activePattern.pattern && <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{activePattern.pattern}</p>}

      <div style={{ width:160, height:3, background:'var(--bg-2)', borderRadius:2, marginTop:28 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.5s linear' }} />
      </div>

      {activePattern.instruction && (
        <p style={{ maxWidth: 260, textAlign: 'center', fontSize: 12, lineHeight: 1.55, color: 'var(--t3)', marginTop: 18 }}>
          {activePattern.instruction}
        </p>
      )}

      <button onClick={() => { setVisible(false); setTimeout(onComplete, 300); }}
        style={{ marginTop:24, background:'none', border:'none', color:'var(--t3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
        Skip
      </button>
    </div>
  );
}
