import React, { useEffect, useRef, useState } from 'react';

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function TrackPlayer({ track, onClose }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(track.duration || 660);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [track.url]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div style={{
      position:'fixed', bottom:72, left:0, right:0, zIndex:200,
      padding:'0 16px', maxWidth:480, margin:'0 auto'
    }}>
      <div style={{
        background:'rgba(14,14,26,0.96)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        border:'1px solid rgba(109,74,255,0.3)',
        borderRadius:'var(--r-xl)',
        padding:'16px 18px',
        boxShadow:'0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(109,74,255,0.1)'
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ minWidth:0, flex:1, marginRight:12 }}>
            <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {track.title}
            </p>
            <p style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
              {track.category}
              {track.binauralHz ? ` · ${track.binauralHz}Hz binaural` : ''}
              {` · ${Math.round(track.duration/60)}min`}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Controls + Progress */}
        <div className="audio-controls">
          <button className="play-btn" onClick={togglePlay} aria-label={playing ? 'Pause':'Play'}>
            {playing
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <div className="progress-bar-wrap">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width:`${progress}%` }} />
            </div>
            <div className="progress-times">
              <span>{fmtTime(current)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
        </div>

        <audio ref={audioRef} loop preload="none"
          onTimeUpdate={e => setCurrent(e.target.currentTime)}
          onLoadedMetadata={e => setDuration(e.target.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>
    </div>
  );
}
