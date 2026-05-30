import React, { useEffect, useState } from 'react';
import OrbVisualizer from '../components/OrbVisualizer';
import BreathingGuide from '../components/BreathingGuide';
import { useSoundEngine, BW_FOR_HZ } from '../context/SoundEngineContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import { useToast } from '../context/ToastContext';

const BW_COLOUR = {
  Delta: '#818cf8', Theta: '#a78bfa', Alpha: '#34d399', Beta: '#60a5fa', Gamma: '#fbbf24',
};

function fmtElapsed(s) {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${String(s % 60).padStart(2,'0')}s`;
}

export default function JourneyPage() {
  const engine = useSoundEngine();
  const ws     = useWebSocket();
  const ble    = useBluetooth();
  const sim    = useSimulator();
  const { info } = useToast();

  const [demoMode,   setDemoMode]   = useState(false);
  const [showBreath, setShowBreath] = useState(false);
  const [started,    setStarted]    = useState(false);
  const [wsMsg,      setWsMsg]      = useState(null);

  const heartRate = ble.status === 'connected' ? ble.heartRate
                  : demoMode                   ? sim.heartRate
                  : wsMsg?.heartRate || null;

  // Send HR to WS
  useEffect(() => {
    if (heartRate && ws.status === 'connected') {
      ws.send({ type: 'biometric', heartRate });
    }
  }, [heartRate, ws.status]);

  useEffect(() => {
    if (ws.lastMessage?.type === 'meditation') setWsMsg(ws.lastMessage);
  }, [ws.lastMessage]);

  // Phase 4: live adaptation
  useEffect(() => {
    if (heartRate && engine.isPlaying) engine.adaptFromHeartRate(heartRate);
  }, [heartRate]);

  function handleOrbTap() {
    if (!started) {
      setShowBreath(true);
    } else {
      engine.togglePlay();
    }
  }

  function onBreathingComplete() {
    setShowBreath(false);
    setStarted(true);
    engine.start();
  }

  function toggleDemo() {
    if (demoMode) { sim.stop(); setDemoMode(false); }
    else { sim.start(); setDemoMode(true); info('Demo mode — simulating biometrics 🎭'); }
  }

  const bwColour = BW_COLOUR[engine.brainwave] || '#8b6fff';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 80 }}>
      {showBreath && <BreathingGuide onComplete={onBreathingComplete} cycles={2} />}

      {/* Brainwave label */}
      <div style={{ marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: bwColour, padding: '4px 10px', borderRadius: 20,
          background: `${bwColour}18`, border: `1px solid ${bwColour}30`,
        }}>
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
        {engine.isPlaying && (
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{fmtElapsed(engine.elapsed)}</span>
        )}
      </div>

      {/* Orb */}
      <div
        onClick={handleOrbTap}
        style={{ position: 'relative', marginTop: 8, cursor: 'pointer', userSelect: 'none' }}
      >
        <OrbVisualizer
          brainwave={engine.brainwave}
          isPlaying={engine.isPlaying}
          heartRate={heartRate}
          binauralHz={engine.settings.binaural.hz}
          size={260}
        />

        {/* Play/pause overlay hint */}
        {!engine.isPlaying && started && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(109,74,255,0.25)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(139,111,255,0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Start label */}
      {!started && (
        <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 16, letterSpacing: '0.04em' }}>
          Tap to begin your journey
        </p>
      )}

      {/* Intention label */}
      {engine.intention && (
        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>
          {['sleep','focus','heal','energize','meditate'].find(k => k === engine.intention)
            ? `${engine.intention.charAt(0).toUpperCase() + engine.intention.slice(1)} session`
            : 'Custom mix'}
        </p>
      )}

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 88, left: 0, right: 0, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* BLE / Demo */}
        <button
          onClick={ble.status === 'connected' ? ble.disconnect : ble.status === 'disconnected' ? ble.connect : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 20, border: `1px solid ${ble.status === 'connected' ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
            background: 'var(--bg-2)', color: ble.status === 'connected' ? 'var(--green)' : 'var(--t3)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: ble.status === 'connected' ? 'var(--green)' : ble.status === 'connecting' ? 'var(--amber)' : 'var(--t3)',
          }} />
          {ble.status === 'connected' ? `${ble.heartRate || '–'} BPM` : ble.status === 'connecting' ? 'Connecting…' : 'Connect HR'}
        </button>

        {/* Demo mode */}
        <button
          onClick={toggleDemo}
          style={{
            padding: '6px 12px', borderRadius: 20,
            border: `1px solid ${demoMode ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
            background: demoMode ? 'rgba(245,158,11,0.08)' : 'var(--bg-2)',
            color: demoMode ? 'var(--amber)' : 'var(--t3)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}
        >
          {demoMode ? '🎭 Demo On' : 'Demo'}
        </button>

        {/* WS status */}
        <div style={{ fontSize: 10, color: ws.status === 'connected' ? 'var(--green)' : 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ws.status === 'connected' ? 'var(--green)' : 'var(--t3)' }} />
          {ws.status}
        </div>
      </div>
    </div>
  );
}
