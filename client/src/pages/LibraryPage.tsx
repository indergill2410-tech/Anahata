import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALBUMS, CATEGORIES, TOTAL_TRACKS, getAlbumsByCategory, Album, Track } from '../data/libraryData';

// ─── YouTube IFrame API types ─────────────────────────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(v: number): void;
  getVolume(): number;
  destroy(): void;
}

// ─── Animated album orb ───────────────────────────────────────────────────────
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
      const breathe = animated ? 0.07 * Math.sin(t.current * 0.035) : 0;
      const pulsate = pulse   ? 0.05 * Math.sin(t.current * 0.1) : 0;
      const cr = r * (0.8 + breathe + pulsate);

      // outer glow
      const g1 = ctx.createRadialGradient(r, r, cr * 0.3, r, r, cr * 1.5);
      g1.addColorStop(0, color + '55'); g1.addColorStop(1, color + '00');
      ctx.beginPath(); ctx.arc(r, r, cr * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = g1; ctx.fill();

      // body
      const shift = animated ? 0.1 * Math.sin(t.current * 0.022) : 0;
      const g2 = ctx.createRadialGradient(r - cr*(0.28+shift), r - cr*0.28, 0, r, r, cr);
      g2.addColorStop(0, accent || '#ffffff');
      g2.addColorStop(0.4, color);
      g2.addColorStop(0.75, color + 'BB');
      g2.addColorStop(1, color + '55');
      ctx.beginPath(); ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = g2; ctx.fill();

      // specular
      const g3 = ctx.createRadialGradient(r-cr*0.3, r-cr*0.3, 0, r-cr*0.15, r-cr*0.15, cr*0.6);
      g3.addColorStop(0, 'rgba(255,255,255,0.6)'); g3.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = g3; ctx.fill();

      if (animated || pulse) { t.current++; raf.current = requestAnimationFrame(draw); }
    }
    draw();
    return () => cancelAnimationFrame(raf.current);
  }, [color, size, accent, animated, pulse]);

  return <canvas ref={cvs} style={{ display: 'block', borderRadius: '50%', flexShrink: 0 }} />;
}

// ─── Waveform visualizer bars ─────────────────────────────────────────────────
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

