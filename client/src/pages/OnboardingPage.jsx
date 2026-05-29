import React, { useState } from 'react';

const STEPS = [
  {
    icon: '🪷',
    title: 'Welcome to Anahata',
    body: 'Your heart rate guides the music. The deeper you breathe, the more the music adapts to bring you into stillness.'
  },
  {
    icon: '⌚',
    title: 'Connect Your Smartwatch',
    body: 'Pair any Bluetooth heart rate monitor — Apple Watch, Galaxy Watch, Polar, Garmin, or any Wear OS device.'
  },
  {
    icon: '🎵',
    title: '111 Meditation Tracks',
    body: 'Explore our library of binaural beats fused with Indian classical instruments — sitar, bansuri, tanpura and more.'
  }
];

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0);

  function finish() {
    localStorage.setItem('anahata_onboarded', '1');
    onComplete();
  }

  const { icon, title, body } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: 32
    }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 28, animation: 'fadeIn 0.4s ease' }} key={step}>
          {icon}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--t1)', marginBottom: 14, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 44 }}>
          {body}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 7, height: 7,
              borderRadius: 4,
              background: i === step ? 'var(--accent)' : 'var(--bg-3)',
              transition: 'all 0.35s var(--ease)'
            }} />
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', height: 46, fontSize: 14 }}
          onClick={isLast ? finish : () => setStep(s => s + 1)}>
          {isLast ? 'Start Meditating' : 'Next'}
        </button>

        {!isLast && (
          <button onClick={finish} style={{
            marginTop: 14, fontSize: 12, color: 'var(--t3)', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit'
          }}>Skip</button>
        )}
      </div>
    </div>
  );
}
