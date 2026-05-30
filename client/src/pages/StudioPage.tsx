import React, { useState, useRef, useEffect } from 'react';
import {
  useSoundEngine,
  INTENTIONS,
  DRONE_OPTIONS,
  INSTRUMENT_OPTIONS,
  NATURE_OPTIONS,
  SOLFEGGIO_OPTIONS,
  BINAURAL_PRESETS,
} from '../context/SoundEngineContext';
import SpectrumAnalyser from '../components/SpectrumAnalyser';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const BW_COLOR: Record<string, string> = {
  Delta: '#3B5BDB', Theta: '#7048E8', Alpha: '#0CA678', Beta: '#4A7FA5', Gamma: '#F59F00',
};
const BW_LABEL: Record<string, string> = {
  Delta: 'Deep Sleep', Theta: 'Meditation', Alpha: 'Focus', Beta: 'Active', Gamma: 'Peak',
};

const LAYER_META: Record<string, { label: string; emoji: string; color: string }> = {
  binaural:   { label: 'Binaural',   emoji: '🧠', color: '#4A7FA5' },
  drone:      { label: 'Drone',      emoji: '🎵', color: '#9B6B9A' },
  instrument: { label: 'Instrument', emoji: '🎸', color: '#C4613A' },
  nature:     { label: 'Nature',     emoji: '🌿', color: '#7B8B5E' },
  solfeggio:  { label: 'Solfeggio',  emoji: '✨', color: '#D4A853' },
};

const GEN_PRESETS = [
  { key: 'sleep',    label: 'Deep Sleep',  emoji: '🌙', sub: 'Delta · 2Hz',   color: '#3B5BDB',
    mix: { intention: 'sleep',    settings: { binaural: { hz: 2,  carrierHz: 180 }, drone: { type: 'tanpura' }, instrument: { type: 'bansuri' }, nature: { type: 'ocean'  }, solfeggio: { hz: 396 } }, layers: { binaural: { active: true,  volume: 0.80 }, drone: { active: true,  volume: 0.55 }, instrument: { active: true,  volume: 0.30 }, nature: { active: true,  volume: 0.55 }, solfeggio: { active: true,  volume: 0.28 } } } },
  { key: 'focus',    label: 'Deep Focus',  emoji: '🎯', sub: 'Alpha · 10Hz',  color: '#0CA678',
    mix: { intention: 'focus',    settings: { binaural: { hz: 10, carrierHz: 220 }, drone: { type: 'shruti'  }, instrument: { type: 'sitar'   }, nature: { type: 'forest' }, solfeggio: { hz: 528 } }, layers: { binaural: { active: true,  volume: 0.75 }, drone: { active: true,  volume: 0.45 }, instrument: { active: false, volume: 0    }, nature: { active: true,  volume: 0.40 }, solfeggio: { active: true,  volume: 0.30 } } } },
  { key: 'heal',     label: 'Healing',     emoji: '💚', sub: 'Theta · 6Hz',   color: '#E64980',
    mix: { intention: 'heal',     settings: { binaural: { hz: 6,  carrierHz: 200 }, drone: { type: 'bowl'    }, instrument: { type: 'bansuri' }, nature: { type: 'rain'   }, solfeggio: { hz: 528 } }, layers: { binaural: { active: true,  volume: 0.75 }, drone: { active: true,  volume: 0.60 }, instrument: { active: true,  volume: 0.35 }, nature: { active: true,  volume: 0.50 }, solfeggio: { active: true,  volume: 0.40 } } } },
  { key: 'energize', label: 'Morning',     emoji: '☀️', sub: 'Beta · 16Hz',   color: '#F59F00',
    mix: { intention: 'energize', settings: { binaural: { hz: 16, carrierHz: 250 }, drone: { type: 'shruti'  }, instrument: { type: 'tabla'   }, nature: { type: 'wind'   }, solfeggio: { hz: 417 } }, layers: { binaural: { active: true,  volume: 0.70 }, drone: { active: true,  volume: 0.40 }, instrument: { active: true,  volume: 0.50 }, nature: { active: true,  volume: 0.45 }, solfeggio: { active: false, volume: 0    } } } },
  { key: 'meditate', label: 'Meditation',  emoji: '🧘', sub: 'Theta · 7Hz',   color: '#7048E8',
    mix: { intention: 'meditate', settings: { binaural: { hz: 7,  carrierHz: 210 }, drone: { type: 'om'      }, instrument: { type: 'sarod'   }, nature: { type: 'river'  }, solfeggio: { hz: 852 } }, layers: { binaural: { active: true,  volume: 0.70 }, drone: { active: true,  volume: 0.65 }, instrument: { active: true,  volume: 0.30 }, nature: { active: true,  volume: 0.45 }, solfeggio: { active: true,  volume: 0.35 } } } },
];

