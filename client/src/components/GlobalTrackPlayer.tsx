import React from 'react';
import { useTrackPlayer, parseDuration, formatSecs } from '../context/TrackPlayerContext';
import { Track, Album } from '../data/libraryData';

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
  shadow:   '0 2px 16px rgba(28,20,16,0.08)',
};

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

const SLEEP_OPTIONS = [10, 20, 30, 45, 60];

export default function GlobalTrackPlayer() {
  const p = useTrackPlayer();
  if (!p.currentTrack || !p.currentAlbum) return null;

  return (
    <>
      <MiniPlayer
        track={p.currentTrack} album={p.currentAlbum} isPlaying={p.isPlaying} loading={p.loading}
        progress={p.progress} elapsed={p.elapsed}
        onPlay={p.togglePlay} onPrev={p.playPrev} onNext={p.playNext} onExpand={() => p.setIsExpanded(true)}
      />
      {p.isExpanded && (
        <FullPlayer
          track={p.currentTrack} album={p.currentAlbum} isPlaying={p.isPlaying} loading={p.loading}
          progress={p.progress} elapsed={p.elapsed} volume={p.volume} shuffle={p.shuffle} repeat={p.repeat}
          sleepTimerMinutes={p.sleepTimerMinutes}
          queue={p.queue} isFavorite={p.isFavorite(p.currentTrack.id)}
          onPlay={p.togglePlay} onPrev={p.playPrev} onNext={p.playNext} onSeek={p.handleSeek}
          onVolume={p.handleVolume} onShuffle={() => p.handleShuffle(p.currentAlbum!)}
          onRepeat={p.toggleRepeat} onCollapse={() => p.setIsExpanded(false)}
          onSleepTimer={p.setSleepTimer}
          onToggleFavorite={() => p.toggleFavorite(p.currentTrack!.id)}
          onPlayFromQueue={p.playFromQueue}
        />
      )}
    </>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────
function MiniPlayer({ track, album, isPlaying, loading, progress, elapsed, onPlay, onPrev, onNext, onExpand }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    onPlay(): void; onPrev(): void; onNext(): void; onExpand(): void }) {
  const totalSec  = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  return (
    <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 90, padding: '0 12px' }}>
      <div style={{
        background: 'rgba(250,247,242,0.96)', backdropFilter: 'blur(28px)',
        borderRadius: 22, border: `1.5px solid ${album.color}30`,
        boxShadow: `0 -2px 32px rgba(28,20,16,0.1), 0 0 0 1px rgba(28,20,16,0.04), 0 8px 32px ${album.color}18`,
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: T.bg2 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: album.color, transition: 'width 1s linear', borderRadius: 99 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
          {/* Tap to expand */}
          <button onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0, padding: 0 }}>
            <OrbSphere color={album.color} accent={album.accent} size={40} glow={isPlaying} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
              <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>
                {loading ? 'Loading…' : `${formatSecs(elapsed)} · −${formatSecs(remaining)}`}
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
  sleepTimerMinutes, queue, isFavorite,
  onPlay, onPrev, onNext, onSeek, onVolume, onShuffle, onRepeat, onCollapse, onSleepTimer,
  onToggleFavorite, onPlayFromQueue }:
  { track: Track; album: Album; isPlaying: boolean; loading: boolean; progress: number; elapsed: number;
    volume: number; shuffle: boolean; repeat: boolean; sleepTimerMinutes: number | null;
    queue: Track[]; isFavorite: boolean;
    onPlay(): void; onPrev(): void; onNext(): void; onSeek(p: number): void;
    onVolume(v: number): void; onShuffle(): void; onRepeat(): void; onCollapse(): void;
    onSleepTimer(minutes: number | null): void;
    onToggleFavorite(): void; onPlayFromQueue(track: Track): void }) {

  const [showSleepMenu, setShowSleepMenu] = React.useState(false);
  const [showQueue, setShowQueue] = React.useState(false);
  const upNext = queue.slice(queue.findIndex(t => t.id === track.id) + 1);
  const totalSec  = parseDuration(track.duration);
  const remaining = Math.max(0, totalSec - elapsed);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  }
  function handleProgressDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    handleProgressClick(e);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onToggleFavorite} title={isFavorite ? 'Remove favorite' : 'Add favorite'} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: isFavorite ? `1.5px solid #E64980` : `1px solid ${T.bg2}`,
              cursor: 'pointer', background: isFavorite ? 'rgba(230,73,128,0.1)' : T.bg1,
              color: isFavorite ? '#E64980' : T.ink2, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow,
            }}>
              {isFavorite ? '♥' : '♡'}
            </button>
            {upNext.length > 0 && (
              <button onClick={() => setShowQueue(true)} title="Up next" style={{
                width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.bg2}`,
                cursor: 'pointer', background: T.bg1, color: T.ink2, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow,
              }}>
                ☰
              </button>
            )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSleepMenu(s => !s)} title="Sleep timer" style={{
              width: 36, height: 36, borderRadius: '50%',
              border: sleepTimerMinutes != null ? `1.5px solid ${T.amber}70` : `1px solid ${T.bg2}`,
              cursor: 'pointer', background: sleepTimerMinutes != null ? T.amberLo : T.bg1,
              color: sleepTimerMinutes != null ? T.amber : T.ink2, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow,
            }}>
              🌙
            </button>
            {showSleepMenu && (
              <div style={{
                position: 'absolute', top: 46, right: 0, background: T.bg1, border: `1px solid ${T.bg2}`,
                borderRadius: 14, boxShadow: '0 12px 40px rgba(28,20,16,0.18)', padding: 6, zIndex: 5, width: 140,
              }}>
                {sleepTimerMinutes != null && (
                  <button onClick={() => { onSleepTimer(null); setShowSleepMenu(false); }} style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                    background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#DC2626',
                  }}>
                    Cancel timer
                  </button>
                )}
                {SLEEP_OPTIONS.map(m => (
                  <button key={m} onClick={() => { onSleepTimer(m); setShowSleepMenu(false); }} style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                    background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.ink2,
                  }}>
                    {m} min
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {sleepTimerMinutes != null && (
          <div style={{ textAlign: 'center', fontSize: 11, color: T.amber, fontWeight: 700, marginTop: -8, marginBottom: 8 }}>
            🌙 Fading out in {sleepTimerMinutes} min
          </div>
        )}

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
        </div>

        {/* Progress */}
        <div style={{ padding: '0 28px 8px' }}>
          <div
            onClick={handleProgressClick}
            onPointerDown={handleProgressClick}
            onPointerMove={handleProgressDrag}
            style={{ height: 6, background: T.bg2, borderRadius: 99, cursor: 'pointer', position: 'relative', marginBottom: 10, touchAction: 'none' }}
          >
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

      {showQueue && (
        <div onClick={() => setShowQueue(false)} style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(28,20,16,0.35)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxHeight: '70vh', overflowY: 'auto', background: T.bg1,
            borderRadius: '22px 22px 0 0', padding: '18px 8px 28px', boxShadow: '0 -12px 48px rgba(28,20,16,0.2)',
          }}>
            <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: T.ink1 }}>Up Next</span>
              <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ink3, fontSize: 14 }}>✕</button>
            </div>
            {upNext.map((t, i) => (
              <button key={t.id} onClick={() => { onPlayFromQueue(t); setShowQueue(false); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace", width: 18, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: T.ink3 }}>{t.artist}</div>
                </div>
                <span style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{t.duration}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
