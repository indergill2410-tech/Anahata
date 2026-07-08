import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import OrbVisualizer from '../components/OrbVisualizer';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';
import BreathingGuide, { type BreathingPattern } from '../components/BreathingGuide';
import NowPlayingBar from '../components/NowPlayingBar';
import { useSoundEngine, useElapsed, INTENTIONS } from '../context/SoundEngineContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import { useBiometricCoach } from '../hooks/useBiometricCoach';
import { useToast } from '../context/ToastContext';
import { type BiometricSource } from '../services/biometricCoach';

const BW_COLOR: Record<string, string> = {
  Delta:'#3B5BDB', Theta:'#7048E8', Alpha:'#0CA678', Beta:'#3B5BDB', Gamma:'#F59F00',
};
const BW_GLOW: Record<string, string> = {
  Delta:'rgba(59,91,219,0.08)', Theta:'rgba(112,72,232,0.08)',
  Alpha:'rgba(12,166,120,0.08)', Beta:'rgba(59,91,219,0.08)', Gamma:'rgba(245,159,0,0.08)',
};

function fmtElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}

interface Ripple { id: number; x: number; y: number; color: string; }
type BreathSession = { mode: 'start' | 'coach'; cycles: number; pattern?: BreathingPattern; title?: string };

export default function JourneyPage() {
  const engine  = useSoundEngine();
  const elapsed = useElapsed();
  const ws     = useWebSocket();
  const ble    = useBluetooth();
  const sim    = useSimulator();
  const { info, success } = useToast();

  const [practiceMode,      setPracticeMode]      = useState(false);
  const [breathSession, setBreathSession] = useState<BreathSession | null>(null);
  const [started,       setStarted]       = useState(false);
  const [wsMsg,         setWsMsg]         = useState<{ heartRate?: number } | null>(null);
  const [ripples,       setRipples]       = useState<Ripple[]>([]);
  const orbRef = useRef<HTMLDivElement>(null);

  const heartRate = ble.status === 'connected' ? ble.heartRate
                 : practiceMode               ? sim.heartRate
                  : wsMsg?.heartRate ?? null;
  const biometricSource: BiometricSource = ble.status === 'connected' ? 'watch'
                                      : practiceMode                   ? 'demo'
                                      : typeof wsMsg?.heartRate === 'number' ? 'websocket'
                                      : 'manual';
  const coach = useBiometricCoach({
    heartRate,
    source: biometricSource,
    deviceName: ble.deviceName,
    battery: ble.battery,
    enabled: Boolean(heartRate),
  });
  const advice = coach.advice;

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
    if (!started) setBreathSession({ mode: 'start', cycles: 2 });
    else engine.togglePlay();
  }

  function onBreathingComplete() {
    const mode = breathSession?.mode;
    setBreathSession(null);
    if (mode === 'start') {
      setStarted(true);
      engine.start();
    } else if (mode === 'coach') {
      info('Breath reset complete');
    }
  }

  function togglePracticeSignal() {
    if (practiceMode) { sim.stop(); setPracticeMode(false); }
    else { sim.start(); setPracticeMode(true); info('Practice signal is on'); }
  }

  function startCoachBreath() {
    if (!advice) return;
    setBreathSession({
      mode: 'coach',
      pattern: advice.breathing,
      cycles: advice.breathing.cycles,
      title: advice.breathing.label,
    });
  }

  function applyCoachMusic() {
    if (!advice) return;
    const label = (INTENTIONS as Record<string, { label: string }>)[advice.music.intention]?.label || advice.music.intention;
    engine.applyIntention(advice.music.intention);
    engine.setBpm(advice.music.tempo);
    success(`${label} tuned for ${advice.music.brainwave}`);
  }

  const bwColor = BW_COLOR[engine.brainwave] || '#A855F7';
  const bwGlow  = BW_GLOW[engine.brainwave]  || 'rgba(168,85,247,0.35)';
  const canPairWatch = ble.status === 'idle' || ble.status === 'disconnected' || ble.status === 'error';
  const watchButtonLabel = ble.status === 'connected'
    ? `${ble.heartRate || '-'} BPM`
    : ble.status === 'connecting'
      ? 'Pairing watch'
      : ble.status === 'unsupported'
        ? 'Watch not available'
        : ble.status === 'error'
          ? 'Retry watch'
          : 'Connect watch';
  const watchColor = ble.status === 'connected' ? 'var(--teal)'
                   : ble.status === 'connecting' ? 'var(--amber)'
                   : ble.status === 'error' ? 'var(--rose)'
                   : 'var(--ink3)';
  const watchDot = ble.status === 'connected' ? 'var(--teal)'
                 : ble.status === 'connecting' ? 'var(--amber)'
                 : ble.status === 'error' ? 'var(--rose)'
                 : 'var(--ink4)';

  return (
    <div className="journey-root" style={{ overflowX: 'hidden', overflowY: 'auto', paddingBottom: advice ? 210 : 150 }}>
      {breathSession && (
        <BreathingGuide
          onComplete={onBreathingComplete}
          cycles={breathSession.cycles}
          pattern={breathSession.pattern}
          title={breathSession.title}
        />
      )}

      {/* Header status row */}
      <div style={{ marginTop:20, marginBottom:4, display:'flex', alignItems:'center', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <span className="bw-chip" style={{ fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
          <AnahataOrb id={({ Delta:'bw-delta', Theta:'bw-theta', Alpha:'bw-alpha', Beta:'bw-beta', Gamma:'bw-gamma' } as Record<string,OrbId>)[engine.brainwave] || 'bw-alpha'} size={20} style={{ verticalAlign:'middle' }} />
          {engine.brainwave} · {engine.settings.binaural.hz}Hz
        </span>
        {engine.isPlaying && (
          <span style={{
            fontSize:12, color:'var(--ink2)', fontFamily:'JetBrains Mono,monospace',
            background:'var(--bg1)', padding:'3px 10px', borderRadius:20,
            border:'1px solid var(--border)',
          }}>
            {fmtElapsed(elapsed)}
          </span>
        )}
        {engine.ragaName && (
          <span style={{ fontSize:10, color:'var(--t3)', fontStyle:'italic' }}>
            {engine.ragaName}
          </span>
        )}
      </div>

      {/* Orb container */}
      <motion.div ref={orbRef} onClick={handleOrbTap}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position:'relative', marginTop:12, cursor:'pointer', userSelect:'none',
          filter: engine.isPlaying ? `drop-shadow(0 8px 40px ${bwGlow})` : 'none',
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
              background:'rgba(59,91,219,0.1)', backdropFilter:'blur(12px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1.5px solid rgba(59,91,219,0.4)',
              boxShadow:'0 0 20px rgba(59,91,219,0.2)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--blue)">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </motion.div>

      {/* Intention label */}
      {engine.intention && (
        <p style={{
          fontSize:11, color:bwColor, marginTop:12, fontWeight:700,
          letterSpacing:'0.12em', textTransform:'uppercase',
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
                border:`1px solid ${engine.intention===key ? 'rgba(112,72,232,0.4)' : 'var(--border)'}`,
                background: engine.intention===key ? 'var(--violet)' : 'var(--bg1)',
                color: engine.intention===key ? '#fff' : 'var(--ink2)',
                cursor:'pointer', transition:'all 0.2s var(--spring)', fontWeight:700,
                letterSpacing:'0.04em',
                boxShadow: engine.intention===key ? '0 4px 16px rgba(112,72,232,0.3)' : 'var(--shadow)',
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      )}

      {ble.error && !advice && (
        <p style={{ margin:'12px 24px 0', maxWidth:360, color:'var(--rose)', fontSize:11, lineHeight:1.45, textAlign:'center', fontWeight:700 }}>
          {ble.error}
        </p>
      )}

      {advice && (
        <motion.div 
          initial={{ y: 50, opacity: 0, rotateX: -15 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
          width:'calc(100% - 36px)', maxWidth:430, marginTop:14,
          background:'rgba(255,255,255,0.4)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:`1px solid rgba(255,255,255,0.6)`,
          borderRadius:18, boxShadow:'0 12px 40px rgba(23,18,10,0.06), inset 0 1px 0 rgba(255,255,255,0.7)', padding:13,
          display:'flex', flexDirection:'column', gap:10,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:advice.metrics.zone.color, boxShadow:`0 0 14px ${advice.metrics.zone.color}70`, flexShrink:0 }} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:900, color:'var(--ink1)', fontFamily:"'Space Grotesk', sans-serif", whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  Smart coach
                </div>
                <div style={{ fontSize:10, color:'var(--ink3)', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {advice.metrics.zone.label} · {advice.metrics.trend.label} · {advice.confidence}% confidence
                </div>
              </div>
            </div>
            <div style={{ borderRadius:999, padding:'6px 10px', background:`${advice.metrics.zone.color}12`, color:advice.metrics.zone.color, fontSize:13, fontWeight:900, fontFamily:'JetBrains Mono, monospace', flexShrink:0 }}>
              {advice.metrics.heartRate} BPM
            </div>
          </div>

          <p style={{ margin:0, color:'var(--ink2)', fontSize:12, lineHeight:1.5 }}>
            {advice.primaryAction}
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ minWidth:0, borderRadius:14, padding:'9px 10px', background:'rgba(12,166,120,0.07)', border:'1px solid rgba(12,166,120,0.16)' }}>
              <div style={{ fontSize:10, color:'#0CA678', fontWeight:900 }}>Breath</div>
              <div style={{ fontSize:12, color:'var(--ink1)', fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{advice.breathing.pattern}</div>
            </div>
            <div style={{ minWidth:0, borderRadius:14, padding:'9px 10px', background:'rgba(112,72,232,0.07)', border:'1px solid rgba(112,72,232,0.16)' }}>
              <div style={{ fontSize:10, color:'#7048E8', fontWeight:900 }}>Music</div>
              <div style={{ fontSize:12, color:'var(--ink1)', fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{advice.music.brainwave} · {advice.music.tempo} BPM</div>
            </div>
          </div>

          {advice.cautions.length > 0 && (
            <p style={{ margin:0, color:'#D97706', fontSize:11, lineHeight:1.45 }}>{advice.cautions[0]}</p>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={applyCoachMusic} style={{
              flex:1, height:36, borderRadius:12, border:'none', background:'var(--violet)', color:'#fff',
              fontSize:12, fontWeight:900, boxShadow:'0 4px 14px rgba(112,72,232,0.25)'
            }}>
              Apply music
            </button>
            <button onClick={startCoachBreath} style={{
              flex:1, height:36, borderRadius:12, border:'1px solid rgba(12,166,120,0.22)', background:'rgba(12,166,120,0.08)', color:'#0CA678',
              fontSize:12, fontWeight:900
            }}>
              Try breath
            </button>
          </div>
        </motion.div>
      )}

      {/* Bottom status bar */}
      <div style={{
        position:'absolute', bottom:118, left:0, right:0,
        padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        {/* BLE Watch Heart Rate */}
        <button
          title={ble.error || (ble.status === 'connected' ? `${ble.deviceName || 'Smart watch'} connected` : 'Connect a heart-rate watch')}
          onClick={ble.status==='connected' ? ble.disconnect : canPairWatch ? ble.connect : undefined}
          style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 14px',
            borderRadius:22, fontFamily:'inherit', cursor: ble.status === 'connecting' || ble.status === 'unsupported' ? 'default' : 'pointer',
            border:`1px solid ${ble.status==='connected' ? 'rgba(12,166,120,0.4)' : ble.status === 'error' ? 'rgba(230,73,128,0.25)' : 'var(--border)'}`,
            background: ble.status==='connected' ? 'rgba(12,166,120,0.06)' : ble.status === 'error' ? 'rgba(230,73,128,0.07)' : 'var(--bg1)',
            color: watchColor,
            fontSize:11, fontWeight:700,
            letterSpacing:'0.05em',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span style={{ width:7, height:7, borderRadius:'50%', background: watchDot }} />
          <span style={{ maxWidth:112, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{watchButtonLabel}</span>
        </button>

        {/* Practice signal toggle */}
        <button onClick={togglePracticeSignal}
          style={{
            padding:'8px 16px', borderRadius:22, fontFamily:'inherit', cursor:'pointer',
            border:`1px solid ${practiceMode ? 'rgba(245,159,0,0.4)' : 'var(--border)'}`,
            background: practiceMode ? 'rgba(245,159,0,0.08)' : 'var(--bg1)',
            color: practiceMode ? 'var(--amber)' : 'var(--ink3)',
            fontSize:11, fontWeight:700, letterSpacing:'0.05em',
            boxShadow: 'var(--shadow)',
          }}
        >
          {practiceMode ? 'PRACTICE ON' : 'TRY SIGNAL'}
        </button>

        {/* WS status */}
        <div style={{
          fontSize:10, display:'flex', alignItems:'center', gap:5, fontWeight:700,
          letterSpacing:'0.06em',
          color: ws.status==='connected' ? 'var(--teal)' : 'var(--ink3)',
        }}>
          <span style={{
            width:5, height:5, borderRadius:'50%',
            background: ws.status==='connected' ? 'var(--teal)' : 'var(--ink4)',
          }} />
          {ws.status.toUpperCase()}
        </div>
      </div>

      <NowPlayingBar
        isPlaying={engine.isPlaying}
        intention={engine.intention}
        elapsed={elapsed}
        brainwave={engine.brainwave}
        bpm={engine.bpm}
        analyser={engine.analyser}
        onTogglePlay={engine.togglePlay}
      />
    </div>
  );
}
