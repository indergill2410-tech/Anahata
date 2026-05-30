import React, { useState } from 'react';
import KnobControl from './KnobControl';

const LAYER_META = {
  binaural:   { label: 'Binaural', color: '#4A7FA5', emoji: '🧠' },
  drone:      { label: 'Drone',    color: '#9B6B9A', emoji: '🎵' },
  instrument: { label: 'Instrum.', color: '#C4613A', emoji: '🎸' },
  nature:     { label: 'Nature',   color: '#7B8B5E', emoji: '🌿' },
  solfeggio:  { label: 'Solfeg.',  color: '#D4A853', emoji: '✨' },
};

export default function LayerChannel({ name, layer, onVolume, onPan, onMute, onSolo, onReverb, onEQ, onActive, options, currentOption, onOption }) {
  const [showEQ, setShowEQ] = useState(false);
  const meta  = LAYER_META[name] || { label: name, color: 'var(--accent)', emoji: '🎛' };
  const isMuted  = layer.mute;
  const isSoloed = layer.solo;

  return (
    <div className={`layer-channel ${layer.active ? 'active' : ''} ${isSoloed ? 'soloed' : ''} ${isMuted ? 'muted' : ''}`}>
      {/* Header: emoji + active toggle */}
      <button
        onClick={() => onActive?.(!layer.active)}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: layer.active ? meta.color : 'var(--bg-2)',
          border: `2px solid ${layer.active ? meta.color : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {meta.emoji}
      </button>

      {/* Mute / Solo */}
      <div className="channel-ms-row">
        <button className={`btn-mute ${isMuted ? 'on' : ''}`} onClick={() => onMute?.()}>M</button>
        <button className={`btn-solo ${isSoloed ? 'on' : ''}`} onClick={() => onSolo?.()}>S</button>
      </div>

      {/* VU meter + fader side by side */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
        <VUMeter value={layer.active && !isMuted ? layer.volume : 0} />
        <input
          type="range" min="0" max="1" step="0.01"
          value={layer.volume}
          onChange={e => onVolume?.(parseFloat(e.target.value))}
          className="fader-vertical"
          style={{ opacity: isMuted ? 0.4 : 1 }}
        />
      </div>

      {/* Reverb send knob */}
      <div className="channel-send-row">
        <KnobControl
          value={layer.reverb} min={0} max={1} size={28}
          color={meta.color}
          onChange={v => onReverb?.(v)}
        />
        <span className="send-label">Verb</span>
      </div>

      {/* Pan knob */}
      <div className="channel-send-row">
        <KnobControl
          value={(layer.pan + 1) / 2} min={0} max={1} size={28}
          color={meta.color}
          onChange={v => onPan?.(v * 2 - 1)}
        />
        <span className="send-label">Pan</span>
      </div>

      {/* EQ toggle */}
      <button
        onClick={() => setShowEQ(v => !v)}
        style={{
          fontSize: 8, padding: '2px 6px', borderRadius: 4,
          border: `1px solid ${showEQ ? meta.color : 'var(--border)'}`,
          background: showEQ ? `${meta.color}15` : 'transparent',
          color: showEQ ? meta.color : 'var(--t4)',
          cursor: 'pointer', fontWeight: 700, letterSpacing: '0.05em',
          fontFamily: 'inherit',
        }}
      >EQ</button>

      {showEQ && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['bass','mid','treble'].map(band => (
            <div key={band} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 7, color: 'var(--t4)', width: 18, textTransform: 'uppercase' }}>{band[0]}</span>
              <input type="range" min="-12" max="12" step="0.5"
                value={layer.eq[band]}
                onChange={e => onEQ?.(band, parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: meta.color, height: 3 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Type selector */}
      {options && options.length > 0 && (
        <select
          value={currentOption}
          onChange={e => onOption?.(e.target.value)}
          className="channel-type-select"
        >
          {options.map(o => (
            <option key={o} value={o}>{typeof o === 'number' ? `${o}Hz` : o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      )}

      {/* Label */}
      <div className="channel-label" style={{ color: layer.active ? meta.color : 'var(--t4)' }}>
        {meta.label}
      </div>
    </div>
  );
}

function VUMeter({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 85 ? '#C0392B' : pct > 60 ? '#D4A853' : '#7B8B5E';
  return (
    <div className="vu-meter">
      <div className="vu-meter-fill" style={{ height: `${pct}%`, background: `linear-gradient(to top, ${color}, ${color}88)` }} />
    </div>
  );
}
