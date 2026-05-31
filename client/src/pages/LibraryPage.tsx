import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALBUMS, CATEGORIES, TOTAL_TRACKS, getAlbumsByCategory, Album, Track } from '../data/libraryData';

// Extend window for YT API
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

// ─── Animated orb canvas ──────────────────────────────────────────────────────
interface OrbProps {
  color: string;
  size: number;
  accent?: string;
  animated?: boolean;
}

function AlbumOrb({ color, size, accent, animated = false }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const r = size / 2;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      const pulse = animated ? 0.06 * Math.sin(tRef.current * 0.04) : 0;
      const cr = r * (0.82 + pulse);

      // Outer soft glow
      const glow = ctx.createRadialGradient(r, r, cr * 0.4, r, r, cr * 1.4);
      glow.addColorStop(0, color + '44');
      glow.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.arc(r, r, cr * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Main orb gradient
      const shift = animated ? 0.08 * Math.sin(tRef.current * 0.025) : 0;
      const grad = ctx.createRadialGradient(
        r - cr * (0.3 + shift), r - cr * 0.3, 0,
        r, r, cr
      );
      grad.addColorStop(0, accent || '#ffffff');
      grad.addColorStop(0.35, color);
      grad.addColorStop(0.7, color + 'CC');
      grad.addColorStop(1, color + '66');
      ctx.beginPath();
      ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight
      const hl = ctx.createRadialGradient(r - cr * 0.28, r - cr * 0.28, 0, r - cr * 0.15, r - cr * 0.15, cr * 0.55);
      hl.addColorStop(0, 'rgba(255,255,255,0.55)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(r, r, cr, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();

      if (animated) {
        tRef.current++;
        frameRef.current = requestAnimationFrame(draw);
      }
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [color, size, accent, animated]);

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '50%' }} />;
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
function MiniProgress({ progress }: { progress: number }) {
  return (
    <div className="lib-progress-track">
      <div className="lib-progress-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface LibraryPageProps {
  onTabChange?: (tab: 'journey' | 'library' | 'studio' | 'journal' | 'profile') => void;
}

export default function LibraryPage({ onTabChange: _onTabChange }: LibraryPageProps) {
  const [category, setCategory] = useState('All');
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytMiniContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytApiReadyRef = useRef(false);

  const filteredAlbums = getAlbumsByCategory(category);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT) {
      ytApiReadyRef.current = true;
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      ytApiReadyRef.current = true;
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  function formatSeconds(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function startProgressTracking() {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p) return;
      try {
        const cur = p.getCurrentTime();
        const dur = p.getDuration();
        if (dur > 0) {
          setProgress(cur / dur);
          setCurrentTime(formatSeconds(cur));
          setDuration(formatSeconds(dur));
        }
      } catch (_e) { /* player not ready */ }
    }, 1000);
  }

  function stopProgressTracking() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  const destroyPlayer = useCallback(() => {
    stopProgressTracking();
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch (_e) { /* ignore */ }
      ytPlayerRef.current = null;
    }
  }, []);

  const createPlayer = useCallback((track: Track, container: HTMLElement) => {
    destroyPlayer();
    const div = document.createElement('div');
    container.innerHTML = '';
    container.appendChild(div);

    const tryCreate = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(tryCreate, 300);
        return;
      }
      ytPlayerRef.current = new window.YT.Player(div, {
        videoId: track.ytId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.playVideo();
            setIsPlaying(true);
            startProgressTracking();
          },
          onStateChange: (e: { data: number }) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              playNextTrack();
            }
          },
        },
      });
    };
    tryCreate();
  }, [destroyPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  function playTrack(track: Track, album: Album) {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    setProgress(0);
    setCurrentTime('0:00');
    setDuration(track.duration);

    const container = ytMiniContainerRef.current;
    if (container) createPlayer(track, container);
  }

  function playNextTrack() {
    if (!currentAlbum || !currentTrack) return;
    const tracks = currentAlbum.tracks;
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx < tracks.length - 1) playTrack(tracks[idx + 1], currentAlbum);
  }

  function playPrevTrack() {
    if (!currentAlbum || !currentTrack) return;
    const tracks = currentAlbum.tracks;
    const idx = tracks.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) playTrack(tracks[idx - 1], currentAlbum);
  }

  function togglePlayPause() {
    if (!ytPlayerRef.current) return;
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
  }

  function shuffleAlbum(album: Album) {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], { ...album, tracks: shuffled });
  }

  // Move iframe to expanded container when toggling
  useEffect(() => {
    const mini = ytMiniContainerRef.current;
    const full = ytContainerRef.current;
    if (!mini || !full) return;
    if (isExpanded) {
      // Move iframe child to full container
      while (mini.firstChild) {
        full.appendChild(mini.firstChild);
      }
    } else {
      // Move back to mini
      while (full.firstChild) {
        mini.appendChild(full.firstChild);
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    return () => destroyPlayer();
  }, [destroyPlayer]);

  // ─── Render: Album Grid ──────────────────────────────────────────────────────
  if (!currentAlbum || (currentAlbum && !currentTrack && !isExpanded)) {
    return (
      <div className="dashboard fade-in" style={{ gap: 14, paddingBottom: currentTrack ? 164 : 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--ink1)', letterSpacing: '-0.02em' }}>
              Library
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink3)' }}>
              {TOTAL_TRACKS} tracks · {ALBUMS.length} albums
            </p>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>
            {filteredAlbums.length} albums
          </div>
        </div>

        {/* Category filter */}
        <div className="lib-filter-row">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`lib-chip ${category === cat ? 'active' : ''}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Album grid */}
        <div className="lib-album-grid">
          {filteredAlbums.map(album => (
            <div key={album.id} className="lib-album-card" onClick={() => setCurrentAlbum(album)}>
              <div className="lib-album-orb-wrap">
                <AlbumOrb color={album.color} size={72} accent={album.accent} animated />
              </div>
              <div className="lib-album-info">
                <div className="lib-album-genre-tag" style={{ background: album.color + '22', color: album.color }}>
                  {album.genre}
                </div>
                <h3 className="lib-album-title">{album.title}</h3>
                <p className="lib-album-subtitle">{album.subtitle}</p>
                <p className="lib-album-count">{album.tracks.length} tracks</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hidden mini YT container */}
        <div ref={ytMiniContainerRef} style={{ display: 'none' }} />

        {/* Mini player */}
        {currentTrack && currentAlbum && (
          <MiniPlayer
            track={currentTrack}
            album={currentAlbum}
            isPlaying={isPlaying}
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={togglePlayPause}
            onPrev={playPrevTrack}
            onNext={playNextTrack}
            onExpand={() => setIsExpanded(true)}
          />
        )}
      </div>
    );
  }

  // ─── Render: Album Detail ────────────────────────────────────────────────────
  const album = currentAlbum;

  return (
    <div className="dashboard fade-in" style={{ gap: 14, paddingBottom: currentTrack ? 164 : 100 }}>
      {/* Back button */}
      <button className="lib-back-btn" onClick={() => setCurrentAlbum(null)}>
        <span style={{ fontSize: 16 }}>&#8592;</span> Library
      </button>

      {/* Album header */}
      <div className="lib-album-header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <AlbumOrb color={album.color} size={96} accent={album.accent} animated />
        </div>
        <div className="lib-album-genre-tag" style={{ background: album.color + '22', color: album.color, alignSelf: 'flex-start', marginBottom: 6 }}>
          {album.genre}
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--ink1)' }}>
          {album.title}
        </h2>
        <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--ink3)' }}>{album.subtitle}</p>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>{album.description}</p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="lib-play-all-btn"
            style={{ background: album.color }}
            onClick={() => playTrack(album.tracks[0], album)}
          >
            Play All
          </button>
          <button
            className="lib-shuffle-btn"
            style={{ borderColor: album.color, color: album.color }}
            onClick={() => shuffleAlbum(album)}
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="lib-track-list">
        {album.tracks.map((track, idx) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <div
              key={track.id}
              className={`lib-track-row ${isActive ? 'active' : ''}`}
              style={isActive ? { '--track-color': album.color } as React.CSSProperties : {}}
              onClick={() => playTrack(track, album)}
            >
              <div className="lib-track-num">
                {isActive && isPlaying ? (
                  <span className="lib-track-playing-icon" style={{ color: album.color }}>
                    <span /><span /><span />
                  </span>
                ) : (
                  <span style={{ color: isActive ? album.color : 'var(--ink4)' }}>{idx + 1}</span>
                )}
              </div>
              <div className="lib-track-info">
                <div className="lib-track-title" style={{ color: isActive ? album.color : 'var(--ink1)' }}>
                  {track.title}
                </div>
                <div className="lib-track-artist">{track.artist}</div>
              </div>
              <div className="lib-track-duration">{track.duration}</div>
              <button
                className="lib-track-play-btn"
                style={isActive ? { background: album.color } : {}}
                onClick={e => { e.stopPropagation(); playTrack(track, album); }}
              >
                {isActive && isPlaying ? '▐▐' : '▶'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hidden YT container */}
      <div ref={ytMiniContainerRef} style={{ display: 'none' }} />

      {/* Mini player */}
      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          album={album}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={togglePlayPause}
          onPrev={playPrevTrack}
          onNext={playNextTrack}
          onExpand={() => setIsExpanded(true)}
        />
      )}

      {/* Full player overlay */}
      {isExpanded && currentTrack && (
        <FullPlayer
          track={currentTrack}
          album={album}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          ytContainerRef={ytContainerRef}
          onPlayPause={togglePlayPause}
          onPrev={playPrevTrack}
          onNext={playNextTrack}
          onCollapse={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────
interface MiniPlayerProps {
  track: Track;
  album: Album;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExpand: () => void;
}

function MiniPlayer({ track, album, isPlaying, progress, currentTime, onPlayPause, onPrev, onNext, onExpand }: MiniPlayerProps) {
  return (
    <div className="lib-mini-player">
      <MiniProgress progress={progress} />
      <div className="lib-mini-player-inner">
        {/* Orb + info */}
        <button className="lib-mini-info" onClick={onExpand}>
          <div style={{ flexShrink: 0 }}>
            <AlbumOrb color={album.color} size={36} accent={album.accent} />
          </div>
          <div className="lib-mini-text">
            <div className="lib-mini-title">{track.title}</div>
            <div className="lib-mini-artist">{track.artist} · {currentTime}</div>
          </div>
        </button>

        {/* Controls */}
        <div className="lib-mini-controls">
          <button className="lib-ctrl-btn" onClick={onPrev}>&#9664;&#9664;</button>
          <button className="lib-ctrl-btn lib-ctrl-play" style={{ background: album.color }} onClick={onPlayPause}>
            {isPlaying ? '▐▐' : '▶'}
          </button>
          <button className="lib-ctrl-btn" onClick={onNext}>&#9654;&#9654;</button>
        </div>
      </div>
    </div>
  );
}

// ─── Full Player Overlay ──────────────────────────────────────────────────────
interface FullPlayerProps {
  track: Track;
  album: Album;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  ytContainerRef: React.RefObject<HTMLDivElement | null>;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCollapse: () => void;
}

function FullPlayer({ track, album, isPlaying, progress, currentTime, duration, ytContainerRef, onPlayPause, onPrev, onNext, onCollapse }: FullPlayerProps) {
  return (
    <div className="lib-full-player">
      {/* Collapse button */}
      <button className="lib-full-collapse" onClick={onCollapse}>
        <span style={{ fontSize: 20 }}>&#8964;</span> collapse
      </button>

      {/* YouTube iframe */}
      <div className="lib-full-iframe-wrap">
        <div ref={ytContainerRef} className="lib-full-iframe-container" />
      </div>

      {/* Track info */}
      <div className="lib-full-info">
        <div className="lib-full-title">{track.title}</div>
        <div className="lib-full-artist">{track.artist} · {album.title}</div>
      </div>

      {/* Progress */}
      <div className="lib-full-progress-wrap">
        <MiniProgress progress={progress} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>{currentTime}</span>
          <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>{duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="lib-full-controls">
        <button className="lib-ctrl-btn lib-ctrl-lg" onClick={onPrev}>&#9664;&#9664;</button>
        <button className="lib-ctrl-btn lib-ctrl-play lib-ctrl-xl" style={{ background: album.color }} onClick={onPlayPause}>
          {isPlaying ? '▐▐' : '▶'}
        </button>
        <button className="lib-ctrl-btn lib-ctrl-lg" onClick={onNext}>&#9654;&#9654;</button>
      </div>
    </div>
  );
}
