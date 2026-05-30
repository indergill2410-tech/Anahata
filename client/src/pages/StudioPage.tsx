import React, { useState, useRef } from 'react';
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
const BW_DESC: Record<string, string> = {
  Delta: 'Deep sleep  ·  0.5–4 Hz',
  Theta: 'Meditation  ·  4–8 Hz',
  Alpha: 'Relaxed focus  ·  8–14 Hz',
  Beta:  'Active mind  ·  14–30 Hz',
  Gamma: 'Peak awareness  ·  30+ Hz',
};

const LAYER_META: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  binaural:   { label: 'Binaural',    emoji: '🧠', color: '#4A7FA5', desc: 'Brainwave entrainment' },
  drone:      { label: 'Drone',       emoji: '🎵', color: '#9B6B9A', desc: 'Harmonic foundation'   },
  instrument: { label: 'Instrument',  emoji: '🎸', color: '#C4613A', desc: 'Melodic texture'        },
  nature:     { label: 'Nature',      emoji: '🌿', color: '#7B8B5E', desc: 'Ambient soundscape'     },
  solfeggio:  { label: 'Solfeggio',   emoji: '✨', color: '#D4A853', desc: 'Sacred frequencies'     },
};

const GEN_PRESETS = [
  { key: 'sleep',    label: 'Deep Sleep',  emoji: '🌙', desc: 'Delta · 2Hz',  color: '#3B5BDB',
    mix: { intention: 'sleep',    settings: { binaural: { hz: 2,  carrierHz: 180 }, drone: { type: 'tanpura' }, instrument: { type: 'bansuri' }, nature: { type: 'ocean'  }, solfeggio: { hz: 396 } }, layers: { binaural: { active: true,  volume: 0.80 }, drone: { active: true,  volume: 0.55 }, instrument: { active: true,  volume: 0.30 }, nature: { active: true,  volume: 0.55 }, solfeggio: { active: true,  volume: 0.28 } } } },
  { key: 'focus',    label: 'Deep Focus',  emoji: '🎯', desc: 'Alpha · 10Hz', color: '#0CA678',
    mix: { intention: 'focus',    settings: { binaural: { hz: 10, carrierHz: 220 }, drone: { type: 'shruti'  }, instrument: { type: 'sitar'   }, nature: { type: 'forest' }, solfeggio: { hz: 528 } }, layers: { binaural: { active: true,  volume: 0.75 }, drone: { active: true,  volume: 0.45 }, instrument: { active: false, volume: 0    }, nature: { active: true,  volume: 0.40 }, solfeggio: { active: true,  volume: 0.30 } } } },
  { key: 'heal',     label: 'Healing',     emoji: '💚', desc: 'Theta · 6Hz',  color: '#E64980',
    mix: { intention: 'heal',     settings: { binaural: { hz: 6,  carrierHz: 200 }, drone: { type: 'bowl'    }, instrument: { type: 'bansuri' }, nature: { type: 'rain'   }, solfeggio: { hz: 528 } }, layers: { binaural: { active: true,  volume: 0.75 }, drone: { active: true,  volume: 0.60 }, instrument: { active: true,  volume: 0.35 }, nature: { active: true,  volume: 0.50 }, solfeggio: { active: true,  volume: 0.40 } } } },
  { key: 'energize', label: 'Morning',     emoji: '☀️', desc: 'Beta · 16Hz',  color: '#F59F00',
    mix: { intention: 'energize', settings: { binaural: { hz: 16, carrierHz: 250 }, drone: { type: 'shruti'  }, instrument: { type: 'tabla'   }, nature: { type: 'wind'   }, solfeggio: { hz: 417 } }, layers: { binaural: { active: true,  volume: 0.70 }, drone: { active: true,  volume: 0.40 }, instrument: { active: true,  volume: 0.50 }, nature: { active: true,  volume: 0.45 }, solfeggio: { active: false, volume: 0    } } } },
  { key: 'meditate', label: 'Meditation',  emoji: '🧘', desc: 'Theta · 7Hz',  color: '#7048E8',
    mix: { intention: 'meditate', settings: { binaural: { hz: 7,  carrierHz: 210 }, drone: { type: 'om'      }, instrument: { type: 'sarod'   }, nature: { type: 'river'  }, solfeggio: { hz: 852 } }, layers: { binaural: { active: true,  volume: 0.70 }, drone: { active: true,  volume: 0.65 }, instrument: { active: true,  volume: 0.30 }, nature: { active: true,  volume: 0.45 }, solfeggio: { active: true,  volume: 0.35 } } } },
];

