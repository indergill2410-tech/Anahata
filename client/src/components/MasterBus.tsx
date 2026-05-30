import React, { useRef } from 'react';
import KnobControl from './KnobControl';

interface MasterBusProps {
  bpm: number;
  chaos: number;
  masterVol: number;
  onBpm?: (v: number) => void;
  onChaos?: (v: number) => void;
  onMasterVol?: (v: number) => void;
  isPlaying: boolean;
  onTogglePlay?: () => void;
  ragaName?: string;
}

export default function MasterBus({ bpm, chaos, masterVol, onBpm, onChaos, onMasterVol, isPlaying, onTogglePlay, ragaName }: MasterBusProps) {
  const tapTimesRef = useRef<number[]>([]);

  const handleTapTempo = () => {
    const now = Date.now();
    const taps = tapTimesRef.current;
    taps.push(now);
    if (taps.length > 4) taps.shift();
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpmVal = Math.round(60000 / avg);
      if (bpmVal >= 30 && bpmVal <= 200) onBpm?.(bpmVal);
    }
  };

  return (
    <div className="master-bus">
      {/* Play / stop */}
      <button
        onClick={onTogglePlay}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: isPlaying ? 'var(--accent)' : 'var(--bg-1)',
          border: `2px solid ${isPlaying ? 'var(--accent)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
          boxShadow: isPlaying ? 'var(--accent-glow)' : 'none',
        }}
      >
        {isPlaying
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--t2)"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>

      {/* Master volume */}
      <div className="master-knob-group">
        <KnobControl value={masterVol} min={0} max={1} size={40} color="var(--accent)" onChange={onMasterVol} />
        <span className="master-knob-label">Volume</span>
      </div>

      {/* BPM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>BPM</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{bpm}</span>
          <button className="tap-tempo-btn" onClick={handleTapTempo} style={{ marginLeft: 'auto' }}>Tap</button>
        </div>
        <input type="range" min="30" max="140" step="1"
          value={bpm}
          onChange={e => onBpm?.(parseInt(e.target.value))}
          style={{ accentColor: 'var(--accent)', width: '100%' }}
        />
      </div>

      {/* Chaos */}
      <div className="master-knob-group">
        <KnobControl value={chaos} min={0} max={1} size={40} color="#9B6B9A" onChange={onChaos} />
        <span className="master-knob-label">Chaos</span>
      </div>

      {/* Raga name */}
      {ragaName && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Raga</span>
          <span style={{ fontSize: 12, fontFamily: 'Lora, serif', color: 'var(--t2)', fontStyle: 'italic' }}>{ragaName}</span>
        </div>
      )}
    </div>
  );
}
