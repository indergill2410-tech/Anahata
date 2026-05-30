import React, { useEffect } from 'react';
import { useBinauralPlayer } from '../hooks/useBinauralPlayer';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const BW_COLOUR: Record<string, string> = {
  Delta: '#818cf8', Theta: '#a78bfa', Alpha: '#34d399',
  Beta: '#fbbf24', Gamma: '#f472b6'
};

interface TrackObj { id: string; title: string; brainwave?: string; binauralHz?: number; carrierHz?: number; duration?: number; }
interface TrackPlayerProps { track: TrackObj; onClose: () => void; }

export default function TrackPlayer({ track, onClose }: TrackPlayerProps) {
  const { isPlaying, elapsed, volume, play, toggle, stop, setVolume } = useBinauralPlayer();
  const duration = track.duration || 1800;
  const progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
  const bwColour = (track.brainwave && BW_COLOUR[track.brainwave]) || 'var(--accent-hi)';

  // Auto-start when track changes
  useEffect(() => {
    play(track as unknown as Parameters<typeof play>[0]);
    return () => stop();
  }, [track.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    stop();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 200,
      padding: '0 16px', maxWidth: 480, margin: '0 auto'
    }}>
      <div style={{
        background: 'rgba(14,14,26,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(109,74,255,0.3)',
        borderRadius: 'var(--r-xl)',
        padding: '16px 18px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(109,74,255,0.1)'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {track.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {track.brainwave && (
                <span style={{ fontSize: 10, fontWeight: 600, color: bwColour, letterSpacing: '0.06em' }}>
                  {track.brainwave}
                </span>
              )}
              {track.binauralHz && (
                <span style={{ fontSize: 10, color: 'var(--t3)' }}>{track.binauralHz}Hz binaural</span>
              )}
              {track.carrierHz && (
                <span style={{ fontSize: 10, color: 'var(--t3)' }}>· {track.carrierHz}Hz carrier</span>
              )}
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Headphones notice */}
        <p style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          🎧 <span>Use headphones for binaural effect</span>
        </p>

        {/* Controls + Progress */}
        <div className="audio-controls">
          <button className="play-btn" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>}
          </button>

          <div className="progress-bar-wrap">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: bwColour }} />
            </div>
            <div className="progress-times">
              <span>{fmtTime(elapsed)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Volume slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: bwColour, height: 3, cursor: 'pointer' }}
          />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
