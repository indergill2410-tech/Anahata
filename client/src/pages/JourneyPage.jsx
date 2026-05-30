import React, { useEffect, useState } from 'react';
import OrbVisualizer from '../components/OrbVisualizer';
import BreathingGuide from '../components/BreathingGuide';
import NowPlayingBar from '../components/NowPlayingBar';
import { useSoundEngine, INTENTIONS, BW_FOR_HZ } from '../context/SoundEngineContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import { useToast } from '../context/ToastContext';

const BW_COLOR = { Delta:'#4A7FA5', Theta:'#9B6B9A', Alpha:'#7B8B5E', Beta:'#4A7FA5', Gamma:'#D4A853' };

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

  useEffect(() => {
    if (heartRate && ws.status === 'connected') ws.send({ type:'biometric', heartRate });
  }, [heartRate, ws.status]);

  useEffect(() => {
    if (ws.lastMessage?.type === 'meditation') setWsMsg(ws.lastMessage);
  }, [ws.lastMessage]);

  useEffect(() => {
    if (heartRate && engine.isPlaying) engine.adaptFromHeartRate(heartRate);
  }, [heartRate]);

  function handleOrbTap() {
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

  const bwColor = BW_COLOR[engine.brainwave] || '#9B6B9A';

  return (
    <div className="journey-root">
      {showBreath && <BreathingGuide onComplete={onBreathingComplete} cycles={2} />}

      {/* Brainwave label */}
      <div style={{ marginTop:12, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
        <span className="bw-chip" style={{ background:`${bwColor}12`, color:bwColor, borderColor:`${bwColor}40`, fontSize:11 }}>
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
        {engine.isPlaying && (
          <span style={{ fontSize:10, color:'var(--t3)' }}>{fmtElapsed(engine.elapsed)}</span>
        )}
        {engine.ragaName && (
          <span style={{ fontSize:10, color:'var(--t4)', fontStyle:'italic', fontFamily:'Lora, serif' }}>{engine.ragaName}</span>
        )}
      </div>

      {/* Orb */}
      <div onClick={handleOrbTap} style={{ position:'relative', marginTop:8, cursor:'pointer', userSelect:'none' }}>
        <OrbVisualizer
          brainwave={engine.brainwave}
          isPlaying={engine.isPlaying}
          heartRate={heartRate}
          binauralHz={engine.settings.binaural.hz}
          size={260}
        />
        {!engine.isPlaying && started && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(196,97,58,0.15)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(196,97,58,0.35)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Intention label */}
      {engine.intention && (
        <p style={{ fontSize:12, color:'var(--t3)', marginTop:10, fontStyle:'italic', fontFamily:'Lora, serif' }}>
          {INTENTIONS[engine.intention]?.label} session
        </p>
      )}

      {/* Quick intention selector */}
      {!engine.isPlaying && (
        <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap', justifyContent:'center', padding:'0 24px' }}>
          {Object.entries(INTENTIONS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => engine.applyIntention(key)}
              style={{
                padding:'6px 14px', borderRadius:'var(--r-full)', fontSize:11, fontFamily:'inherit',
                border:`1px solid ${engine.intention === key ? bwColor : 'var(--border)'}`,
                background: engine.intention === key ? `${bwColor}12` : '#fff',
                color: engine.intention === key ? bwColor : 'var(--t3)',
                cursor:'pointer', transition:'all 0.15s',
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ position:'absolute', bottom:108, left:0, right:0, padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button
          onClick={ble.status === 'connected' ? ble.disconnect : ble.status === 'disconnected' ? ble.connect : undefined}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
            borderRadius:20, border:`1px solid ${ble.status === 'connected' ? 'rgba(123,139,94,0.4)' : 'var(--border)'}`,
            background:'#fff', color: ble.status === 'connected' ? 'var(--green)' : 'var(--t3)',
            fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
          }}
        >
          <span style={{ width:6, height:6, borderRadius:'50%', background: ble.status === 'connected' ? 'var(--green)' : ble.status === 'connecting' ? 'var(--amber)' : 'var(--bg-3)' }} />
          {ble.status === 'connected' ? `${ble.heartRate || '–'} BPM` : ble.status === 'connecting' ? 'Connecting…' : 'Heart Rate'}
        </button>

        <button
          onClick={toggleDemo}
          style={{
            padding:'6px 12px', borderRadius:20,
            border:`1px solid ${demoMode ? 'rgba(212,168,83,0.4)' : 'var(--border)'}`,
            background: demoMode ? 'rgba(212,168,83,0.08)' : '#fff',
            color: demoMode ? 'var(--gold)' : 'var(--t3)',
            fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
          }}
        >
          {demoMode ? '🎭 Demo On' : 'Demo'}
        </button>

        <div style={{ fontSize:10, color: ws.status === 'connected' ? 'var(--green)' : 'var(--t4)', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background: ws.status === 'connected' ? 'var(--green)' : 'var(--bg-3)' }} />
          {ws.status}
        </div>
      </div>

      {/* Now Playing Bar */}
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
