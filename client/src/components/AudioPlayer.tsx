import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioData: { url?: string };
  musicParams?: { desiredBrainwaveState?: string; musicalTempo?: number; binauralHz?: number };
}

export default function AudioPlayer({ audioData, musicParams }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Cross-fade when a new audio URL arrives
  useEffect(() => {
    if (audioRef.current && audioData.url) {
      audioRef.current.src = audioData.url;
      audioRef.current.play().catch(() => {
        // Autoplay may be blocked — user interaction needed
        console.warn('[Audio] Autoplay blocked. User must interact.');
      });
    }
  }, [audioData.url]);

  return (
    <div className="card">
      <h2>Now Playing</h2>
      <div className="audio-player">
        {musicParams && (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px', fontSize: '0.9rem' }}>
            {musicParams.desiredBrainwaveState} meditation · {musicParams.musicalTempo} BPM · {musicParams.binauralHz}Hz binaural
          </p>
        )}
        <audio ref={audioRef} controls loop preload="none">
          <source src={audioData.url} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}