function formatSecs(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface LibraryPageProps {
  onTabChange?: (tab: 'journey' | 'library' | 'studio' | 'journal' | 'profile') => void;
}

export default function LibraryPage({ onTabChange: _ot }: LibraryPageProps) {
  const [category,     setCategory]     = useState('All');
  const [openAlbum,    setOpenAlbum]    = useState<Album | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [elapsed,      setElapsed]      = useState('0:00');
  const [totalDur,     setTotalDur]     = useState('0:00');
  const [volume,       setVolume]       = useState(80);
  const [shuffle,      setShuffle]      = useState(false);
  const [repeat,       setRepeat]       = useState(false);
  const [showVideo,    setShowVideo]    = useState(false);

  const ytRef    = useRef<YTPlayer | null>(null);
  const ytDivRef = useRef<HTMLDivElement>(null);   // always-mounted hidden iframe host
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<Track[]>([]);             // current playback queue

  const filteredAlbums = getAlbumsByCategory(category);

  // Load YouTube IFrame API once on mount
  useEffect(() => {
    if (window.YT?.Player) return;
    window.onYouTubeIframeAPIReady = () => { /* API ready flag handled in tryCreate */ };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
    return () => { window.onYouTubeIframeAPIReady = undefined; };
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopTimer(); ytRef.current?.destroy(); }, []);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      try {
        const cur = ytRef.current?.getCurrentTime() ?? 0;
        const dur = ytRef.current?.getDuration() ?? 0;
        if (dur > 0) { setProgress(cur / dur); setElapsed(formatSecs(cur)); setTotalDur(formatSecs(dur)); }
      } catch { /* ignore */ }
    }, 500);
  }

  const playTrack = useCallback((track: Track, album: Album, queue?: Track[]) => {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    setProgress(0); setElapsed('0:00'); setTotalDur(track.duration);
    queueRef.current = queue ?? album.tracks;

    const container = ytDivRef.current;
    if (!container) return;

    // destroy old player
    stopTimer();
    try { ytRef.current?.destroy(); } catch { /* ignore */ }
    ytRef.current = null;
    container.innerHTML = '';

    const div = document.createElement('div');
    container.appendChild(div);

    function tryCreate() {
      if (!window.YT?.Player) { setTimeout(tryCreate, 250); return; }
      ytRef.current = new window.YT.Player(div, {
        videoId: track.ytId,
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, controls: 1, rel: 0, playsinline: 1, enablejsapi: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(volume);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING)  { setIsPlaying(true);  startTimer(); }
            if (e.data === window.YT.PlayerState.PAUSED)   { setIsPlaying(false); stopTimer(); }
            if (e.data === window.YT.PlayerState.BUFFERING){ setIsPlaying(true); }
            if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false); stopTimer();
              if (repeat) { ytRef.current?.seekTo(0, true); ytRef.current?.playVideo(); }
              else playNext();
            }
          },
        },
      });
    }
    tryCreate();
  }, [volume, repeat]); // eslint-disable-line react-hooks/exhaustive-deps

  function playNext() {
    const q = queueRef.current;
    if (!currentTrack || !currentAlbum || q.length === 0) return;
    const idx = q.findIndex(t => t.id === currentTrack.id);
    if (shuffle) {
      const next = q[Math.floor(Math.random() * q.length)];
      playTrack(next, currentAlbum, q);
    } else if (idx < q.length - 1) {
      playTrack(q[idx + 1], currentAlbum, q);
    }
  }

  function playPrev() {
    const q = queueRef.current;
    if (!currentTrack || !currentAlbum || q.length === 0) return;
    const idx = q.findIndex(t => t.id === currentTrack.id);
    // if more than 3s in, restart; else go previous
    const cur = ytRef.current?.getCurrentTime() ?? 0;
    if (cur > 3) { ytRef.current?.seekTo(0, true); return; }
    if (idx > 0) playTrack(q[idx - 1], currentAlbum, q);
  }

  function togglePlay() {
    if (!ytRef.current) return;
    isPlaying ? ytRef.current.pauseVideo() : ytRef.current.playVideo();
  }

  function handleVolume(v: number) {
    setVolume(v);
    ytRef.current?.setVolume(v);
  }

  function handleSeek(pct: number) {
    const dur = ytRef.current?.getDuration() ?? 0;
    if (dur > 0) ytRef.current?.seekTo(dur * pct, true);
  }

  function handleShuffle(album: Album) {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], album, shuffled);
  }

  // ─── Always-mounted hidden YT host (keeps audio alive across view changes) ──
  const ytHost = (
    <div
      ref={ytDivRef}
      style={{
        position: 'fixed', bottom: -9999, left: -9999,
        width: showVideo ? '100%' : 1,
        height: showVideo ? '100%' : 1,
        opacity: showVideo ? 1 : 0,
        pointerEvents: showVideo ? 'auto' : 'none',
        zIndex: showVideo ? 200 : -1,
      }}
    />
  );

  // ─── ALBUM GRID ───────────────────────────────────────────────────────────
  if (!openAlbum) {
    return (
      <div className="dashboard fade-in" style={{ gap: 14, paddingBottom: currentTrack ? 170 : 24 }}>
        {ytHost}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--ink1)', letterSpacing: '-0.02em' }}>Library</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink3)' }}>{TOTAL_TRACKS} tracks · {ALBUMS.length} albums</p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>{filteredAlbums.length} shown</span>
        </div>

        {/* Category filter */}
        <div className="lib-filter-row">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`lib-chip ${category === c ? 'active' : ''}`}>{c}</button>
          ))}
        </div>

        {/* 2-col album grid */}
        <div className="lib-album-grid">
          {filteredAlbums.map(album => (
            <div key={album.id} className="lib-album-card" onClick={() => setOpenAlbum(album)}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 14px' }}>
                <AlbumOrb color={album.color} size={80} accent={album.accent} animated />
              </div>
              <div style={{ padding: '0 14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: album.color, marginBottom: 5, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {album.genre}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink1)', lineHeight: 1.3, marginBottom: 3 }}>{album.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>{album.subtitle}</div>
                <div style={{ fontSize: 10, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>{album.tracks.length} tracks</div>
              </div>
              {currentAlbum?.id === album.id && currentTrack && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: album.color, boxShadow: `0 0 8px ${album.color}` }} />
              )}
            </div>
          ))}
        </div>

        {/* Mini player */}
        {currentTrack && currentAlbum && (
          <MiniPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} progress={progress}
            elapsed={elapsed} onPlay={togglePlay} onPrev={playPrev} onNext={playNext}
            onExpand={() => setIsExpanded(true)} />
        )}

        {/* Full player overlay */}
        {isExpanded && currentTrack && currentAlbum && (
          <FullPlayer
            track={currentTrack} album={currentAlbum} isPlaying={isPlaying}
            progress={progress} elapsed={elapsed} total={totalDur}
            volume={volume} shuffle={shuffle} repeat={repeat} showVideo={showVideo}
            onPlay={togglePlay} onPrev={playPrev} onNext={playNext}
            onSeek={handleSeek} onVolume={handleVolume}
            onShuffle={() => setShuffle(s => !s)} onRepeat={() => setRepeat(r => !r)}
            onToggleVideo={() => setShowVideo(v => !v)}
            onCollapse={() => setIsExpanded(false)}
          />
        )}
      </div>
    );
  }

  // ─── ALBUM DETAIL ────────────────────────────────────────────────────────────
  const album = openAlbum;
  return (
    <div className="dashboard fade-in" style={{ gap: 0, paddingBottom: currentTrack ? 170 : 24 }}>
      {ytHost}

      {/* Back */}
      <button onClick={() => setOpenAlbum(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 13, fontFamily: 'inherit', padding: '0 0 16px', fontWeight: 600 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Library
      </button>

      {/* Album header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 24, textAlign: 'center' }}>
        <AlbumOrb color={album.color} size={120} accent={album.accent} animated pulse={currentAlbum?.id === album.id && isPlaying} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: album.color, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>{album.genre}</div>
          <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--ink1)', letterSpacing: '-0.02em' }}>{album.title}</h2>
          <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--ink3)' }}>{album.subtitle}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink4)', lineHeight: 1.6 }}>{album.description}</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => playTrack(album.tracks[0], album)} style={{ height: 42, padding: '0 28px', borderRadius: 14, border: 'none', cursor: 'pointer', background: album.color, color: 'white', fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, boxShadow: `0 6px 20px ${album.color}50`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12 }}>▶</span> Play all
          </button>
          <button onClick={() => handleShuffle(album)} style={{ height: 42, padding: '0 20px', borderRadius: 14, border: `1.5px solid ${album.color}`, cursor: 'pointer', background: album.color + '12', color: album.color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⇄ Shuffle
          </button>
        </div>
      </div>

      {/* Track list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {album.tracks.map((track, idx) => {
          const active = currentTrack?.id === track.id && currentAlbum?.id === album.id;
          return (
            <div key={track.id} onClick={() => playTrack(track, album)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, cursor: 'pointer', background: active ? `${album.color}10` : 'transparent', border: `1px solid ${active ? album.color + '30' : 'transparent'}`, transition: 'all 0.2s' }}>
              {/* Number / playing indicator */}
              <div style={{ width: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && isPlaying
                  ? <WaveVisualizer color={album.color} active={true} />
                  : <span style={{ fontSize: 13, fontWeight: 600, color: active ? album.color : 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? album.color : 'var(--ink1)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{track.artist}</div>
              </div>

              {/* Tags */}
              {track.tags?.[0] && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: `${album.color}15`, color: album.color, border: `1px solid ${album.color}25`, flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {track.tags[0]}
                </span>
              )}

              {/* Duration */}
              <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{track.duration}</span>

              {/* Play btn */}
              <button onClick={e => { e.stopPropagation(); active ? togglePlay() : playTrack(track, album); }}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', background: active ? album.color : 'rgba(255,255,255,0.06)', boxShadow: active ? `0 4px 12px ${album.color}50` : 'none', transition: 'all 0.2s' }}>
                {active && isPlaying ? '▐▐' : '▶'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mini player */}
      {currentTrack && currentAlbum && (
        <MiniPlayer track={currentTrack} album={currentAlbum} isPlaying={isPlaying} progress={progress}
          elapsed={elapsed} onPlay={togglePlay} onPrev={playPrev} onNext={playNext}
          onExpand={() => setIsExpanded(true)} />
      )}

      {/* Full player overlay */}
      {isExpanded && currentTrack && currentAlbum && (
        <FullPlayer
          track={currentTrack} album={currentAlbum} isPlaying={isPlaying}
          progress={progress} elapsed={elapsed} total={totalDur}
          volume={volume} shuffle={shuffle} repeat={repeat} showVideo={showVideo}
          onPlay={togglePlay} onPrev={playPrev} onNext={playNext}
          onSeek={handleSeek} onVolume={handleVolume}
          onShuffle={() => setShuffle(s => !s)} onRepeat={() => setRepeat(r => !r)}
          onToggleVideo={() => setShowVideo(v => !v)}
          onCollapse={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

// ─── Mini Player ──────────────────────────────────────────────────────────────
function MiniPlayer({ track, album, isPlaying, progress, elapsed, onPlay, onPrev, onNext, onExpand }:
  { track: Track; album: Album; isPlaying: boolean; progress: number; elapsed: string;
    onPlay(): void; onPrev(): void; onNext(): void; onExpand(): void; }) {
  return (
    <div style={{ position: 'fixed', bottom: 88, left: 0, right: 0, zIndex: 90, padding: '0 12px', animation: 'lib-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ background: 'rgba(247,244,238,0.96)', backdropFilter: 'blur(32px)', borderRadius: 22, border: '1px solid rgba(23,18,10,0.1)', boxShadow: '0 -4px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(23,18,10,0.08)' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${album.color}, ${album.color}CC)`, transition: 'width 0.5s linear', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          {/* Tap to expand */}
          <button onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
            <AlbumOrb color={album.color} size={38} accent={album.accent} animated={isPlaying} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>{track.artist} · {elapsed}</div>
            </div>
          </button>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button onClick={onPrev} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(23,18,10,0.06)', cursor: 'pointer', fontSize: 12, color: 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
            <button onClick={onPlay} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', background: album.color, color: 'white', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${album.color}55` }}>
              {isPlaying ? '▐▐' : '▶'}
            </button>
            <button onClick={onNext} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(23,18,10,0.06)', cursor: 'pointer', fontSize: 12, color: 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Player ──────────────────────────────────────────────────────────────
function FullPlayer({ track, album, isPlaying, progress, elapsed, total, volume, shuffle, repeat, showVideo,
  onPlay, onPrev, onNext, onSeek, onVolume, onShuffle, onRepeat, onToggleVideo, onCollapse }:
  { track: Track; album: Album; isPlaying: boolean; progress: number; elapsed: string; total: string;
    volume: number; shuffle: boolean; repeat: boolean; showVideo: boolean;
    onPlay(): void; onPrev(): void; onNext(): void; onSeek(p: number): void; onVolume(v: number): void;
    onShuffle(): void; onRepeat(): void; onToggleVideo(): void; onCollapse(): void; }) {

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', background: '#0D0A18', overflowY: 'auto' }}>
      {/* Ambient orb glow background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 30%, ${album.color}30 0%, transparent 65%)` }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 22px 16px', position: 'relative', zIndex: 1 }}>
        <button onClick={onCollapse} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ↓
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: album.color, fontFamily: "'Space Grotesk', sans-serif" }}>Now Playing</div>
        </div>
        <button onClick={onToggleVideo} style={{ width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', background: showVideo ? album.color + '30' : 'rgba(255,255,255,0.08)', color: showVideo ? album.color : 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: showVideo ? `1px solid ${album.color}50` : '1px solid transparent' } as React.CSSProperties}>
          ▶
        </button>
      </div>

      {/* Orb / video area */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 22px 28px', position: 'relative', zIndex: 1 }}>
        {showVideo ? (
          <div style={{ width: '100%', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 20px' }}>Video playing in background panel</div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <AlbumOrb color={album.color} size={200} accent={album.accent} animated pulse={isPlaying} />
            {/* Waveform below orb */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <WaveVisualizer color={album.color} active={isPlaying} />
            </div>
          </div>
        )}
      </div>

      {/* Track info */}
      <div style={{ padding: '0 24px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>{track.title}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{track.artist} · {album.title}</div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 24px 8px', position: 'relative', zIndex: 1 }}>
        <div onClick={handleProgressClick} style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, cursor: 'pointer', position: 'relative' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${album.color}, ${album.color}CC)`, borderRadius: 99, transition: 'width 0.5s linear' }} />
          <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: album.color, boxShadow: `0 0 12px ${album.color}80`, transition: 'left 0.5s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>{elapsed}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>{total}</span>
        </div>
      </div>

      {/* Main controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '8px 24px 20px', position: 'relative', zIndex: 1 }}>
        <button onClick={onShuffle} style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', background: shuffle ? album.color + '25' : 'rgba(255,255,255,0.06)', color: shuffle ? album.color : 'rgba(255,255,255,0.45)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: shuffle ? `1px solid ${album.color}40` : '1px solid transparent' } as React.CSSProperties}>
          ⇄
        </button>
        <button onClick={onPrev} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
        <button onClick={onPlay} style={{ width: 70, height: 70, borderRadius: '50%', border: 'none', cursor: 'pointer', background: album.color, color: 'white', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 28px ${album.color}70`, fontWeight: 700 }}>
          {isPlaying ? '▐▐' : '▶'}
        </button>
        <button onClick={onNext} style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
        <button onClick={onRepeat} style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', background: repeat ? album.color + '25' : 'rgba(255,255,255,0.06)', color: repeat ? album.color : 'rgba(255,255,255,0.45)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: repeat ? `1px solid ${album.color}40` : '1px solid transparent' } as React.CSSProperties}>
          ↻
        </button>
      </div>

      {/* Volume */}
      <div style={{ padding: '0 28px 32px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>🔈</span>
        <input type="range" min={0} max={100} value={volume} onChange={e => onVolume(Number(e.target.value))}
          style={{ flex: 1, accentColor: album.color, height: 4, cursor: 'pointer' }} />
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>🔊</span>
      </div>

      {/* Album name footer */}
      <div style={{ textAlign: 'center', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>{album.title}</span>
      </div>
    </div>
  );
}