const SOLFEGGIO_GROUPS = [
  { group: 'Grounding',  items: [{ hz: 174, name: 'Pain' }, { hz: 285, name: 'Tissue' }, { hz: 396, name: 'Fear' }] },
  { group: 'Healing',    items: [{ hz: 417, name: 'Change' }, { hz: 528, name: 'DNA' }, { hz: 639, name: 'Bond' }] },
  { group: 'Awakening',  items: [{ hz: 741, name: 'Sense' }, { hz: 852, name: 'Spirit' }, { hz: 963, name: 'Crown' }] },
];

type Mode = 'generate' | 'mix' | 'tune';
interface SavedMix { id: string; name: string; created: string; settings?: string; volumes?: string; }
interface LayerState { volume: number; pan: number; mute: boolean; solo: boolean; eq: { bass: number; mid: number; treble: number }; reverb: number; active: boolean; }

// ── Sub-components ────────────────────────────────────────────────────────────

function StudioOrb({ color, isPlaying, brainwave, hz }: { color: string; isPlaying: boolean; brainwave: string; hz: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr; canvas.height = S * dpr;
    canvas.style.width = `${S}px`; canvas.style.height = `${S}px`;
    ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2;

    const particles = Array.from({ length: 60 }, (_, i) => ({
      angle: (i / 60) * Math.PI * 2,
      r: S * 0.28 + Math.random() * S * 0.14,
      speed: 0.003 + Math.random() * 0.008,
      size:  1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      tRef.current += isPlaying ? 0.018 : 0.006;
      const t = tRef.current;
      ctx.clearRect(0, 0, S, S);

      const breathScale = 1 + 0.06 * Math.sin(t * 0.7);
      const orbR = S * 0.26 * breathScale;

      // ambient glow rings
      for (let i = 4; i >= 1; i--) {
        const gr = orbR * (1 + i * 0.6);
        const grd = ctx.createRadialGradient(cx, cy, orbR * 0.3, cx, cy, gr);
        grd.addColorStop(0, `${color}${Math.round((0.06 / i) * 255).toString(16).padStart(2,'0')}`);
        grd.addColorStop(1, `${color}00`);
        ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      }

      // orbit rings (speed up when playing)
      const speed = isPlaying ? 1 : 0.3;
      for (let r = 0; r < 3; r++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (0.18 + r * 0.09) * (r % 2 === 0 ? 1 : -1) * speed);
        ctx.beginPath();
        ctx.ellipse(0, 0, orbR * (1.4 + r * 0.3), orbR * (0.46 + r * 0.1), r * 0.55, 0, Math.PI * 2);
        ctx.setLineDash(r === 1 ? [3, 7] : []);
        ctx.strokeStyle = `${color}${r === 0 ? '30' : '18'}`;
        ctx.lineWidth = r === 0 ? 1.2 : 0.7;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // orb body
      const parsed = hexToRgb(color);
      const body = ctx.createRadialGradient(cx - orbR * 0.18, cy - orbR * 0.18, 0, cx, cy, orbR);
      body.addColorStop(0,   `rgba(${parsed},0.95)`);
      body.addColorStop(0.5, `rgba(${parsed},0.75)`);
      body.addColorStop(1,   `rgba(${parsed},0.55)`);
      ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill();

      // specular
      const hi = ctx.createRadialGradient(cx - orbR * 0.3, cy - orbR * 0.3, 0, cx - orbR * 0.3, cy - orbR * 0.3, orbR * 0.55);
      hi.addColorStop(0, 'rgba(255,255,255,0.5)');
      hi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = hi; ctx.fill();

      // inner pulse (stronger when playing)
      const pulseAlpha = isPlaying ? 0.55 + 0.2 * Math.sin(t * 3.5) : 0.2 + 0.1 * Math.sin(t * 1.5);
      const pR = orbR * (0.4 + 0.07 * Math.sin(t * 3));
      const pulse = ctx.createRadialGradient(cx, cy, 0, cx, cy, pR);
      pulse.addColorStop(0, `rgba(255,255,255,${pulseAlpha})`);
      pulse.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, pR, 0, Math.PI * 2);
      ctx.fillStyle = pulse; ctx.fill();

      // particles (orbit faster when playing)
      particles.forEach(p => {
        p.angle += p.speed * (isPlaying ? 1.6 : 0.4);
        const wobble = Math.sin(t * 1.5 + p.phase) * S * 0.02;
        const px = cx + Math.cos(p.angle) * (p.r + wobble);
        const py = cy + Math.sin(p.angle) * (p.r + wobble);
        const alpha = (0.18 + 0.2 * Math.sin(t * 2 + p.phase)) * (isPlaying ? 1.4 : 0.6);
        const pgrd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2);
        pgrd.addColorStop(0, `${color}${Math.round(Math.min(alpha, 1) * 255).toString(16).padStart(2,'0')}`);
        pgrd.addColorStop(1, `${color}00`);
        ctx.beginPath(); ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = pgrd; ctx.fill();
      });

      // brainwave label
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(S * 0.076)}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.75 + 0.1 * Math.sin(t * 0.5)})`;
      ctx.fillText(BW_LABEL[brainwave] || brainwave, cx, cy - 6);
      ctx.font = `500 ${Math.round(S * 0.052)}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.08 * Math.sin(t * 0.5)})`;
      ctx.fillText(`${hz} Hz`, cx, cy + 14);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [color, isPlaying, brainwave, hz]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '50%',
        filter: `drop-shadow(0 0 28px ${color}55) drop-shadow(0 12px 40px ${color}30)`,
        transition: 'filter 0.6s ease',
      }}
    />
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function GenOrb({ color, size = 96 }: { color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 38% 35%, ${color}55, ${color}11 60%, transparent)`, boxShadow: `0 0 48px ${color}55`, animation: 'genOrb 1.6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 8,  borderRadius: '50%', border: `1.5px solid ${color}55`, animation: 'genSpin 3s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: `1px solid ${color}30`,   animation: 'genSpin 5s linear infinite reverse' }} />
      <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 14px ${color}` }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudioPage() {
  const engine = useSoundEngine();
  const { isAuthenticated, token } = useAuth();
  const { success, error } = useToast();

  const [mode,         setMode]         = useState<Mode>('generate');
  const [generating,   setGenerating]   = useState(false);
  const [genPreset,    setGenPreset]    = useState<typeof GEN_PRESETS[0] | null>(null);
  const [genDone,      setGenDone]      = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSave,     setShowSave]     = useState(false);
  const [mixName,      setMixName]      = useState('');
  const [savedMixes,   setSavedMixes]   = useState<SavedMix[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [showLib,      setShowLib]      = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const bwColor = BW_COLOR[engine.brainwave] || '#7048E8';

  // ── Tap tempo ───────────────────────────────────────────────────────────────
  const handleTapTempo = () => {
    const now = Date.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 4) taps.shift();
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpmVal = Math.round(60000 / avg);
      if (bpmVal >= 30 && bpmVal <= 200) engine.setBpm(bpmVal);
    }
  };

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async (preset: typeof GEN_PRESETS[0]) => {
    setGenPreset(preset);
    setGenerating(true);
    setGenDone(false);

    let mix: Record<string, unknown> = preset.mix as Record<string, unknown>;
    try {
      const res = await fetch('/api/ai/mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: preset.key === 'custom' ? preset.sub : `Generate a ${preset.label} meditation soundscape` }),
      });
      if (res.ok) { const d = await res.json(); if (d.mix) mix = d.mix; }
    } catch { /* use preset */ }

    await new Promise(r => setTimeout(r, 2000));

    const mergedLayers = Object.fromEntries(
      Object.entries(engine.layers).map(([n, cur]) => [
        n, { ...cur, ...((mix.layers as Record<string, unknown>)?.[n] as object || {}) },
      ])
    );
    engine.applyMix({ ...mix, layers: mergedLayers });
    setGenDone(true);
    await new Promise(r => setTimeout(r, 600));
    engine.start();
    setGenerating(false);
    setGenDone(false);
    success(`${preset.label} soundscape ready ✨`);
  };

  const handleCustomGenerate = () => {
    if (!customPrompt.trim() || generating) return;
    handleGenerate({ key: 'custom', label: 'Custom', emoji: '✦', sub: customPrompt, color: '#7048E8',
      mix: { intention: 'meditate', settings: { binaural: { hz: 7, carrierHz: 210 }, drone: { type: 'om' }, instrument: { type: 'sarod' }, nature: { type: 'river' }, solfeggio: { hz: 528 } }, layers: { binaural: { active: true, volume: 0.7 }, drone: { active: true, volume: 0.6 }, instrument: { active: true, volume: 0.3 }, nature: { active: true, volume: 0.45 }, solfeggio: { active: true, volume: 0.35 } } },
    });
    setCustomPrompt('');
  };

  // ── Layer helpers ───────────────────────────────────────────────────────────
  const LAYER_OPTIONS = {
    binaural: BINAURAL_PRESETS.map(p => p.hz),
    drone: DRONE_OPTIONS, instrument: INSTRUMENT_OPTIONS,
    nature: NATURE_OPTIONS, solfeggio: SOLFEGGIO_OPTIONS,
  };
  const currentOption = (name: string) => {
    if (name === 'binaural')   return engine.settings.binaural.hz;
    if (name === 'solfeggio')  return engine.settings.solfeggio.hz;
    if (name === 'drone')      return engine.settings.drone.type;
    if (name === 'instrument') return engine.settings.instrument.type;
    if (name === 'nature')     return engine.settings.nature.type;
  };
  const handleOption = (name: string, val: string) => {
    const v = isNaN(Number(val)) ? val : Number(val);
    if (name === 'binaural') {
      const p = BINAURAL_PRESETS.find(p => p.hz === v) || BINAURAL_PRESETS[1];
      engine.updateLayerSetting('binaural', 'hz', p.hz);
      engine.updateLayerSetting('binaural', 'carrierHz', p.carrier);
    } else if (name === 'solfeggio') {
      engine.updateLayerSetting('solfeggio', 'hz', v);
    } else {
      engine.updateLayerSetting(name, 'type', v);
    }
  };

  // ── Save / Load ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!mixName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: mixName.trim(), settings: engine.settings,
          layers: Object.fromEntries(Object.entries(engine.layers).map(([k, v]) => [k, { volume: v.volume, active: v.active, reverb: v.reverb, pan: v.pan }])),
        }),
      });
      if (!res.ok) throw new Error();
      success('Mix saved!'); setShowSave(false); setMixName('');
    } catch { error('Failed to save mix.'); }
    finally { setSaving(false); }
  };

  const handleOpenLib = async () => {
    try {
      const res = await fetch('/api/mixes', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSavedMixes(data.mixes || []);
      setShowLib(true);
    } catch { error('Could not load mixes.'); }
  };

  const handleLoadMix = (mix: SavedMix) => {
    try {
      const ll = JSON.parse(mix.volumes || '{}');
      const merged = Object.fromEntries(Object.entries(engine.layers).map(([n, cur]) => [n, { ...cur, ...(ll[n] || {}) }]));
      engine.applyMix({ settings: JSON.parse(mix.settings || '{}'), layers: merged });
      success(`Loaded: ${mix.name}`); setShowLib(false);
    } catch { error('Failed to load mix: invalid data.'); }
  };

  const handleDeleteMix = async (id: string) => {
    await fetch(`/api/mixes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSavedMixes(m => m.filter(x => x.id !== id));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="ck-page">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="ck-header">
        <div className="ck-title">Sound Studio</div>
        {/* Mode segmented control */}
        <div className="ck-seg">
          {(['generate', 'mix', 'tune'] as Mode[]).map(m => (
            <button
              key={m}
              className={`ck-seg-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'generate' ? '✦ Generate' : m === 'mix' ? '⊟ Mix' : '◎ Tune'}
            </button>
          ))}
        </div>
      </div>

      {/* ══ MODE: GENERATE ═══════════════════════════════════════════════════ */}
      {mode === 'generate' && (
        <div className="ck-body">

          {/* Central orb + play */}
          <div className="ck-orb-wrap">
            <StudioOrb
              color={bwColor}
              isPlaying={engine.isPlaying}
              brainwave={engine.brainwave}
              hz={engine.settings.binaural.hz}
            />
            <button
              className={`ck-play-btn ${engine.isPlaying ? 'playing' : ''}`}
              style={{ '--pc': bwColor } as React.CSSProperties}
              onClick={engine.togglePlay}
            >
              {engine.isPlaying
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink2)"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
          </div>

          {/* Spectrum — appears when playing */}
          {engine.isPlaying && (
            <div className="ck-spectrum">
              <SpectrumAnalyser analyser={engine.analyser} isPlaying={engine.isPlaying} height={40} />
            </div>
          )}

          {/* Preset grid */}
          <div className="ck-preset-grid">
            {GEN_PRESETS.map(p => (
              <button
                key={p.key}
                className={`ck-preset ${engine.intention === p.key ? 'active' : ''}`}
                style={{ '--pc': p.color } as React.CSSProperties}
                onClick={() => !generating && handleGenerate(p)}
                disabled={generating}
              >
                <span className="ckp-emoji">{p.emoji}</span>
                <span className="ckp-label">{p.label}</span>
                <span className="ckp-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Custom prompt */}
          <div className="ck-custom">
            <input
              className="ck-input"
              placeholder="Describe your ideal soundscape…"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomGenerate()}
              disabled={generating}
            />
            <button
              className="ck-send"
              style={{ '--pc': bwColor } as React.CSSProperties}
              onClick={handleCustomGenerate}
              disabled={!customPrompt.trim() || generating}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* Save / load */}
          {isAuthenticated && (
            <div className="ck-lib-row">
              <button className="ck-lib-btn" onClick={() => setShowSave(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Mix
              </button>
              <button className="ck-lib-btn" onClick={handleOpenLib}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                My Mixes
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ MODE: MIX ════════════════════════════════════════════════════════ */}
      {mode === 'mix' && (
        <div className="ck-body">

          {/* Live status bar */}
          <div className="ck-status-bar">
            <div className="ck-bw-pill" style={{ background: `${bwColor}15`, color: bwColor, border: `1px solid ${bwColor}30` }}>
              <span className="ck-bw-dot" style={{ background: bwColor }}/>
              {engine.brainwave} · {engine.settings.binaural.hz}Hz
            </div>
            <button
              className={`ck-mini-play ${engine.isPlaying ? 'on' : ''}`}
              style={{ '--pc': bwColor } as React.CSSProperties}
              onClick={engine.togglePlay}
            >
              {engine.isPlaying
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
          </div>

          {/* Layer strips */}
          <div className="ck-layers">
            {(['binaural','drone','instrument','nature','solfeggio'] as const).map(name => {
              const layer = (engine.layers as Record<string, LayerState>)[name];
              const meta  = LAYER_META[name];
              const opts  = (LAYER_OPTIONS as Record<string, (string | number)[]>)[name];
              const cur   = currentOption(name);
              const isExp = expandedLayer === name;

              return (
                <div
                  key={name}
                  className={`ck-layer ${layer.active ? 'active' : ''} ${layer.mute ? 'muted' : ''}`}
                  style={{ '--lc': meta.color } as React.CSSProperties}
                >
                  {/* Main row */}
                  <div className="ckl-row">
                    {/* Power */}
                    <button
                      className={`ckl-power ${layer.active ? 'on' : ''}`}
                      onClick={() => engine.setLayerActive(name, !layer.active)}
                    >
                      {meta.emoji}
                    </button>

                    {/* Name + type */}
                    <div className="ckl-info" onClick={() => setExpandedLayer(isExp ? null : name)}>
                      <span className="ckl-name">{meta.label}</span>
                      <span className="ckl-type">
                        {typeof cur === 'number' ? `${cur}Hz` : (cur?.toString() ?? '').charAt(0).toUpperCase() + (cur?.toString() ?? '').slice(1)}
                      </span>
                    </div>

                    {/* Volume bar */}
                    <div className="ckl-vol-wrap">
                      <input
                        type="range" min="0" max="1" step="0.01"
                        value={layer.volume}
                        onChange={e => engine.setLayerVolume(name, parseFloat(e.target.value))}
                        className="ckl-vol"
                        style={{ '--vp': `${layer.volume * 100}%`, '--vc': meta.color } as React.CSSProperties}
                        disabled={!layer.active}
                      />
                    </div>

                    {/* Vol% */}
                    <span className="ckl-vol-num">{Math.round(layer.volume * 100)}</span>

                    {/* Mute */}
                    <button
                      className={`ckl-mute ${layer.mute ? 'on' : ''}`}
                      onClick={() => engine.toggleMute(name)}
                    >M</button>
                  </div>

                  {/* Expanded panel */}
                  {isExp && (
                    <div className="ckl-expand">
                      {/* Type selector */}
                      <div className="ckl-exp-row">
                        <span className="ckl-exp-lbl">Type</span>
                        <select
                          className="ckl-select"
                          value={cur}
                          onChange={e => handleOption(name, e.target.value)}
                        >
                          {opts.map(o => (
                            <option key={o} value={o}>
                              {typeof o === 'number' ? `${o}Hz` : o.charAt(0).toUpperCase() + o.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Reverb */}
                      <div className="ckl-exp-row">
                        <span className="ckl-exp-lbl">Reverb</span>
                        <input
                          type="range" min="0" max="1" step="0.01"
                          value={layer.reverb}
                          onChange={e => engine.setLayerReverb(name, parseFloat(e.target.value))}
                          className="ckl-vol ckl-vol-sm"
                          style={{ '--vp': `${layer.reverb * 100}%`, '--vc': meta.color } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Master controls */}
          <div className="ck-master">
            <div className="ck-master-block">
              <div className="ck-master-lbl">Master Vol</div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={engine.masterVol}
                onChange={e => engine.setMasterVolume(parseFloat(e.target.value))}
                className="ck-master-range"
                style={{ '--vp': `${engine.masterVol * 100}%`, '--vc': bwColor } as React.CSSProperties}
              />
              <div className="ck-master-val" style={{ color: bwColor }}>{Math.round(engine.masterVol * 100)}%</div>
            </div>
            <div className="ck-master-block">
              <div className="ck-master-lbl">BPM</div>
              <input
                type="range" min="40" max="180" step="1"
                value={engine.bpm}
                onChange={e => engine.setBpm(Number(e.target.value))}
                className="ck-master-range"
                style={{ '--vp': `${((engine.bpm-40)/140)*100}%`, '--vc': bwColor } as React.CSSProperties}
              />
              <div className="ck-master-val" style={{ color: bwColor }}>{engine.bpm}</div>
            </div>
          </div>

          <button className="ck-tap" onClick={handleTapTempo}>Tap Tempo</button>
        </div>
      )}

      {/* ══ MODE: TUNE ═══════════════════════════════════════════════════════ */}
      {mode === 'tune' && (
        <div className="ck-body">

          {/* Intention */}
          <div>
            <div className="ck-section-lbl">Intention</div>
            <div className="ck-intent-grid">
              {Object.entries(INTENTIONS).map(([key, p]) => (
                <button
                  key={key}
                  className={`ck-intent ${engine.intention === key ? 'active' : ''}`}
                  onClick={() => engine.applyIntention(key)}
                >
                  <span className="cki-emoji">{p.emoji}</span>
                  <span className="cki-lbl">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chaos */}
          <div>
            <div className="ck-section-lbl" style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span>Chaos</span>
              <span style={{ color: bwColor, fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700 }}>{Math.round(engine.chaos * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={engine.chaos}
              onChange={e => engine.setChaos(parseFloat(e.target.value))}
              className="ck-master-range"
              style={{ '--vp': `${engine.chaos * 100}%`, '--vc': bwColor } as React.CSSProperties}
            />
            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 6, fontStyle:'italic' }}>
              {engine.chaos < 0.2 ? 'Ordered · minimal variation' : engine.chaos < 0.5 ? 'Balanced · gentle flow' : engine.chaos < 0.75 ? 'Dynamic · expressive' : 'Wild · maximum variation'}
            </div>
          </div>

          {/* Solfeggio */}
          <div>
            <div className="ck-section-lbl">Solfeggio Frequencies</div>
            <div className="ck-sol-groups">
              {SOLFEGGIO_GROUPS.map(g => (
                <div key={g.group}>
                  <div className="ck-sol-grp-lbl">{g.group}</div>
                  <div className="ck-sol-row">
                    {g.items.map(f => (
                      <button
                        key={f.hz}
                        className={`ck-sol-chip ${engine.settings.solfeggio.hz === f.hz ? 'active' : ''}`}
                        onClick={() => engine.updateLayerSetting('solfeggio','hz',f.hz)}
                      >
                        <span className="cksc-hz">{f.hz}Hz</span>
                        <span className="cksc-name">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══ GENERATION OVERLAY ═══════════════════════════════════════════════ */}
      {generating && genPreset && (
        <div className="ck-overlay">
          <GenOrb color={genPreset.color} size={120} />
          <div style={{ textAlign:'center', animation:'ckSlide 0.4s ease both' }}>
            <div className="ck-overlay-title">
              {genDone ? 'Ready ✨' : `Composing ${genPreset.label}…`}
            </div>
            <div className="ck-overlay-sub">
              {genDone ? 'Starting playback' : 'Weaving binaural beats, sacred\nfrequencies and ancient raga'}
            </div>
          </div>
          {!genDone && (
            <div style={{ display:'flex', gap:8 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:genPreset.color, opacity:0.35, animation:`genOrb 1.2s ease-in-out ${i*0.25}s infinite` }}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ SAVE MODAL ═══════════════════════════════════════════════════════ */}
      {showSave && (
        <div className="modal-overlay" onClick={() => setShowSave(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>Save Mix</h3>
            <div className="form-group">
              <label className="form-label">Mix Name</label>
              <input type="text" placeholder="e.g. Sunday Deep Sleep…" value={mixName} onChange={e => setMixName(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSave()} autoFocus />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn-primary"   style={{ flex:2 }} onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LIBRARY MODAL ════════════════════════════════════════════════════ */}
      {showLib && (
        <div className="modal-overlay" onClick={() => setShowLib(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, marginBottom:16 }}>My Mixes</h3>
            {savedMixes.length === 0
              ? <p style={{ fontSize:13, color:'var(--ink3)', textAlign:'center', padding:'20px 0' }}>No saved mixes yet.</p>
              : savedMixes.map(mix => (
                <div key={mix.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink1)' }}>{mix.name}</div>
                    <div style={{ fontSize:10, color:'var(--ink3)' }}>{new Date(mix.created).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => handleLoadMix(mix)}>Load</button>
                  <button className="btn-ghost"     style={{ padding:'6px 10px', fontSize:12, color:'#C0392B' }} onClick={() => handleDeleteMix(mix.id)}>✕</button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
