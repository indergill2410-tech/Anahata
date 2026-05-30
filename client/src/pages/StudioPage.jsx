import React, { useState } from 'react';
import {
  useSoundEngine,
  INTENTIONS,
  DRONE_OPTIONS,
  INSTRUMENT_OPTIONS,
  NATURE_OPTIONS,
  SOLFEGGIO_OPTIONS,
  BINAURAL_PRESETS,
  BW_FOR_HZ,
} from '../context/SoundEngineContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BW_COLOUR = {
  Delta: '#818cf8', Theta: '#a78bfa', Alpha: '#34d399', Beta: '#60a5fa', Gamma: '#fbbf24',
};

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2,'0')}s`;
}

// ── Vertical Fader ──────────────────────────────────────────────────────────
function Fader({ label, colour, volume, onVolume, options, value, onValue, active, onToggle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, flex: 1, minWidth: 0,
    }}>
      {/* Active dot */}
      <div
        onClick={onToggle}
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: active && volume > 0 ? colour : 'var(--bg-3)',
          boxShadow: active && volume > 0 ? `0 0 8px ${colour}` : 'none',
          cursor: 'pointer', transition: 'all 0.3s ease',
          border: `1px solid ${active ? colour + '60' : 'var(--border)'}`,
        }}
      />

      {/* Vertical slider */}
      <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="range" min="0" max="1" step="0.02"
          value={volume}
          onChange={e => onVolume(parseFloat(e.target.value))}
          className="fader-vertical"
          style={{ '--fader-colour': colour }}
        />
      </div>

      {/* Vol % */}
      <span style={{ fontSize: 10, color: volume > 0 ? colour : 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(volume * 100)}
      </span>

      {/* Option dropdown */}
      {options && options.length > 0 && (
        <select
          value={value || ''}
          onChange={e => onValue(e.target.value)}
          style={{
            background: 'var(--bg-2)', border: `1px solid ${active ? colour + '40' : 'var(--border)'}`,
            color: 'var(--t2)', borderRadius: 6, padding: '3px 4px',
            fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
            maxWidth: '100%', textAlign: 'center',
          }}
        >
          <option value="">off</option>
          {options.map(o => (
            <option key={o.toString()} value={o.toString()}>
              {typeof o === 'number' ? `${o}Hz` : o}
            </option>
          ))}
        </select>
      )}

      {/* Label */}
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t3)', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

// ── Binaural Fader (special — has hz presets) ───────────────────────────────
function BinauralFader({ volume, onVolume, hz, carrier, onPreset }) {
  const bw     = BW_FOR_HZ(hz);
  const colour = BW_COLOUR[bw] || '#8b6fff';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: volume > 0 ? colour : 'var(--bg-3)',
        boxShadow: volume > 0 ? `0 0 8px ${colour}` : 'none',
        border: `1px solid ${colour}60`,
      }} />
      <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="range" min="0" max="1" step="0.02"
          value={volume}
          onChange={e => onVolume(parseFloat(e.target.value))}
          className="fader-vertical"
          style={{ '--fader-colour': colour }}
        />
      </div>
      <span style={{ fontSize: 10, color: colour, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(volume * 100)}
      </span>
      <select
        value={`${hz}_${carrier}`}
        onChange={e => {
          const [h, c] = e.target.value.split('_').map(Number);
          onPreset(h, c);
        }}
        style={{
          background: 'var(--bg-2)', border: `1px solid ${colour}40`,
          color: 'var(--t2)', borderRadius: 6, padding: '3px 4px',
          fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
          maxWidth: '100%', textAlign: 'center',
        }}
      >
        {BINAURAL_PRESETS.map(p => (
          <option key={p.label} value={`${p.hz}_${p.carrier}`}>{p.label}</option>
        ))}
      </select>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t3)', display: 'block' }}>
          Binaural
        </span>
        <span style={{ fontSize: 9, color: colour }}>{bw}</span>
      </div>
    </div>
  );
}

// ── Save Mix Modal ──────────────────────────────────────────────────────────
function SaveMixModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 340, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16 }}>Save Mix</h2>
        <input
          className="form-input"
          placeholder="Mix name (e.g. Deep Sleep)"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, height: 40 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary" style={{ flex: 1, height: 40 }}
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
          >Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Studio Page ────────────────────────────────────────────────────────
export default function StudioPage() {
  const engine = useSoundEngine();
  const { isAuthenticated, authFetch } = useAuth();
  const { success, error } = useToast();
  const [showSave,    setShowSave]    = useState(false);
  const [savedMixes,  setSavedMixes]  = useState([]);
  const [showMixes,   setShowMixes]   = useState(false);
  const [loadingMixes, setLoadingMixes] = useState(false);

  const bw     = BW_FOR_HZ(engine.settings.binaural.hz);
  const colour = BW_COLOUR[bw] || '#8b6fff';

  async function saveMix(name) {
    try {
      const res = await authFetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, settings: engine.settings, volumes: engine.volumes }),
      });
      if (!res.ok) throw new Error('Save failed');
      success(`"${name}" saved 🎛️`);
      setShowSave(false);
    } catch (e) { error(e.message); }
  }

  async function loadMixes() {
    setLoadingMixes(true);
    setShowMixes(true);
    try {
      const res  = await authFetch('/api/mixes');
      const data = await res.json();
      setSavedMixes(data.mixes || []);
    } catch {}
    setLoadingMixes(false);
  }

  async function deleteMix(id) {
    await authFetch(`/api/mixes/${id}`, { method: 'DELETE' });
    setSavedMixes(m => m.filter(x => x.id !== id));
  }

  function loadMix(mix) {
    engine.start(mix.settings, mix.volumes);
    setShowMixes(false);
    success(`Loaded "${mix.name}" 🎵`);
  }

  return (
    <div className="dashboard fade-in" style={{ paddingTop: 4 }}>
      {showSave && <SaveMixModal onSave={saveMix} onClose={() => setShowSave(false)} />}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, letterSpacing: '-0.02em' }}>Sound Studio</h2>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            {engine.isPlaying ? `▶ Playing · ${fmtTime(engine.elapsed)}` : 'Build your perfect soundscape'}
          </p>
        </div>
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" style={{ height: 34, padding: '0 12px', fontSize: 12 }} onClick={loadMixes}>
              Load
            </button>
            <button
              className="btn btn-ghost" style={{ height: 34, padding: '0 12px', fontSize: 12 }}
              onClick={() => engine.isPlaying ? setShowSave(true) : engine.start()}
            >
              {engine.isPlaying ? 'Save' : 'Start'}
            </button>
          </div>
        )}
      </div>

      {/* ── Intention quick-pick ─────────────────────────────── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
          Quick Generate
        </p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {Object.entries(INTENTIONS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => engine.applyIntention(key)}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: engine.intention === key ? `${colour}18` : 'var(--bg-2)',
                border: `1px solid ${engine.intention === key ? colour + '50' : 'var(--border)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 20 }}>{val.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: engine.intention === key ? colour : 'var(--t2)' }}>
                {val.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Mixer ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="card-label">Mixer</span>
          {engine.isPlaying ? (
            <button
              onClick={engine.togglePlay}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--red)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Pause
            </button>
          ) : (
            <button
              onClick={() => engine.start()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(109,74,255,0.15)', border: '1px solid rgba(109,74,255,0.4)',
                color: colour, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Play
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {/* Binaural */}
          <BinauralFader
            volume={engine.volumes.binaural}
            onVolume={v => engine.setLayerVolume('binaural', v)}
            hz={engine.settings.binaural.hz}
            carrier={engine.settings.binaural.carrier}
            onPreset={(hz, carrier) => engine.updateLayerSetting('binaural', { hz, carrier })}
          />

          {/* Drone */}
          <Fader
            label="Drone"
            colour="#a78bfa"
            volume={engine.volumes.drone}
            onVolume={v => engine.setLayerVolume('drone', v)}
            options={DRONE_OPTIONS}
            value={engine.settings.drone.type}
            onValue={type => engine.updateLayerSetting('drone', { type })}
            active={engine.volumes.drone > 0}
            onToggle={() => engine.setLayerVolume('drone', engine.volumes.drone > 0 ? 0 : 0.6)}
          />

          {/* Instrument */}
          <Fader
            label="Instrument"
            colour="#34d399"
            volume={engine.volumes.instrument}
            onVolume={v => engine.setLayerVolume('instrument', v)}
            options={INSTRUMENT_OPTIONS}
            value={engine.settings.instrument.type}
            onValue={type => engine.updateLayerSetting('instrument', { type })}
            active={engine.volumes.instrument > 0}
            onToggle={() => engine.setLayerVolume('instrument', engine.volumes.instrument > 0 ? 0 : 0.4)}
          />

          {/* Nature */}
          <Fader
            label="Nature"
            colour="#60a5fa"
            volume={engine.volumes.nature}
            onVolume={v => engine.setLayerVolume('nature', v)}
            options={NATURE_OPTIONS}
            value={engine.settings.nature.type}
            onValue={type => engine.updateLayerSetting('nature', { type })}
            active={engine.volumes.nature > 0}
            onToggle={() => engine.setLayerVolume('nature', engine.volumes.nature > 0 ? 0 : 0.45)}
          />

          {/* Solfeggio */}
          <Fader
            label="Solfeggio"
            colour="#fbbf24"
            volume={engine.volumes.solfeggio}
            onVolume={v => engine.setLayerVolume('solfeggio', v)}
            options={SOLFEGGIO_OPTIONS}
            value={engine.settings.solfeggio.hz?.toString()}
            onValue={hz => engine.updateLayerSetting('solfeggio', { hz: parseInt(hz) })}
            active={engine.volumes.solfeggio > 0}
            onToggle={() => engine.setLayerVolume('solfeggio', engine.volumes.solfeggio > 0 ? 0 : 0.3)}
          />
        </div>

        {/* 🎧 note */}
        <p style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginTop: 14 }}>
          🎧 Headphones required for binaural effect
        </p>
      </div>

      {/* ── Saved Mixes ─────────────────────────────────────── */}
      {showMixes && (
        <div className="card">
          <div className="card-header">
            <span className="card-label">Saved Mixes</span>
            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setShowMixes(false)}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {loadingMixes ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div className="spinner" />
            </div>
          ) : savedMixes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '16px 0' }}>
              No saved mixes yet. Build one above and save it!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {savedMixes.map(mix => (
                <div key={mix.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{mix.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                      {BW_FOR_HZ(mix.settings?.binaural?.hz || 7)} · {mix.settings?.binaural?.hz || 7}Hz
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => loadMix(mix)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'var(--accent-low)', border: '1px solid rgba(109,74,255,0.3)', color: 'var(--accent-hi)', cursor: 'pointer' }}
                    >Load</button>
                    <button
                      onClick={() => deleteMix(mix.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--red)', cursor: 'pointer' }}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Frequency guide ──────────────────────────────────── */}
      <div className="card">
        <p className="card-label" style={{ marginBottom: 12 }}>Frequency Guide</p>
        {[
          { bw: 'Delta',  hz: '0.5–4Hz',  use: 'Deep sleep · healing · unconscious mind',  colour: '#818cf8' },
          { bw: 'Theta',  hz: '4–8Hz',    use: 'Meditation · creativity · REM',             colour: '#a78bfa' },
          { bw: 'Alpha',  hz: '8–14Hz',   use: 'Relaxed focus · calm alertness',            colour: '#34d399' },
          { bw: 'Beta',   hz: '14–30Hz',  use: 'Active focus · problem solving',            colour: '#60a5fa' },
          { bw: 'Gamma',  hz: '30–100Hz', use: 'Peak insight · spiritual states',           colour: '#fbbf24' },
        ].map(row => (
          <div key={row.bw} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: row.colour, width: 40, letterSpacing: '0.06em' }}>{row.bw}</span>
            <span style={{ fontSize: 10, color: 'var(--t3)', width: 52 }}>{row.hz}</span>
            <span style={{ fontSize: 11, color: 'var(--t2)' }}>{row.use}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
