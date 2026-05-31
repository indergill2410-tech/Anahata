import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALBUMS, CATEGORIES, TOTAL_TRACKS, getAlbumsByCategory, Album, Track } from '../data/libraryData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDuration(s: string): number {
  if (s.includes('min')) return parseInt(s) * 60;
  if (s.includes('hr')) return parseInt(s) * 3600;
  const parts = s.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 300; // fallback 5min
}

function formatSecs(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// postMessage YT commands (works once iframe has loaded with enablejsapi=1)
function ytCmd(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*'
  );
}

// ─── AlbumOrb canvas ─────────────────────────────────────────────────────────
function AlbumOrb({ color, size, accent, animated = false, pulse = false }:
  { color: string; size: number; accent?: string; animated?: boolean; pulse?: boolean }) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const t   = useRef(0);

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    c.style.width = `${size}px`; c.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    const r = size / 2;

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const breathe  = animated ? 0.07 * Math.sin(t.current * 0.035) : 0;
      const pulsate  = pulse    ? 0.05 * Math.sin(t.current * 0.12)  : 0;
      const cr = r * (0.8 + breathe + pulsate);

      const g1 = ctx.createRadialGradient(r, r, cr * 0.3, r, r, cr * 1.6);
      g1.addColorStop(0, color + '55'); g1.addColorStop(1, color + '00');
      ctx.beginPath(); ctx.arc(r, r, cr * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = g1; ctx.fill();

      const shift = animated ? 0.1 * Math.sin(t.current * 0.022) : 0;
      const g2 = ctx.createRadialGradient(r - cr * (0.28 + shift), r - cr * 0.28, 0, r, r, cr);
      g2.addColorStop(0, accent || '#ffffff');
      g2.addColorStop(0.4, color);
      g2.addColorStop(0.75, color + 'BB');
      g2.addColorStop(1, color + '55');
      ctx.beginPath(); ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = g2; ctx.fill();

      const g3 = ctx.createRadialGradient(r - cr * 0.3, r - cr * 0.3, 0, r - cr * 0.15, r - cr * 0.15, cr * 0.6);
      g3.addColorStop(0, 'rgba(255,255,255,0.65)'); g3.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = g3; ctx.fill();

      if (animated || pulse) { t.current++; raf.current = requestAnimationFrame(draw); }
    }
    draw();
    return () => cancelAnimationFrame(raf.current);
  }, [color, size, accent, animated, pulse]);

  return <canvas ref={cvs} style={{ display: 'block', borderRadius: '50%', flexShrink: 0 }} />;
}