const SOLFEGGIO_GROUPS = [
  { label: 'Grounding',  freqs: [{ hz: 174, name: 'Pain relief'    }, { hz: 285, name: 'Tissue healing' }, { hz: 396, name: 'Release fear'  }] },
  { label: 'Healing',    freqs: [{ hz: 417, name: 'Embrace change' }, { hz: 528, name: 'DNA repair'     }, { hz: 639, name: 'Relationships' }] },
  { label: 'Awakening',  freqs: [{ hz: 741, name: 'Intuition'      }, { hz: 852, name: 'Spiritual'      }, { hz: 963, name: 'Crown chakra'  }] },
];

interface SavedMix { id: string; name: string; created: string; settings?: string; volumes?: string; }
interface LayerState { volume: number; pan: number; mute: boolean; solo: boolean; eq: { bass: number; mid: number; treble: number }; reverb: number; active: boolean; }

// ── Sub-components ────────────────────────────────────────────────────────────

function GenerateOrb({ color, size = 100 }: { color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 38% 35%, ${color}55, ${color}11 60%, transparent)`, boxShadow: `0 0 48px ${color}55`, animation: 'stGenPulse 1.6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 8,  borderRadius: '50%', border: `1.5px solid ${color}55`, animation: 'stGenSpin 3s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: `1px solid ${color}30`,   animation: 'stGenSpin 5s linear infinite reverse' }} />
      <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 14px ${color}` }} />
    </div>
  );
}

