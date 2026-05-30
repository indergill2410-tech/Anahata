import React from 'react';
import SpectrumAnalyser from './SpectrumAnalyser';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}

const BW_COLOR: Record<string, string> = { Delta:'#3B5BDB', Theta:'#7048E8', Alpha:'#0CA678', Beta:'#3B5BDB', Gamma:'#F59F00' };
const INTENTION_EMOJI: Record<string, string> = { sleep:'😴', focus:'🎯', heal:'💜', energize:'⚡', meditate:'🧘' };

interface NowPlayingBarProps {
  isPlaying: boolean;
  intention?: string | null;
  elapsed: number;
  brainwave?: string;
  bpm?: number;
  analyser?: AnalyserNode | null;
  onTogglePlay?: () => void;
}

export default function NowPlayingBar({ isPlaying, intention, elapsed, brainwave, bpm, analyser, onTogglePlay }: NowPlayingBarProps) {
  if (!isPlaying && elapsed === 0) return null;

  const color  = (brainwave && BW_COLOR[brainwave]) || 'var(--blue)';
  const emoji  = (intention && INTENTION_EMOJI[intention]) || '🎵';
  const label  = intention ? intention.charAt(0).toUpperCase() + intention.slice(1) : 'Custom';

  return (
    <div className="now-playing-bar">
      {/* Play/pause */}
      <button
        onClick={onTogglePlay}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--blue)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
          boxShadow: '0 4px 14px rgba(59,91,219,0.35)',
        }}
      >
        {isPlaying
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>

      {/* Emoji + labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>{emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink1)' }}>{label}</span>
          <span className="badge" style={{ background: `${color}18`, color, borderColor: `${color}40`, padding: '1px 7px', fontSize: 9 }}>
            {brainwave}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--ink3)', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fmtTime(elapsed)}</span>
          <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{bpm} BPM</span>
        </div>
      </div>

      {/* Spectrum */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <SpectrumAnalyser analyser={analyser} isPlaying={isPlaying} height={32} />
      </div>
    </div>
  );
}
