import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALBUMS, CATEGORIES, TOTAL_TRACKS, getAlbumsByCategory, Album, Track } from '../data/libraryData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDuration(s: string): number {
  if (s.includes('min')) return parseInt(s) * 60;
  if (s.includes('hr'))  return parseInt(s) * 3600;
  const parts = s.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 300;
}
function formatSecs(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ─── YouTube IFrame API types ────────────────────────────────────────────────
declare global {
  interface Window {
    YT: { Player: new (el: HTMLElement, opts: object) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo(): void; pauseVideo(): void; stopVideo(): void; destroy(): void;
  seekTo(s: number, a: boolean): void; setVolume(v: number): void;
  unMute(): void; getCurrentTime(): number; getDuration(): number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#FAF7F2',
  bg1:      '#FFFFFF',
  bg2:      '#F0EBE3',
  ink1:     '#1C1410',
  ink2:     '#4A3828',
  ink3:     '#8B6F5E',
  ink4:     '#C4AFA4',
  amber:    '#D97706',
  amberLo:  'rgba(217,119,6,0.12)',
  amberMid: 'rgba(217,119,6,0.25)',
  shadow:   '0 2px 16px rgba(28,20,16,0.08)',
  shadowLg: '0 12px 48px rgba(28,20,16,0.13)',
};

// ─── OrbSphere (CSS-only, no canvas) ─────────────────────────────────────────
function OrbSphere({ color, accent, size, pulse = false, glow = false }: {
  color: string; accent?: string; size: number; pulse?: boolean; glow?: boolean;
}) {
  const ac = accent || '#ffffff';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${ac}CC, ${color} 55%, ${color}88)`,
      boxShadow: glow
        ? `0 0 ${size * 0.4}px ${color}55, inset 0 2px 8px rgba(255,255,255,0.3)`
        : `inset 0 2px 8px rgba(255,255,255,0.3), 0 4px 16px ${color}30`,
      animation: pulse ? 'lib-orb-pulse 2s ease-in-out infinite' : undefined,
      transition: 'box-shadow 0.4s ease',
    }} />
  );
}

// ─── WaveVisualizer ──────────────────────────────────────────────────────────
function WaveVisualizer({ color, active }: { color: string; active: boolean }) {
  const bars = [3, 6, 9, 5, 8, 4, 7, 6, 9, 3, 7, 5, 8, 4, 6];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 22 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          height: active ? h * 2.3 : 4,
          background: active ? color : T.ink4,
          animation: active ? `lib-wave ${0.45 + i * 0.065}s ease-in-out infinite alternate` : 'none',
          transition: 'height 0.3s ease, background 0.3s',
        }} />
      ))}
    </div>
  );
}

// ─── Satellite orb (wrapper rotates, inner counter-rotates to stay upright) ──
function SatelliteOrb({ album, index, ringSize, radius, duration, direction, isActive, onClick }: {
  album: Album; index: number; ringSize: number; radius: number; duration: number;
  direction: 'cw' | 'ccw'; isActive: boolean; onClick(): void;
}) {
  const delay = -(index / ringSize) * duration;
  const orbitAnim  = direction === 'cw'  ? 'lib-orbit-cw'  : 'lib-orbit-ccw';
  const counterAnim= direction === 'cw'  ? 'lib-counter-cw' : 'lib-counter-ccw';
  const orbSize = radius < 150 ? 52 : 44;

  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      width: radius * 2, height: radius * 2,
      marginTop: -radius, marginLeft: -radius,
      borderRadius: '50%',
      animation: `${orbitAnim} ${duration}s linear infinite`,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    }}>
      {/* child at top-center of the ring */}
      <div style={{
        position: 'absolute',
        top: 0, left: '50%',
        transform: 'translateX(-50%)',
        animation: `${counterAnim} ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        pointerEvents: 'all',
      }}>
        <button onClick={onClick} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          animation: 'lib-float 3s ease-in-out infinite',
          animationDelay: `${index * 0.5}s`,
        }}>
          <div style={{
            borderRadius: '50%',
            boxShadow: isActive
              ? `0 0 0 2.5px ${T.bg}, 0 0 0 4.5px ${album.color}, 0 0 20px ${album.color}60`
              : `0 2px 10px rgba(28,20,16,0.15)`,
            transition: 'box-shadow 0.35s ease',
          }}>
            <OrbSphere color={album.color} accent={album.accent} size={orbSize} glow={isActive} />
          </div>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.04em',
            color: isActive ? album.color : T.ink3,
            textAlign: 'center', maxWidth: 56, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{album.title}</span>
        </button>
      </div>
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
  const [elapsed,      setElapsed]      = useState(0);
  const [shuffle,      setShuffle]      = useState(false);
  const [repeat,       setRepeat]       = useState(false);
  const [volume,       setVolume]       = useState(80);
  const [loading,      setLoading]      = useState(false);
  const [ytError,      setYtError]      = useState<string | null>(null);

  const ytRef            = useRef<YTPlayer | null>(null);
  const ytDivRef         = useRef<HTMLDivElement>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef         = useRef<Track[]>([]);
  const elapsedRef       = useRef(0);
  const durationRef      = useRef(0);
  const activeIdRef      = useRef('');
  const currentTrackRef  = useRef<Track | null>(null);
  const currentAlbumRef  = useRef<Album | null>(null);
  const repeatRef        = useRef(repeat);
  const shuffleRef       = useRef(shuffle);
  const volumeRef        = useRef(volume);
  currentTrackRef.current = currentTrack;
  currentAlbumRef.current = currentAlbum;
  repeatRef.current       = repeat;
  shuffleRef.current      = shuffle;
  volumeRef.current       = volume;

  const filteredAlbums = getAlbumsByCategory(category);
  const innerRing = ALBUMS.slice(0, 6);
  const outerRing = ALBUMS.slice(6, 12);

  useEffect(() => {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    return () => {
      stopTimer();
      if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
      try { ytRef.current?.destroy(); } catch { /**/ }
    };
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
        if (repeatRef.current) restartCurrent();
        else playNext();
      }
    }, 1000);
  }

  function restartCurrent() {
    const t = currentTrackRef.current; const a = currentAlbumRef.current;
    if (!t || !a) return;
    triggerPlay(t, a, queueRef.current);
  }

  const triggerPlay = useCallback((track: Track, album: Album, queue: Track[]) => {
    setCurrentTrack(track);
    setCurrentAlbum(album);
    queueRef.current = queue;
    setIsPlaying(false);
    setLoading(true);
    setProgress(0);
    setElapsed(0);
    elapsedRef.current = 0;
    durationRef.current = parseDuration(track.duration);
    activeIdRef.current = track.id;
    setYtError(null);

    stopTimer();
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = null;
    }
    try { ytRef.current?.destroy(); } catch { /**/ }
    ytRef.current = null;

    const container = ytDivRef.current;
    if (!container) { setLoading(false); setYtError('Player container not found'); return; }
    container.innerHTML = '';
    const div = document.createElement('div');
    container.appendChild(div);

    // Timeout: if YT API never loads after 10s, surface an error
    let apiWaitMs = 0;

    function tryCreate() {
      if (activeIdRef.current !== track.id) return;
      if (!window.YT?.Player) {
        apiWaitMs += 200;
        if (apiWaitMs >= 10000) {
          setLoading(false);
          setYtError('YouTube player failed to load. Check your internet connection.');
          return;
        }
        createTimeoutRef.current = setTimeout(tryCreate, 200);
        return;
      }

      ytRef.current = new window.YT.Player(div, {
        videoId: track.ytId,
        width: 320, height: 180,
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (activeIdRef.current !== track.id) return;
            e.target.unMute();
            e.target.setVolume(volumeRef.current);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            const S = window.YT?.PlayerState;
            if (!S) return;
            if (e.data === S.PLAYING)   { setIsPlaying(true);  setLoading(false); setYtError(null); if (!timerRef.current) startTimer(); }
            if (e.data === S.PAUSED)    { setIsPlaying(false); stopTimer(); }
            if (e.data === S.BUFFERING) { setLoading(true); }
            if (e.data === S.ENDED) {
              setIsPlaying(false); stopTimer();
              if (repeatRef.current) { ytRef.current?.seekTo(0, true); ytRef.current?.playVideo(); }
              else playNext();
            }
          },
          onError: (e: { data: number }) => {
            setLoading(false); setIsPlaying(false);
            const code = e.data;
            const msg =
              code === 2   ? 'Invalid video ID.' :
              code === 5   ? 'HTML5 player error.' :
              code === 100 ? 'Video not found or private.' :
              (code === 101 || code === 150) ? 'This video cannot be embedded. Try another track.' :
              `Playback error (code ${code}).`;
            setYtError(msg);
            console.error('[YT] error code:', code, msg);
          },
        },
      });
    }
    tryCreate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function playTrack(track: Track, album: Album, queue?: Track[]) {
    triggerPlay(track, album, queue ?? album.tracks);
  }

  function togglePlay() {
    if (!ytRef.current) return;
    isPlaying ? ytRef.current.pauseVideo() : ytRef.current.playVideo();
  }

  function playNext() {
    const q = queueRef.current;
    const track = currentTrackRef.current;
    const album = currentAlbumRef.current;
    if (!track || !album || q.length === 0) return;
    const idx = q.findIndex(t => t.id === track.id);
    if (shuffleRef.current) {
      triggerPlay(q[Math.floor(Math.random() * q.length)], album, q);
    } else if (idx < q.length - 1) {
      triggerPlay(q[idx + 1], album, q);
    }
  }

  function playPrev() {
    const q = queueRef.current;
    const curTrack = currentTrackRef.current;
    const curAlbum = currentAlbumRef.current;
    if (!curTrack || !curAlbum || q.length === 0) return;
    const cur = ytRef.current?.getCurrentTime() ?? elapsedRef.current;
    if (cur > 3) { ytRef.current?.seekTo(0, true); return; }
    const idx = q.findIndex(t => t.id === curTrack.id);
    if (idx > 0) triggerPlay(q[idx - 1], curAlbum, q);
  }

  function handleSeek(pct: number) {
    const dur = ytRef.current?.getDuration() ?? durationRef.current;
    const target = Math.floor(dur * pct);
    ytRef.current?.seekTo(target, true);
    elapsedRef.current = target;
    setElapsed(target);
    setProgress(pct);
  }

  function handleVolume(v: number) {
    setVolume(v);
    ytRef.current?.setVolume(v);
  }

  function handleShuffle(album: Album) {
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], album, shuffled);
    setShuffle(true);
  }

  // Always-mounted hidden div keeps YT player alive across view changes
  const ytHost = (
    <div ref={ytDivRef} style={{ position: 'fixed', bottom: -9999, left: -9999, width: 1, height: 1, zIndex: -1 }} />
  );

  const miniPlayer = currentTrack && currentAlbum && (
    <MiniPlayer
      track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
      progress={progress} elapsed={elapsed} ytError={ytError}
      onPlay={togglePlay} onPrev={playPrev} onNext={playNext} onExpand={() => setIsExpanded(true)}
    />
  );

  const fullPlayer = isExpanded && currentTrack && currentAlbum && (
    <FullPlayer
      track={currentTrack} album={currentAlbum} isPlaying={isPlaying} loading={loading}
      progress={progress} elapsed={elapsed} volume={volume} shuffle={shuffle} repeat={repeat}
      ytError={ytError}
      onPlay={togglePlay} onPrev={playPrev} onNext={playNext} onSeek={handleSeek}
      onVolume={handleVolume} onShuffle={() => setShuffle(s => !s)}
      onRepeat={() => setRepeat(r => !r)} onCollapse={() => setIsExpanded(false)}
    />
  );

  // ─── ALBUM DETAIL ──────────────────────────────────────────────────────────
  if (openAlbum) {
    const album = openAlbum;
    return (
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: currentTrack ? 200 : 100 }}>
        {ytHost}

        {/* Soft color bloom at top */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(ellipse 70% 40% at 50% -10%, ${album.color}18 0%, transparent 70%)` }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Back button */}
          <div style={{ padding: '56px 20px 0' }}>
            <button onClick={() => setOpenAlbum(null)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.bg1, border: `1px solid ${T.bg2}`, borderRadius: 20,
              cursor: 'pointer', color: T.ink2, fontSize: 13, fontFamily: 'inherit',
              padding: '8px 16px 8px 10px', fontWeight: 600, boxShadow: T.shadow,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Library
            </button>
          </div>

          {/* Album header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 24px 28px', textAlign: 'center' }}>
            <div style={{
              padding: 6, borderRadius: '50%',
              background: `radial-gradient(circle, ${album.color}15, transparent 70%)`,
              animation: 'lib-orb-pulse 4s ease-in-out infinite',
            }}>
              <OrbSphere color={album.color} accent={album.accent} size={140}
                pulse={currentAlbum?.id === album.id && isPlaying} glow={currentAlbum?.id === album.id} />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: album.color, marginBottom: 8 }}>{album.genre}</div>
              <h2 style={{ margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: T.ink1, letterSpacing: '-0.02em' }}>{album.title}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: T.ink3 }}>{album.subtitle}</p>
              <p style={{ margin: 0, fontSize: 12, color: T.ink4, lineHeight: 1.7, maxWidth: 320 }}>{album.description}</p>
            </div>

            {/* Wave visualizer when active */}
            {currentAlbum?.id === album.id && <WaveVisualizer color={album.color} active={isPlaying && !loading} />}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => playTrack(album.tracks[0], album)} style={{
                height: 46, padding: '0 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: album.color, color: 'white',
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
                boxShadow: `0 6px 24px ${album.color}50`, display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                <span style={{ fontSize: 12 }}>▶</span> Play All
              </button>
              <button onClick={() => handleShuffle(album)} style={{
                height: 46, padding: '0 22px', borderRadius: 14, cursor: 'pointer',
                border: `1.5px solid ${album.color}50`,
                background: `${album.color}12`, color: album.color,
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⇄ Shuffle
              </button>
            </div>
          </div>

          {/* Track list */}
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {album.tracks.map((track, idx) => {
              const active = currentTrack?.id === track.id && currentAlbum?.id === album.id;
              return (
                <button key={track.id}
                  onClick={() => active ? togglePlay() : playTrack(track, album)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', borderRadius: 16, cursor: 'pointer',
                    background: active ? `${album.color}10` : T.bg1,
                    border: `1.5px solid ${active ? album.color + '40' : T.bg2}`,
                    transition: 'all 0.2s', textAlign: 'left', fontFamily: 'inherit',
                    boxShadow: active ? `0 0 20px ${album.color}18` : T.shadow,
                  }}>

                  {/* Number / visualizer */}
                  <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && isPlaying
                      ? <WaveVisualizer color={album.color} active />
                      : active
                        ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: album.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white' }}>▐▐</div>
                        : <span style={{ fontSize: 13, fontWeight: 600, color: T.ink4, fontFamily: "'JetBrains Mono', monospace" }}>{String(idx + 1).padStart(2, '0')}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? album.color : T.ink1, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                    <div style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>{track.artist}</div>
                  </div>

                  {/* Tag */}
                  {track.tags?.[0] && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${album.color}15`, color: album.color, border: `1px solid ${album.color}25`, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {track.tags[0]}
                    </span>
                  )}

                  {/* Duration */}
                  <span style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {active && loading ? '···' : track.duration}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {miniPlayer}
        {fullPlayer}
      </div>
    );
  }

  // ─── LIBRARY HOME — Sacred Mandala ────────────────────────────────────────
  const centralColor = currentAlbum?.color ?? T.amber;
  const centralAccent = currentAlbum?.accent;
  const mandalaSize = 460; // total zone width
  const centerSize  = 80;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: currentTrack ? 200 : 100, overflowX: 'hidden' }}>
      {ytHost}

      {/* Ambient mandala bloom */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '60vh', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${centralColor}12 0%, transparent 70%)`,
        transition: 'background 1s ease',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '56px 20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: T.ink1, letterSpacing: '-0.02em' }}>Library</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: T.ink3 }}>{TOTAL_TRACKS} tracks · {ALBUMS.length} albums</p>
          </div>
          {currentTrack && (
            <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'lib-orb-pulse 2s ease-in-out infinite' }}>
              ♫ Now Playing
            </div>
          )}
        </div>

        {/* ── Sacred Mandala ── */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: mandalaSize, position: 'relative', margin: '0 0 8px' }}>

          {/* Outer dashed orbital ring */}
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 390, height: 390,
            border: `1px dashed ${T.ink4}55`,
          }} />
          {/* Inner dashed orbital ring */}
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 262, height: 262,
            border: `1px dashed ${T.ink4}40`,
          }} />
          {/* Glow ring */}
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 100, height: 100,
            border: `1.5px solid ${centralColor}40`,
            boxShadow: `0 0 24px ${centralColor}20`,
            transition: 'border-color 1s, box-shadow 1s',
          }} />

          {/* Outer ring orbs — 6 albums, counter-clockwise, r=195 */}
          {outerRing.map((album, i) => (
            <SatelliteOrb
              key={album.id} album={album} index={i} ringSize={6}
              radius={195} duration={65} direction="ccw"
              isActive={currentAlbum?.id === album.id}
              onClick={() => setOpenAlbum(album)}
            />
          ))}

          {/* Inner ring orbs — 6 albums, clockwise, r=131 */}
          {innerRing.map((album, i) => (
            <SatelliteOrb
              key={album.id} album={album} index={i} ringSize={6}
              radius={131} duration={42} direction="cw"
              isActive={currentAlbum?.id === album.id}
              onClick={() => setOpenAlbum(album)}
            />
          ))}

          {/* Central orb */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            cursor: currentAlbum ? 'pointer' : 'default',
          }} onClick={() => currentAlbum && setIsExpanded(true)}>
            <div style={{
              borderRadius: '50%',
              boxShadow: `0 0 40px ${centralColor}35, 0 0 0 6px ${T.bg}, 0 0 0 7px ${centralColor}30`,
              animation: 'lib-orb-pulse 3s ease-in-out infinite',
              transition: 'box-shadow 1s ease',
            }}>
              <OrbSphere color={centralColor} accent={centralAccent} size={centerSize} glow pulse />
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: T.ink3, textTransform: 'uppercase',
              textAlign: 'center', maxWidth: 80,
            }}>
              {currentAlbum ? currentAlbum.title : 'Anahata'}
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
              border: category === c ? `1.5px solid ${T.amber}70` : `1px solid ${T.bg2}`,
              background: category === c ? T.amberLo : T.bg1,
              color: category === c ? T.amber : T.ink3,
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: category === c ? `0 0 12px ${T.amber}20` : T.shadow,
            }}>{c}</button>
          ))}
        </div>

        {/* Album grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px' }}>
          {filteredAlbums.map(album => {
            const isActive = currentAlbum?.id === album.id && !!currentTrack;
            return (
              <div key={album.id} onClick={() => setOpenAlbum(album)} style={{
                position: 'relative', background: T.bg1,
                border: `1.5px solid ${isActive ? album.color + '50' : T.bg2}`,
                borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.25s',
                boxShadow: isActive ? `0 4px 28px ${album.color}22` : T.shadow,
              }}>
                {isActive && (
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 7, height: 7, borderRadius: '50%', background: album.color, boxShadow: `0 0 8px ${album.color}`, animation: 'lib-orb-pulse 1.4s ease-in-out infinite' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px' }}>
                  <OrbSphere color={album.color} accent={album.accent} size={80} glow={isActive} />
                </div>
                <div style={{ padding: '0 14px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: album.color, marginBottom: 5 }}>{album.genre}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: T.ink1, lineHeight: 1.3, marginBottom: 3 }}>{album.title}</div>
                  <div style={{ fontSize: 11, color: T.ink3, marginBottom: 5 }}>{album.subtitle}</div>
                  <div style={{ fontSize: 10, color: T.ink4, fontFamily: "'JetBrains Mono', monospace" }}>{album.tracks.length} tracks</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {miniPlayer}
      {fullPlayer}
    </div>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────
function MiniPlayer({ track, album, isPlaying, loading, progress, elapsed, ytError, onPlay, onPrev, onNext, onExpand }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    ytError: string | null;
    onPlay(): void; onPrev(): void; onNext(): void; onExpand(): void }) {
  const totalSec  = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  return (
    <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 90, padding: '0 12px' }}>
      <div style={{
        background: 'rgba(250,247,242,0.96)', backdropFilter: 'blur(28px)',
        borderRadius: 22, border: `1.5px solid ${ytError ? '#EF4444' : album.color + '30'}`,
        boxShadow: `0 -2px 32px rgba(28,20,16,0.1), 0 0 0 1px rgba(28,20,16,0.04), 0 8px 32px ${album.color}18`,
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: T.bg2 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: album.color, transition: 'width 1s linear', borderRadius: 99 }} />
        </div>

        {/* Error banner */}
        {ytError && (
          <div style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>⚠ {ytError}</span>
            <a href={`https://www.youtube.com/watch?v=${track.ytId}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textDecoration: 'none', whiteSpace: 'nowrap', padding: '2px 8px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, flexShrink: 0 }}>
              Open YT ↗
            </a>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
          {/* Tap to expand */}
          <button onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0, padding: 0 }}>
            <OrbSphere color={album.color} accent={album.accent} size={40} glow={isPlaying} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
              <div style={{ fontSize: 11, color: ytError ? '#DC2626' : T.ink3, marginTop: 1 }}>
                {loading ? 'Loading…' : ytError ? 'Tap ⏭ to try next track' : `${formatSecs(elapsed)} · −${formatSecs(remaining)}`}
              </div>
            </div>
          </button>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <button onClick={onPrev} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${T.bg2}`, background: T.bg1, cursor: 'pointer', fontSize: 13, color: T.ink3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>⏮</button>
            <button onClick={onPlay} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: loading ? T.bg2 : album.color, color: loading ? T.ink3 : 'white', fontSize: loading ? 10 : 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: loading ? 'none' : `0 4px 18px ${album.color}55`, transition: 'all 0.2s' }}>
              {loading ? '···' : isPlaying ? '▐▐' : '▶'}
            </button>
            <button onClick={onNext} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${T.bg2}`, background: T.bg1, cursor: 'pointer', fontSize: 13, color: T.ink3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>⏭</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Player ─────────────────────────────────────────────────────────────