// ─── WaveVisualizer ──────────────────────────────────────────────────────────
function WaveVisualizer({ color, active }: { color: string; active: boolean }) {
  const bars = [3, 5, 8, 6, 9, 4, 7, 5, 8, 3, 6, 4, 7, 5, 9];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          height: active ? h * 2.5 : 4,
          background: active ? color : 'rgba(255,255,255,0.2)',
          animation: active ? `lib-wave ${0.5 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          transition: 'height 0.3s ease, background 0.3s',
        }} />
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [category,     setCategory]     = useState('All');
  const [openAlbum,    setOpenAlbum]    = useState<Album | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [elapsed,      setElapsed]      = useState(0);   // seconds
  const [shuffle,      setShuffle]      = useState(false);
  const [repeat,       setRepeat]       = useState(false);
  const [volume,       setVolume]       = useState(80);
  const [loading,      setLoading]      = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef  = useRef<Track[]>([]);
  const elapsedRef = useRef(0);       // mirror for timer closure
  const durationRef = useRef(0);      // current track duration in seconds
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const volumeRef = useRef(volume);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  repeatRef.current = repeat;
  shuffleRef.current = shuffle;
  volumeRef.current = volume;

  const filteredAlbums = getAlbumsByCategory(category);

  useEffect(() => () => {
    stopTimer();
    timeoutsRef.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const dur = durationRef.current;
      if (dur > 0) setProgress(elapsedRef.current / dur);
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= dur && dur > 0) {
        stopTimer();
        setIsPlaying(false);
        if (repeatRef.current) { restartCurrent(); }
        else { playNext(); }
      }
    }, 1000);
  }

  function restartCurrent() {
    if (!currentTrack || !currentAlbum) return;
    triggerPlay(currentTrack, currentAlbum, queueRef.current);
  }

  const triggerPlay = useCallback((track: Track, album: Album, queue: Track[]) => {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    queueRef.current = queue;
    setIsPlaying(true);
    setLoading(true);
    setProgress(0);
    setElapsed(0);
    elapsedRef.current = 0;
    const dur = parseDuration(track.duration);
    durationRef.current = dur;

    // Clear any pending unMute retries from previous track
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = `https://www.youtube.com/embed/${track.ytId}?autoplay=1&playsinline=1&enablejsapi=1&controls=0&rel=0&modestbranding=1&mute=0`;
      iframe.onload = () => {
        setLoading(false);
        startTimer();
        // YT enablejsapi initialises async — retry unMute+setVolume until it sticks
        timeoutsRef.current = [300, 700, 1200, 2000].map(delay =>
          setTimeout(() => {
            ytCmd(iframeRef.current, 'unMute', []);
            ytCmd(iframeRef.current, 'setVolume', [volumeRef.current]);
          }, delay)
        );
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function playTrack(track: Track, album: Album, queue?: Track[]) {
    triggerPlay(track, album, queue ?? album.tracks);
  }

  function togglePlay() {
    if (!currentTrack) return;
    if (isPlaying) {
      ytCmd(iframeRef.current, 'pauseVideo');
      stopTimer();
      setIsPlaying(false);
    } else {
      ytCmd(iframeRef.current, 'playVideo');
      startTimer();
      setIsPlaying(true);
    }
  }

  function playNext() {
    const q = queueRef.current;
    if (!currentTrack || !currentAlbum || q.length === 0) return;
    const idx = q.findIndex(t => t.id === currentTrack.id);
    if (shuffleRef.current) {
      triggerPlay(q[Math.floor(Math.random() * q.length)], currentAlbum, q);
    } else if (idx < q.length - 1) {
      triggerPlay(q[idx + 1], currentAlbum, q);
    }
  }

  function playPrev() {
    const q = queueRef.current;
    if (!currentTrack || !currentAlbum || q.length === 0) return;
    if (elapsedRef.current > 3) { restartCurrent(); return; }
    const idx = q.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) triggerPlay(q[idx - 1], currentAlbum, q);
  }

  function handleSeek(pct: number) {
    const dur = durationRef.current;
    const targetSec = Math.floor(dur * pct);
    ytCmd(iframeRef.current, 'seekTo', [targetSec, true]);
    elapsedRef.current = targetSec;
    setElapsed(targetSec);
    setProgress(pct);
    stopTimer();
    if (isPlaying) startTimer();
  }

  function handleVolume(v: number) {
    setVolume(v);
    ytCmd(iframeRef.current, 'setVolume', [v]);
  }

  function handleShuffle(album: Album) {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], album, shuffled);
    setShuffle(true);
  }

  // Always-mounted hidden iframe for background audio
  const hiddenIframe = (
    <iframe
      key="yt-audio-iframe"
      ref={iframeRef}
      title="yt-audio"
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, border: 'none', opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}
    />
  );

  // ─── ALBUM GRID ─────────────────────────────────────────────────────────────
  if (!openAlbum) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0D0720 0%, #0D1547 100%)', paddingBottom: currentTrack ? 180 : 100 }}>
      {hiddenIframe}

      {/* Header */}
      <div style={{ padding: '56px 20px 20px' }}>
        <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Library</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(167,139,250,0.6)' }}>{TOTAL_TRACKS} tracks · {ALBUMS.length} albums</p>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 20px', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: category === c ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.1)', background: category === c ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: category === c ? '#A78BFA' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 2-col album grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {filteredAlbums.map(album => {
          const isActive = currentAlbum?.id === album.id && !!currentTrack;
          return (
            <div key={album.id} onClick={() => setOpenAlbum(album)} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? album.color + '60' : 'rgba(167,139,250,0.1)'}`, borderRadius: 22, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', boxShadow: isActive ? `0 0 24px ${album.color}30` : 'none' }}>
              {/* Playing indicator dot */}
              {isActive && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: album.color, boxShadow: `0 0 10px ${album.color}`, animation: 'lib-pulse 1.4s ease-in-out infinite' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 0 14px' }}>
                <AlbumOrb color={album.color} size={84} accent={album.accent} animated />
              </div>
              <div style={{ padding: '0 14px 18px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: album.color, marginBottom: 5 }}>{album.genre}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 3 }}>{album.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{album.subtitle}</div>
                <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>{album.tracks.length} tracks</div>
              </div>
            </div>
          );
        })}
      </div>

      {currentTrack && currentAlbum && (
        <MiniPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
          progress={progress} elapsed={elapsed} onPlay={togglePlay} onPrev={playPrev}
          onNext={playNext} onExpand={() => setIsExpanded(true)} />
      )}

      {isExpanded && currentTrack && currentAlbum && (
        <FullPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
          progress={progress} elapsed={elapsed} volume={volume} shuffle={shuffle} repeat={repeat}
          onPlay={togglePlay} onPrev={playPrev} onNext={playNext} onSeek={handleSeek}
          onVolume={handleVolume} onShuffle={() => setShuffle(s => !s)}
          onRepeat={() => setRepeat(r => !r)} onCollapse={() => setIsExpanded(false)} />
      )}
    </div>
  );

  // ─── ALBUM DETAIL ────────────────────────────────────────────────────────────
  const album = openAlbum;
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0D0720 0%, #0D1547 100%)', paddingBottom: currentTrack ? 180 : 100 }}>
      {hiddenIframe}

      {/* Ambient background for album color */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 0%, ${album.color}20 0%, transparent 60%)`, zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Back */}
        <div style={{ padding: '56px 20px 0' }}>
          <button onClick={() => setOpenAlbum(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Library
          </button>
        </div>

        {/* Album header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 24px 28px', textAlign: 'center' }}>
          <AlbumOrb color={album.color} size={130} accent={album.accent} animated pulse={currentAlbum?.id === album.id && isPlaying} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: album.color, marginBottom: 8 }}>{album.genre}</div>
            <h2 style={{ margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{album.title}</h2>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{album.subtitle}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>{album.description}</p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => playTrack(album.tracks[0], album)} style={{ height: 44, padding: '0 28px', borderRadius: 14, border: 'none', cursor: 'pointer', background: album.color, color: 'white', fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, boxShadow: `0 6px 24px ${album.color}55`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>▶</span> Play all
            </button>
            <button onClick={() => handleShuffle(album)} style={{ height: 44, padding: '0 20px', borderRadius: 14, border: `1.5px solid ${album.color}60`, cursor: 'pointer', background: album.color + '18', color: album.color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⇄ Shuffle
            </button>
          </div>
        </div>

        {/* Track list */}
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {album.tracks.map((track, idx) => {
            const active = currentTrack?.id === track.id && currentAlbum?.id === album.id;
            return (
              <button key={track.id} onClick={() => active ? togglePlay() : playTrack(track, album)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, cursor: 'pointer', background: active ? `${album.color}18` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${active ? album.color + '50' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s', textAlign: 'left', fontFamily: 'inherit', boxShadow: active ? `0 0 20px ${album.color}20` : 'none' }}>

                {/* Number / wave */}
                <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && isPlaying
                    ? <WaveVisualizer color={album.color} active />
                    : active
                      ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: album.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}>▐▐</div>
                      : <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? album.color : 'rgba(255,255,255,0.85)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{track.artist}</div>
                </div>

                {/* Tag */}
                {track.tags?.[0] && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${album.color}18`, color: album.color, border: `1px solid ${album.color}30`, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {track.tags[0]}
                  </span>
                )}

                {/* Duration / loading */}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                  {active && loading ? '···' : track.duration}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {currentTrack && currentAlbum && (
        <MiniPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
          progress={progress} elapsed={elapsed} onPlay={togglePlay} onPrev={playPrev}
          onNext={playNext} onExpand={() => setIsExpanded(true)} />
      )}

      {isExpanded && currentTrack && currentAlbum && (
        <FullPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
          progress={progress} elapsed={elapsed} volume={volume} shuffle={shuffle} repeat={repeat}
          onPlay={togglePlay} onPrev={playPrev} onNext={playNext} onSeek={handleSeek}
          onVolume={handleVolume} onShuffle={() => setShuffle(s => !s)}
          onRepeat={() => setRepeat(r => !r)} onCollapse={() => setIsExpanded(false)} />
      )}
    </div>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────
function MiniPlayer({ track, album, isPlaying, loading, progress, elapsed, onPlay, onPrev, onNext, onExpand }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    onPlay(): void; onPrev(): void; onNext(): void; onExpand(): void }) {

  const totalSec = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  return (
    <div style={{ position: 'fixed', bottom: 88, left: 0, right: 0, zIndex: 90, padding: '0 12px', animation: 'lib-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ background: 'rgba(13,7,32,0.92)', backdropFilter: 'blur(32px)', borderRadius: 24, border: `1px solid ${album.color}35`, boxShadow: `0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`, overflow: 'hidden' }}>
        {/* Thin progress bar at top */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${album.color}, ${album.color}99)`, transition: 'width 1s linear', borderRadius: 99 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' }}>
          {/* Tap to expand */}
          <button onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0, padding: 0 }}>
            <AlbumOrb color={album.color} size={40} accent={album.accent} animated={isPlaying} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', marginTop: 1 }}>
                {loading ? 'Loading…' : `${formatSecs(elapsed)} · −${formatSecs(remaining)}`}
              </div>
            </div>
          </button>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={onPrev} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
            <button onClick={onPlay} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: loading ? 'rgba(255,255,255,0.1)' : album.color, color: 'white', fontSize: loading ? 10 : 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: loading ? 'none' : `0 4px 16px ${album.color}60`, transition: 'all 0.2s' }}>
              {loading ? '···' : isPlaying ? '▐▐' : '▶'}
            </button>
            <button onClick={onNext} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Player ─────────────────────────────────────────────────────────────
function FullPlayer({ track, album, isPlaying, loading, progress, elapsed, volume, shuffle, repeat,
  onPlay, onPrev, onNext, onSeek, onVolume, onShuffle, onRepeat, onCollapse }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    volume: number; shuffle: boolean; repeat: boolean;
    onPlay(): void; onPrev(): void; onNext(): void; onSeek(p: number): void;
    onVolume(v: number): void; onShuffle(): void; onRepeat(): void; onCollapse(): void }) {

  const totalSec  = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', background: '#08051A', overflowY: 'auto' }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 25%, ${album.color}35 0%, transparent 60%)` }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '120%', height: '40%', pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 100%, ${album.color}18 0%, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 22px 20px' }}>
          <button onClick={onCollapse} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↓
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: album.color }}>Now Playing</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{album.title}</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Orb */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 24px' }}>
          <div style={{ position: 'relative' }}>
            <AlbumOrb color={album.color} size={220} accent={album.accent} animated pulse={isPlaying && !loading} />
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                Loading…
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <WaveVisualizer color={album.color} active={isPlaying && !loading} />
            </div>
          </div>
        </div>

        {/* Track info */}
        <div style={{ padding: '0 28px 20px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 5 }}>{track.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{track.artist}</div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '0 28px 6px' }}>
          <div onClick={handleProgressClick} style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, cursor: 'pointer', position: 'relative', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${album.color}, ${album.color}CC)`, borderRadius: 99, transition: 'width 1s linear' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: '50%', background: album.color, boxShadow: `0 0 14px ${album.color}90`, transition: 'left 1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>{formatSecs(elapsed)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>−{formatSecs(remaining)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '16px 28px 20px' }}>
          <button onClick={onShuffle} style={{ width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', background: shuffle ? album.color + '28' : 'rgba(255,255,255,0.06)', color: shuffle ? album.color : 'rgba(255,255,255,0.4)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: shuffle ? `1px solid ${album.color}50` : '1px solid transparent', transition: 'all 0.2s' }}>
            ⇄
          </button>
          <button onClick={onPrev} style={{ width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
          <button onClick={onPlay} style={{ width: 74, height: 74, borderRadius: '50%', border: 'none', cursor: 'pointer', background: loading ? 'rgba(255,255,255,0.12)' : album.color, color: 'white', fontSize: loading ? 12 : 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: loading ? 'none' : `0 8px 32px ${album.color}70`, transition: 'all 0.3s' }}>
            {loading ? '···' : isPlaying ? '▐▐' : '▶'}
          </button>
          <button onClick={onNext} style={{ width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
          <button onClick={onRepeat} style={{ width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', background: repeat ? album.color + '28' : 'rgba(255,255,255,0.06)', color: repeat ? album.color : 'rgba(255,255,255,0.4)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: repeat ? `1px solid ${album.color}50` : '1px solid transparent', transition: 'all 0.2s' }}>
            ↻
          </button>
        </div>

        {/* Volume */}
        <div style={{ padding: '0 32px 40px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
          <input type="range" min={0} max={100} value={volume} onChange={e => onVolume(Number(e.target.value))}
            style={{ flex: 1, accentColor: album.color, height: 4, cursor: 'pointer' }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </div>
      </div>
    </div>
  );
}
