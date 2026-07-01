import React, { useState } from 'react';
import { ALBUMS, CATEGORIES, TOTAL_TRACKS, getAlbumsByCategory, Album } from '../data/libraryData';
import { useTrackPlayer } from '../context/TrackPlayerContext';
import RagaExplorer from '../components/RagaExplorer';

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
  const [category,  setCategory]  = useState('All');
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);

  const {
    currentTrack, currentAlbum, isPlaying, isExpanded, progress, elapsed,
    loading, ytError, playTrack, togglePlay, playPrev, playNext,
    handleShuffle, setIsExpanded,
  } = useTrackPlayer();

  const filteredAlbums = getAlbumsByCategory(category);
  const innerRing = ALBUMS.slice(0, 6);
  const outerRing = ALBUMS.slice(6, 12);

  // ─── EXPLORER ──────────────────────────────────────────────────────────────
  if (showExplorer) {
    return (
      <RagaExplorer
        albums={ALBUMS}
        onOpenAlbum={album => { setShowExplorer(false); setOpenAlbum(album); }}
        onClose={() => setShowExplorer(false)}
      />
    );
  }

  // ─── ALBUM DETAIL ──────────────────────────────────────────────────────────
  if (openAlbum) {
    const album = openAlbum;
    return (
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: currentTrack ? 200 : 100 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentTrack && (
              <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'lib-orb-pulse 2s ease-in-out infinite' }}>
                ♫ Now Playing
              </div>
            )}
            <button onClick={() => setShowExplorer(true)} title="Explore collections" style={{
              width: 38, height: 38, borderRadius: '50%', border: `1px solid ${T.bg2}`, cursor: 'pointer',
              background: T.bg1, color: T.ink2, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow,
            }}>
              ✦
            </button>
          </div>
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
        <div className="stagger-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px' }}>
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
    </div>
  );
}
