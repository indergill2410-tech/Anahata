import React, { useState } from 'react';

const STEPS = [
  {
    icon: '♡',
    title: 'Music that listens to your body',
    body: 'Anahata reads your live heart rate from your smartwatch and generates personalised Mozart-inspired music in real time — tuned to guide your nervous system toward calm.'
  },
  {
    icon: '◎',
    title: 'Binaural beats embedded in the sound',
    body: 'Beneath every note, binaural frequencies gently shift your brain into Theta or Alpha states. No effort required — just listen through headphones and breathe.'
  },
  {
    icon: '⌚',
    title: 'Connect your smartwatch',
    body: 'Use the Bluetooth button to pair any heart rate monitor. No smartwatch? No problem — use Demo Mode and experience the full app with a simulated session.'
  }
];

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (isLast) {
      localStorage.setItem('anahata_onboarded', '1');
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="onboard-page fade-in">
      <div className="onboard-step-dots">
        {STEPS.map((_, i) => (
          <div key={i} className={`step-dot${i === step ? ' active' : ''}`} />
        ))}
      </div>

      <div className="onboard-icon">{current.icon}</div>
      <h1 className="onboard-title">{current.title}</h1>
      <p className="onboard-body">{current.body}</p>

      <div className="onboard-actions">
        <button className="btn btn-primary btn-full" onClick={next}>
          {isLast ? 'Get started' : 'Continue'}
        </button>
        {!isLast && (
          <button className="btn btn-ghost btn-full" onClick={() => { localStorage.setItem('anahata_onboarded', '1'); onComplete(); }}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