function LayerCard({
  name, layer, onVolume, onMute, onActive, onReverb,
  options, currentOption, onOption,
}: {
  name: string; layer: LayerState;
  onVolume?: (v: number) => void; onMute?: () => void;
  onActive?: (v: boolean) => void; onReverb?: (v: number) => void;
  options?: (string | number)[]; currentOption?: string | number;
  onOption?: (v: string) => void;
}) {
  const meta = LAYER_META[name] || { label: name, emoji: '🎛', color: '#7048E8', desc: '' };
  const volPct = `${layer.volume * 100}%`;
  const verbPct = `${layer.reverb * 100}%`;

  return (
    <div
      className={`lc-card ${layer.active ? 'active' : ''} ${layer.mute ? 'muted' : ''}`}
      style={{ '--lc': meta.color } as React.CSSProperties}
    >
      {/* Active accent bar */}
      <div className="lc-bar" />

      {/* Header */}
      <div className="lc-head">
        <span className="lc-emoji">{meta.emoji}</span>
        <div className="lc-info">
          <div className="lc-name">{meta.label}</div>
          <div className="lc-desc">{meta.desc}</div>
        </div>
        <button className={`lc-power ${layer.active ? 'on' : ''}`} onClick={() => onActive?.(!layer.active)}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Volume */}
      <div className="lc-vol-row">
        <input
          type="range" min="0" max="1" step="0.01"
          value={layer.volume}
          onChange={e => onVolume?.(parseFloat(e.target.value))}
          className="lc-range"
          style={{ '--rp': volPct, '--rc': meta.color } as React.CSSProperties}
          disabled={!layer.active}
        />
        <span className="lc-vol-num">{Math.round(layer.volume * 100)}</span>
      </div>

      {/* Sound type + mute */}
      <div className="lc-foot">
        {options && options.length > 0 && (
          <select
            className="lc-select"
            value={currentOption}
            onChange={e => onOption?.(e.target.value)}
          >
            {options.map(o => (
              <option key={o} value={o}>
                {typeof o === 'number' ? `${o}Hz` : o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        )}
        <button className={`lc-mute ${layer.mute ? 'on' : ''}`} onClick={() => onMute?.()}>M</button>
      </div>

      {/* Reverb send */}
      <div className="lc-verb-row">
        <span className="lc-verb-lbl">Reverb</span>
        <input
          type="range" min="0" max="1" step="0.01"
          value={layer.reverb}
          onChange={e => onReverb?.(parseFloat(e.target.value))}
          className="lc-range lc-range-sm"
          style={{ '--rp': verbPct, '--rc': `${meta.color}99` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const engine = useSoundEngine();
  const { isAuthenticated, token } = useAuth();
  const { success, error } = useToast();

  const [generating,   setGenerating]   = useState(false);
  const [genPreset,    setGenPreset]    = useState<typeof GEN_PRESETS[0] | null>(null);
  const [genDone,      setGenDone]      = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSave,     setShowSave]     = useState(false);
  const [mixName,      setMixName]      = useState('');
  const [savedMixes,   setSavedMixes]   = useState<SavedMix[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [showLib,      setShowLib]      = useState(false);

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
        body: JSON.stringify({ prompt: preset.key === 'custom' ? preset.desc : `Generate a ${preset.label} meditation soundscape` }),
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
    success(`${preset.label} soundscape generated ✨`);
  };

  const handleCustomGenerate = () => {
    if (!customPrompt.trim() || generating) return;
    handleGenerate({
      key: 'custom', label: 'Custom', emoji: '✦', desc: customPrompt, color: '#7048E8',
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
      success('Mix saved!');
      setShowSave(false); setMixName('');
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
      success(`Loaded: ${mix.name}`);
      setShowLib(false);
    } catch {
      error('Failed to load mix: invalid settings data.');
    }
  };

  const handleDeleteMix = async (id: string) => {
    await fetch(`/api/mixes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSavedMixes(m => m.filter(x => x.id !== id));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="dashboard">

        {/* ══════════════════════════════════════════════════════════
            ZONE 1 · Transport / Now Playing
        ══════════════════════════════════════════════════════════ */}
        <div className="st-hero" style={{ '--hero-c': bwColor } as React.CSSProperties}>
          <div className="st-hero-glow" />

          {/* Brainwave label */}
          <div className="st-bw-pill" style={{ background: `${bwColor}18`, color: bwColor, border: `1px solid ${bwColor}35` }}>
            <span className="st-bw-dot" style={{ background: bwColor }} />
            <span>{engine.brainwave}</span>
          </div>

          {/* Play orb */}
          <button
            className={`st-play-orb ${engine.isPlaying ? 'playing' : ''}`}
            style={{
              '--orb-c': bwColor,
              background:   engine.isPlaying ? bwColor : 'var(--bg2)',
              borderColor:  engine.isPlaying ? bwColor : 'var(--border)',
              boxShadow:    engine.isPlaying ? `0 8px 32px ${bwColor}50` : 'var(--shadow)',
            } as React.CSSProperties}
            onClick={engine.togglePlay}
            aria-label={engine.isPlaying ? 'Pause' : 'Play'}
          >
            {engine.isPlaying
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill={engine.isPlaying ? 'white' : 'var(--ink2)'}><path d="M8 5v14l11-7z"/></svg>
            }
          </button>

          {/* Brainwave description */}
          <div className="st-bw-desc">{BW_DESC[engine.brainwave]}</div>

          {/* Raga */}
          {engine.ragaName && <div className="st-raga">♪ {engine.ragaName}</div>}

          {/* Spectrum (only when playing) */}
          {engine.isPlaying && (
            <div className="st-spectrum">
              <SpectrumAnalyser analyser={engine.analyser} isPlaying={engine.isPlaying} height={48} />
            </div>
          )}

          {/* Master volume */}
          <div className="st-vol-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={bwColor} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <input
              type="range" min="0" max="1" step="0.01"
              value={engine.masterVol}
              onChange={e => engine.setMasterVolume(parseFloat(e.target.value))}
              className="st-hero-vol-range"
              style={{ '--vp': `${engine.masterVol * 100}%`, '--vc': bwColor } as React.CSSProperties}
            />
            <span className="st-vol-val">{Math.round(engine.masterVol * 100)}%</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 2 · Generate Soundscape
        ══════════════════════════════════════════════════════════ */}
        <div className="st-gen-card">
          {/* Header */}
          <div className="st-gen-head">
            <div className="st-gen-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div>
              <div className="st-gen-title">Generate Soundscape</div>
              <div className="st-gen-sub">AI-composed · ready in seconds</div>
            </div>
          </div>

          {/* Preset tiles — horizontal scroll */}
          <div className="st-preset-row">
            {GEN_PRESETS.map(p => (
              <button
                key={p.key}
                className={`st-preset-tile ${engine.intention === p.key ? 'active' : ''}`}
                style={{ '--pt-c': p.color } as React.CSSProperties}
                onClick={() => !generating && handleGenerate(p)}
                disabled={generating}
              >
                <span className="spt-emoji">{p.emoji}</span>
                <span className="spt-label">{p.label}</span>
                <span className="spt-desc">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Custom prompt */}
          <div className="st-gen-custom">
            <input
              className="gen-input"
              placeholder="Or describe your ideal soundscape…"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomGenerate()}
              disabled={generating}
            />
            <button
              className="st-gen-send"
              onClick={handleCustomGenerate}
              disabled={!customPrompt.trim() || generating}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 3a · Layers (horizontal swipe cards)
        ══════════════════════════════════════════════════════════ */}
        <div>
          <div className="section-title">Layers</div>
          <div className="st-layers-row">
            {(['binaural', 'drone', 'instrument', 'nature', 'solfeggio'] as const).map(name => (
              <LayerCard
                key={name}
                name={name}
                layer={(engine.layers as Record<string, LayerState>)[name]}
                options={(LAYER_OPTIONS as Record<string, (string | number)[]>)[name]}
                currentOption={currentOption(name)}
                onOption={v  => handleOption(name, v)}
                onVolume={v  => engine.setLayerVolume(name, v)}
                onMute={()   => engine.toggleMute(name)}
                onReverb={v  => engine.setLayerReverb(name, v)}
                onActive={v  => engine.setLayerActive(name, v)}
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 3b · Intention
        ══════════════════════════════════════════════════════════ */}
        <div className="studio-card">
          <div className="section-title">Intention</div>
          <div className="st-intent-grid">
            {Object.entries(INTENTIONS).map(([key, p]) => (
              <button
                key={key}
                className={`st-intent-tile ${engine.intention === key ? 'active' : ''}`}
                onClick={() => engine.applyIntention(key)}
              >
                <span className="sit-emoji">{p.emoji}</span>
                <span className="sit-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 4 · Fine Tune (BPM + Chaos)
        ══════════════════════════════════════════════════════════ */}
        <div className="studio-card">
          <div className="section-title">Fine Tune</div>
          <div className="st-tune-grid">

            {/* BPM */}
            <div className="st-tune-block">
              <div className="st-tune-hd">
                <span className="st-tune-lbl">BPM</span>
                <span className="st-tune-val" style={{ color: bwColor }}>{engine.bpm}</span>
              </div>
              <input
                type="range" min="40" max="180" step="1"
                value={engine.bpm}
                onChange={e => engine.setBpm(Number(e.target.value))}
                className="st-tune-range"
                style={{ '--tv': `${((engine.bpm - 40) / 140) * 100}%`, '--tc': bwColor } as React.CSSProperties}
              />
              <button className="st-tap-btn" onClick={handleTapTempo}>Tap Tempo</button>
            </div>

            {/* Chaos */}
            <div className="st-tune-block">
              <div className="st-tune-hd">
                <span className="st-tune-lbl">Chaos</span>
                <span className="st-tune-val" style={{ color: bwColor }}>{Math.round(engine.chaos * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={engine.chaos}
                onChange={e => engine.setChaos(parseFloat(e.target.value))}
                className="st-tune-range"
                style={{ '--tv': `${engine.chaos * 100}%`, '--tc': bwColor } as React.CSSProperties}
              />
              <div className="st-chaos-desc">
                {engine.chaos < 0.2 ? 'Ordered · predictable' : engine.chaos < 0.5 ? 'Balanced · dynamic' : engine.chaos < 0.75 ? 'Wild · unpredictable' : 'Chaotic · raw'}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 5 · Solfeggio Frequencies
        ══════════════════════════════════════════════════════════ */}
        <div className="studio-card">
          <div className="section-title">Solfeggio Frequencies</div>
          <div className="st-sol-groups">
            {SOLFEGGIO_GROUPS.map(group => (
              <div key={group.label} className="st-sol-group">
                <div className="st-sol-group-lbl">{group.label}</div>
                <div className="st-sol-row">
                  {group.freqs.map(f => (
                    <button
                      key={f.hz}
                      className={`st-sol-chip ${engine.settings.solfeggio.hz === f.hz ? 'active' : ''}`}
                      onClick={() => engine.updateLayerSetting('solfeggio', 'hz', f.hz)}
                    >
                      <span className="ssc-hz">{f.hz}Hz</span>
                      <span className="ssc-name">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 6 · Library (save / load)
        ══════════════════════════════════════════════════════════ */}
        {isAuthenticated && (
          <div className="studio-card">
            <div className="section-title">My Mixes</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSave(true)}>Save Current</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleOpenLib}>Load Mix</button>
            </div>
          </div>
        )}

      </div>

      {/* ══ Generation overlay ══════════════════════════════════ */}
      {generating && genPreset && (
        <div className="st-gen-overlay">
          <GenerateOrb color={genPreset.color} />
          <div style={{ textAlign: 'center', animation: 'stGenSlide 0.4s ease both' }}>
            <div className="st-gen-overlay-title">
              {genDone ? 'Ready ✨' : `Composing ${genPreset.label}…`}
            </div>
            <div className="st-gen-overlay-sub">
              {genDone ? 'Starting playback' : 'Weaving binaural beats, drone harmonics\nand sacred frequencies'}
            </div>
          </div>
          {!genDone && (
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: genPreset.color, opacity: 0.35, animation: `stGenPulse 1.2s ease-in-out ${i * 0.25}s infinite` }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Save modal ══════════════════════════════════════════ */}
      {showSave && (
        <div className="modal-overlay" onClick={() => setShowSave(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, marginBottom: 16 }}>Save Mix</h3>
            <div className="form-group">
              <label className="form-label">Mix Name</label>
              <input type="text" placeholder="e.g. Sunday Deep Sleep…" value={mixName} onChange={e => setMixName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn-primary"   style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Load modal ══════════════════════════════════════════ */}
      {showLib && (
        <div className="modal-overlay" onClick={() => setShowLib(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, marginBottom: 16 }}>Saved Mixes</h3>
            {savedMixes.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--ink3)', textAlign: 'center', padding: '20px 0' }}>No saved mixes yet.</p>
              : savedMixes.map(mix => (
                <div key={mix.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink1)' }}>{mix.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{new Date(mix.created).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => handleLoadMix(mix)}>Load</button>
                  <button className="btn-ghost"     style={{ padding: '6px 10px', fontSize: 12, color: '#C0392B' }} onClick={() => handleDeleteMix(mix.id)}>✕</button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </>
  );
}