function FullPlayer({ track, album, isPlaying, loading, progress, elapsed, volume, shuffle, repeat,
  ytError, onPlay, onPrev, onNext, onSeek, onVolume, onShuffle, onRepeat, onCollapse }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    volume: number; shuffle: boolean; repeat: boolean; ytError: string | null;
    onPlay(): void; onPrev(): void; onNext(): void; onSeek(p: number): void;
    onVolume(v: number): void; onShuffle(): void; onRepeat(): void; onCollapse(): void }) {

  const totalSec  = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', background: T.bg, overflowY: 'auto' }}>
      {/* Ambient bloom */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 50% at 50% 20%, ${album.color}20 0%, transparent 65%)` }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '120%', height: '35%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 50% 100%, ${album.color}12 0%, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 22px 16px' }}>
          <button onClick={onCollapse} style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.bg2}`, cursor: 'pointer', background: T.bg1, color: T.ink2, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
            ↓
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: album.color }}>Now Playing</div>
            <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>{album.title}</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Orb */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 20px' }}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              padding: 12, borderRadius: '50%',
              background: `radial-gradient(circle, ${album.color}18, transparent 70%)`,
              animation: 'lib-orb-pulse 4s ease-in-out infinite',
            }}>
              <OrbSphere color={album.color} accent={album.accent} size={220} glow pulse={isPlaying && !loading} />
            </div>
            {loading && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, color: T.ink3, fontWeight: 600, letterSpacing: '0.08em', background: 'rgba(250,247,242,0.85)', padding: '6px 14px', borderRadius: 20 }}>
                Loading…
              </div>
            )}
            <WaveVisualizer color={album.color} active={isPlaying && !loading} />
          </div>
        </div>

        {/* Track info */}
        <div style={{ padding: '0 28px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: T.ink1, letterSpacing: '-0.02em', marginBottom: 4 }}>{track.title}</div>
          <div style={{ fontSize: 14, color: T.ink3 }}>{track.artist}</div>
          {ytError && (
            <div style={{ marginTop: 10, padding: '10px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>⚠ {ytError}</span>
              <a href={`https://www.youtube.com/watch?v=${track.ytId}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', textDecoration: 'none', padding: '4px 14px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10 }}>
                Listen on YouTube ↗
              </a>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ padding: '0 28px 8px' }}>
          <div onClick={handleProgressClick} style={{ height: 6, background: T.bg2, borderRadius: 99, cursor: 'pointer', position: 'relative', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${album.color}, ${album.color}BB)`, borderRadius: 99, transition: 'width 1s linear' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: 18, height: 18, borderRadius: '50%', background: album.color, boxShadow: `0 0 14px ${album.color}70`, border: `2px solid ${T.bg}`, transition: 'left 1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace" }}>{formatSecs(elapsed)}</span>
            <span style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace" }}>−{formatSecs(remaining)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '16px 28px 18px' }}>
          <button onClick={onShuffle} style={{ width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', background: shuffle ? T.amberLo : T.bg1, color: shuffle ? T.amber : T.ink3, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: shuffle ? `1.5px solid ${T.amber}50` : `1px solid ${T.bg2}`, transition: 'all 0.2s', boxShadow: T.shadow }}>
            ⇄
          </button>
          <button onClick={onPrev} style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${T.bg2}`, cursor: 'pointer', background: T.bg1, color: T.ink2, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>⏮</button>
          <button onClick={onPlay} style={{ width: 76, height: 76, borderRadius: '50%', border: 'none', cursor: 'pointer', background: loading ? T.bg2 : album.color, color: loading ? T.ink3 : 'white', fontSize: loading ? 12 : 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: loading ? T.shadow : `0 8px 32px ${album.color}60`, transition: 'all 0.3s' }}>
            {loading ? '···' : isPlaying ? '▐▐' : '▶'}
          </button>
          <button onClick={onNext} style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${T.bg2}`, cursor: 'pointer', background: T.bg1, color: T.ink2, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>⏭</button>
          <button onClick={onRepeat} style={{ width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', background: repeat ? T.amberLo : T.bg1, color: repeat ? T.amber : T.ink3, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: repeat ? `1.5px solid ${T.amber}50` : `1px solid ${T.bg2}`, transition: 'all 0.2s', boxShadow: T.shadow }}>
            ↻
          </button>
        </div>

        {/* Volume */}
        <div style={{ padding: '0 32px 44px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink4} strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
          <input type="range" min={0} max={100} value={volume} onChange={e => onVolume(Number(e.target.value))}
            style={{ flex: 1, accentColor: album.color, height: 4, cursor: 'pointer' }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink4} strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </div>
      </div>
    </div>
  );
}
