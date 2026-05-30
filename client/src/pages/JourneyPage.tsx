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

  return (
    <div className="journey-root">
      {showBreath && <BreathingGuide onComplete={onBreathingComplete} cycles={2} />}

      {/* Brainwave chip */}
      <div style={{ marginTop:16, marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
        <span className="bw-chip" style={{ color:bwColor, borderColor:`${bwColor}60`, background:`${bwColor}10`, fontSize:11 }}>
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
        {engine.isPlaying && (
          <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'JetBrains Mono,monospace' }}>
            {fmtElapsed(engine.elapsed)}
          </span>
        )}
        {engine.ragaName && (
          <span style={{ fontSize:10, color:'var(--t4)', fontStyle:'italic', fontFamily:'Inter,sans-serif' }}>
            {engine.ragaName}
          </span>
        )}
      </div>

      {/* Orb with ripple container */}
      <div ref={orbRef} onClick={handleOrbTap}
        style={{ position:'relative', marginTop:8, cursor:'pointer', userSelect:'none' }}>
        {/* Ripples */}
        {ripples.map(r => (
          <div key={r.id} className="orb-ripple" style={{
            left: r.x, top: r.y, color: r.color,
            borderColor: r.color,
          }} />
        ))}

        <OrbVisualizer
          brainwave={engine.brainwave}
          isPlaying={engine.isPlaying}
          heartRate={heartRate as number | undefined}
          binauralHz={engine.settings.binaural.hz}
          size={280}
        />

        {!engine.isPlaying && started && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(232,48,58,0.15)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(232,48,58,0.4)', boxShadow:'0 0 24px rgba(232,48,58,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--neon-red)"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Intention label */}
      {engine.intention && (
        <p style={{ fontSize:12, color:'var(--t3)', marginTop:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          {INTENTIONS[engine.intention]?.label} SESSION
        </p>
      )}

      {/* Quick intention row */}
      {!engine.isPlaying && (
        <div style={{ display:'flex', gap:8, marginTop:20, flexWrap:'wrap', justifyContent:'center', padding:'0 20px' }}>
          {Object.entries(INTENTIONS).map(([key, p]) => (
            <button key={key} onClick={() => engine.applyIntention(key)}
              style={{
                padding:'7px 14px', borderRadius:'var(--r-full)', fontSize:11, fontFamily:'inherit',
                border:`1px solid ${engine.intention===key ? bwColor : 'var(--border)'}`,
                background: engine.intention===key ? `${bwColor}18` : 'rgba(255,255,255,0.02)',
                color: engine.intention===key ? bwColor : 'var(--t3)',
                cursor:'pointer', transition:'all 0.2s var(--spring)', fontWeight:700,
                letterSpacing:'0.04em',
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ position:'absolute', bottom:110, left:0, right:0, padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button
          onClick={ble.status==='connected' ? ble.disconnect : ble.status==='disconnected' ? ble.connect : undefined}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
            borderRadius:20, border:`1px solid ${ble.status==='connected' ? 'rgba(0,214,143,0.4)' : 'var(--border)'}`,
            background:'rgba(255,255,255,0.03)', color:ble.status==='connected' ? 'var(--neon-green)':'var(--t3)',
            fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)',
            letterSpacing:'0.04em',
          }}
        >
          <span style={{ width:6, height:6, borderRadius:'50%', background:ble.status==='connected'?'var(--neon-green)':ble.status==='connecting'?'var(--neon-gold)':'var(--t4)' }} />
          {ble.status==='connected' ? `${ble.heartRate||'–'} BPM` : ble.status==='connecting' ? 'Connecting…' : 'Heart Rate'}
        </button>

        <button onClick={toggleDemo}
          style={{
            padding:'7px 14px', borderRadius:20,
            border:`1px solid ${demoMode?'rgba(255,184,0,0.4)':'var(--border)'}`,
            background:demoMode?'rgba(255,184,0,0.08)':'rgba(255,255,255,0.03)',
            color:demoMode?'var(--neon-gold)':'var(--t3)',
            fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em',
          }}
        >
          {demoMode ? '🎭 DEMO ON' : 'DEMO'}
        </button>

        <div style={{ fontSize:10, color:ws.status==='connected'?'var(--neon-green)':'var(--t4)', display:'flex', alignItems:'center', gap:4, fontWeight:700, letterSpacing:'0.06em' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:ws.status==='connected'?'var(--neon-green)':'var(--t4)' }} />
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
