import React, { useEffect, useState, useRef } from 'react';
import OrbVisualizer from '../components/OrbVisualizer';
import BreathingGuide from '../components/BreathingGuide';
import NowPlayingBar from '../components/NowPlayingBar';
import { useSoundEngine, INTENTIONS } from '../context/SoundEngineContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import { useToast } from '../context/ToastContext';

const BW_COLOR: Record<string, string> = {
  Delta:'#1E90FF', Theta:'#A855F7', Alpha:'#00D68F', Beta:'#1E90FF', Gamma:'#FFB800',
};
const BW_GLOW: Record<string, string> = {
  Delta:'rgba(30,144,255,0.35)', Theta:'rgba(168,85,247,0.35)',
  Alpha:'rgba(0,214,143,0.35)', Beta:'rgba(30,144,255,0.35)', Gamma:'rgba(255,184,0,0.35)',
};

function fmtElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}

interface Ripple { id: number; x: number; y: number; color: string; }

export default function JourneyPage() {
  const engine = useSoundEngine();
  const ws     = useWebSocket();
  const ble    = useBluetooth();
  const sim    = useSimulator();
  const { info } = useToast();

  const [demoMode,   setDemoMode]   = useState(false);
  const [showBreath, setShowBreath] = useState(false);
  const [started,    setStarted]    = useState(false);
  const [wsMsg,      setWsMsg]      = useState<{ heartRate?: number } | null>(null);
  const [ripples,    setRipples]    = useState<Ripple[]>([]);
  const orbRef = useRef<HTMLDivElement>(null);

  const heartRate = ble.status === 'connected' ? ble.heartRate
                  : demoMode                   ? sim.heartRate
                  : wsMsg?.heartRate ?? null;

  useEffect(() => {
    if (heartRate && ws.status === 'connected') ws.send({ type:'biometric', heartRate });
  }, [heartRate, ws.status]);

  useEffect(() => {
    if ((ws.lastMessage as { type?: string })?.type === 'meditation') setWsMsg(ws.lastMessage as { heartRate?: number });
  }, [ws.lastMessage]);

  useEffect(() => {
    if (heartRate && engine.isPlaying) engine.adaptFromHeartRate(heartRate as number);
  }, [heartRate, engine.isPlaying]);

  const spawnRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = BW_COLOR[engine.brainwave] || '#A855F7';
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y, color }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 900);
  };

  function handleOrbTap(e: React.MouseEvent<HTMLDivElement>) {
    spawnRipple(e);
    if (!started) setShowBreath(true);
    else engine.togglePlay();
  }

  function onBreathingComplete() {
    setShowBreath(false);
    setStarted(true);
    engine.start();
  }

  function toggleDemo() {
    if (demoMode) { sim.stop(); setDemoMode(false); }
    else { sim.start(); setDemoMode(true); info('Demo mode — simulating biometrics'); }
  }

  const bwColor = BW_COLOR[engine.brainwave] || '#A855F7';
  const bwGlow  = BW_GLOW[engine.brainwave]  || 'rgba(168,85,247,0.35)';

  return (
    <div className="journey-root">
      {showBreath && <BreathingGuide onComplete={onBreathingComplete} cycles={2} />}

      {/* Header status row */}
      <div style={{ marginTop:20, marginBottom:4, display:'flex', alignItems:'center', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <span className="bw-chip" style={{
          color:bwColor, borderColor:`${bwColor}50`, background:`${bwColor}12`,
          fontSize:11, boxShadow:`0 0 12px ${bwColor}30`,
        }}>
          ◈ {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
        {engine.isPlaying && (
          <span style={{
            fontSize:12, color:'var(--t2)', fontFamily:'JetBrains Mono,monospace',
            background:'rgba(255,255,255,0.04)', padding:'3px 10px', borderRadius:20,
            border:'1px solid rgba(255,255,255,0.08)',
          }}>
            {fmtElapsed(engine.elapsed)}
          </span>
        )}
        {engine.ragaName && (
          <span style={{ fontSize:10, color:'var(--t3)', fontStyle:'italic' }}>
            {engine.ragaName}
          </span>
        )}
      </div>

      {/* Orb container */}
      <div ref={orbRef} onClick={handleOrbTap}
        style={{
          position:'relative', marginTop:12, cursor:'pointer', userSelect:'none',
          filter: engine.isPlaying ? `drop-shadow(0 0 40px ${bwGlow}) drop-shadow(0 0 80px ${bwGlow})` : 'none',
          transition:'filter 0.8s ease',
        }}
      >
        {ripples.map(r => (
          <div key={r.id} className="orb-ripple" style={{ left:r.x, top:r.y, borderColor:r.color }} />
        ))}

        <OrbVisualizer
          brainwave={engine.brainwave}
          isPlaying={engine.isPlaying}
          heartRate={heartRate as number | undefined}
          binauralHz={engine.settings.binaural.hz}
          size={300}
        />

        {!engine.isPlaying && started && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{
              width:62, height:62, borderRadius:'50%',
              background:'rgba(232,48,58,0.12)', backdropFilter:'blur(12px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1.5px solid rgba(232,48,58,0.5)',
              boxShadow:'0 0 32px rgba(232,48,58,0.4),0 0 64px rgba(232,48,58,0.15)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--neon-red)">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Intention label */}
      {engine.intention && (
        <p style={{
          fontSize:11, color:bwColor, marginTop:12, fontWeight:700,
          letterSpacing:'0.12em', textTransform:'uppercase',
          textShadow:`0 0 12px ${bwColor}60`,
        }}>
          ✦ {(INTENTIONS as Record<string, { label: string }>)[engine.intention]?.label} SESSION
        </p>
      )}

      {/* Intention buttons */}
      {!engine.isPlaying && (
        <div style={{ display:'flex', gap:7, marginTop:18, flexWrap:'wrap', justifyContent:'center', padding:'0 24px', maxWidth:400 }}>
          {Object.entries(INTENTIONS).map(([key, p]) => (
            <button key={key} onClick={() => engine.applyIntention(key)}
              style={{
                padding:'8px 16px', borderRadius:'var(--r-full)', fontSize:11, fontFamily:'inherit',
                border:`1px solid ${engine.intention===key ? bwColor+'80' : 'rgba(255,255,255,0.08)'}`,
                background: engine.intention===key ? `${bwColor}15` : 'rgba(255,255,255,0.02)',
                color: engine.intention===key ? bwColor : 'var(--t3)',
                cursor:'pointer', transition:'all 0.2s var(--spring)', fontWeight:700,
                letterSpacing:'0.04em', backdropFilter:'blur(8px)',
                boxShadow: engine.intention===key ? `0 0 16px ${bwColor}30` : 'none',
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom status bar */}
      <div style={{
        position:'absolute', bottom:118, left:0, right:0,
        padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        {/* BLE Heart Rate */}
        <button
          onClick={ble.status==='connected' ? ble.disconnect : ble.status==='disconnected' ? ble.connect : undefined}
          style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 16px',
            borderRadius:22, fontFamily:'inherit', cursor:'pointer',
            border:`1px solid ${ble.status==='connected' ? 'rgba(0,214,143,0.4)' : 'rgba(255,255,255,0.08)'}`,
            background: ble.status==='connected' ? 'rgba(0,214,143,0.06)' : 'rgba(255,255,255,0.02)',
            color: ble.status==='connected' ? 'var(--neon-green)' : 'var(--t3)',
            fontSize:11, fontWeight:700, backdropFilter:'blur(12px)',
            letterSpacing:'0.05em',
            boxShadow: ble.status==='connected' ? '0 0 16px rgba(0,214,143,0.2)' : 'none',
          }}
        >
          <span style={{
            width:7, height:7, borderRadius:'50%',
            background: ble.status==='connected' ? 'var(--neon-green)' : ble.status==='connecting' ? 'var(--neon-gold)' : 'rgba(255,255,255,0.15)',
            boxShadow: ble.status==='connected' ? '0 0 8px rgba(0,214,143,0.8)' : 'none',
          }} />
          {ble.status==='connected' ? `${ble.heartRate||'–'} BPM` : ble.status==='connecting' ? 'Connecting…' : '♡ Heart Rate'}
        </button>

        {/* Demo toggle */}
        <button onClick={toggleDemo}
          style={{
            padding:'8px 16px', borderRadius:22, fontFamily:'inherit', cursor:'pointer',
            border:`1px solid ${demoMode ? 'rgba(255,184,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
            background: demoMode ? 'rgba(255,184,0,0.08)' : 'rgba(255,255,255,0.02)',
            color: demoMode ? 'var(--neon-gold)' : 'var(--t3)',
            fontSize:11, fontWeight:700, letterSpacing:'0.05em', backdropFilter:'blur(12px)',
            boxShadow: demoMode ? '0 0 16px rgba(255,184,0,0.2)' : 'none',
          }}
        >
          {demoMode ? '⚡ DEMO ON' : 'DEMO'}
        </button>

        {/* WS status */}
        <div style={{
          fontSize:10, display:'flex', alignItems:'center', gap:5, fontWeight:700,
          letterSpacing:'0.06em',
          color: ws.status==='connected' ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)',
        }}>
          <span style={{
            width:5, height:5, borderRadius:'50%',
            background: ws.status==='connected' ? 'var(--neon-green)' : 'rgba(255,255,255,0.15)',
            boxShadow: ws.status==='connected' ? '0 0 6px rgba(0,214,143,0.8)' : 'none',
          }} />
          {ws.status.toUpperCase()}
        </div>
      </div>

      <NowPlayingBar
        isPlaying={engine.isPlaying}
        intention={engine.intention}
        elapsed={engine.elapsed}
        brainwave={engine.brainwave}
        bpm={engine.bpm}
        analyser={engine.analyser}
        onTogglePlay={engine.togglePlay}
      />
    </div>
  );
}
