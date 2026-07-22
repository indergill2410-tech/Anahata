import React, { useState } from 'react';

const STEPS = [
  {
    id: 'heart',
    color: '#7048E8',
    eyebrow: 'Adaptive practice',
    title: 'Anahata learns your rhythm',
    body: 'Your sessions, journals, dreams, music choices, and body signals become a private practice map that gets more personal over time.',
    metric: 'Memory field',
    signal: 'Journal + sessions',
  },
  {
    id: 'watch',
    color: '#3B5BDB',
    eyebrow: 'Smart watch ready',
    title: 'Connect your watch',
    body: 'Pair a heart-rate watch so Anahata can shape breath guidance and music around how your body feels.',
    metric: 'Watch ready',
    signal: 'Heart rate + HRV',
  },
  {
    id: 'sound',
    color: '#0CA678',
    eyebrow: 'Sound medicine',
    title: 'Build your sound signature',
    body: 'Explore binaural layers, Indian classical instruments, nature beds, and saved mixes tuned to sleep, focus, healing, and meditation.',
    metric: '111 tracks',
    signal: 'Music + mixes',
  },
];

function tone(color: string, alpha = '18') {
  return `${color}${alpha}`;
}

function SetupOrb({ color, step }: { color: string; step: number }) {
  return (
    <div style={{ width: 148, height: 148, position: 'relative', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
      <span style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: `1px solid ${tone(color, '20')}` }} />
      <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1.5px solid ${tone(color, '34')}`, boxShadow: `0 0 34px ${tone(color, '28')}` }} />
      <span style={{ position: 'absolute', width: 26, height: 26, right: 8, top: 24, borderRadius: '50%', background: '#FFFFFF', border: `2px solid ${tone(color, '36')}`, boxShadow: `0 0 18px ${tone(color, '3A')}` }} />
      <div style={{
        width: 148,
        height: 148,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(circle at 34% 28%, #FFFFFF, ${color} 48%, ${tone(color, '92')} 78%)`,
        boxShadow: `inset 0 2px 14px rgba(255,255,255,0.42), 0 18px 46px ${tone(color, '34')}`,
        color: '#FFFFFF',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 38,
        fontWeight: 900,
      }}>
        {String(step + 1).padStart(2, '0')}
      </div>
    </div>
  );
}

function SignalTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ borderRadius: 18, padding: '12px 11px', background: '#FFFFFF', border: `1px solid ${tone(color, '20')}`, minWidth: 0, boxShadow: '0 6px 18px rgba(23,18,10,0.045)' }}>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 900, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4, color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  function finish() {
    localStorage.setItem('anahata_onboarded', '1');
    onComplete();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 50% 2%, ${tone(current.color, '99')}, transparent 42%),
        radial-gradient(ellipse at 86% 74%, rgba(59,91,219,0.22), transparent 40%),
        radial-gradient(ellipse at 10% 88%, rgba(12,166,120,0.16), transparent 42%),
        linear-gradient(180deg, #090B1E 0%, #141A33 52%, #1E1438 100%)`,
      transition: 'background 0.4s var(--ease)',
      padding: 24,
    }}>
      <section style={{ width: '100%', maxWidth: 390, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <SetupOrb color={current.color} step={step} />

        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', opacity: 0.9, textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.02em' }}>
            {current.eyebrow}
          </div>
          <h1 style={{ margin: '7px 0 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: 29, lineHeight: 1.05, fontWeight: 900, color: 'var(--on-dark-1)', letterSpacing: 0 }}>
            {current.title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--on-dark-2)', lineHeight: 1.7, margin: '11px auto 0', maxWidth: 330 }}>
            {current.body}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SignalTile label="Space" value={current.metric} color={current.color} />
          <SignalTile label="Signal" value={current.signal} color={current.color} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }} aria-label="Onboarding progress">
          {STEPS.map((item, i) => (
            <span key={item.id} style={{
              width: i === step ? 30 : 8,
              height: 8,
              borderRadius: 999,
              background: i === step ? current.color : 'rgba(255,255,255,0.22)',
              transition: 'all 0.28s var(--ease)',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-primary" style={{ width: '100%', height: 48, fontSize: 14, background: `linear-gradient(135deg, ${current.color}, #3B5BDB)`, boxShadow: `0 10px 24px ${tone(current.color, '32')}` }}
            onClick={isLast ? finish : () => setStep(s => s + 1)}>
            {isLast ? 'Enter Anahata' : 'Continue'}
          </button>

          {!isLast && (
            <button onClick={finish} style={{
              fontSize: 12,
              color: 'var(--on-dark-3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 800,
              padding: 8,
            }}>Skip setup</button>
          )}
        </div>
      </section>
    </div>
  );
}
