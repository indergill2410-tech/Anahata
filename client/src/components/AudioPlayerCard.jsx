import React, { useEffect, useRef, useState } from 'react';

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function AudioPlayerCard({ audioUrl, isLoading, musicParams }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(120);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [audioUrl]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  const progress = duration ? (current / duration) * 100 : 0;

  const trackName = musicParams
    ? `${musicParams.desiredBrainwaveState} — ${musicParams.musicalTempo} BPM Healing Passage`
    : 'Generating composition…';

  return (
    <div className="card audio-card">
      <div className="card-header">
        <span className="card-label">Now Playing</span>
        {isLoading && (
          <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>WAITING FOR DATA</span>
        )}
      </div>

      <p className="audio-track-name">{trackName}</p>
      <p className="audio-track-meta">
        {musicParams ? `${musicParams.binauralHz}Hz binaural · ${musicParams.emotionalTone}` : 'Mozart-inspired classical'}
      </p>

      <div className="audio-controls">
        <button className="play-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
        </button>

        <div className="progress-bar-wrap">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-times">
            <span>{fmtTime(current)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        loop
        preload="none"
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
