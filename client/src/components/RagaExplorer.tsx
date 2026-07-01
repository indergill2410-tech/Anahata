import React from 'react';
import { Album } from '../data/libraryData';

const T = {
  bg:    '#FAF7F2',
  bg1:   '#FFFFFF',
  bg2:   '#F0EBE3',
  ink1:  '#1C1410',
  ink2:  '#4A3828',
  ink3:  '#8B6F5E',
  ink4:  '#C4AFA4',
  amber: '#D97706',
  shadow: '0 2px 16px rgba(28,20,16,0.08)',
};

const TIME_OF_DAY_ALBUM_ID: Record<'morning' | 'evening' | 'night', string> = {
  morning: 'raga-prahar',
  evening: 'raga-sandhya',
  night:   'raga-ratri',
};

function currentWindow(): 'morning' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 4 && h < 12)  return 'morning';
  if (h >= 12 && h < 20) return 'evening';
  return 'night';
}

interface RagaExplorerProps {
  albums: Album[];
  onOpenAlbum(album: Album): void;
  onClose(): void;
}

export default function RagaExplorer({ albums, onOpenAlbum, onClose }: RagaExplorerProps) {
  const window_ = currentWindow();
  const rightNow = albums.find(a => a.id === TIME_OF_DAY_ALBUM_ID[window_]);

  const byGenre = new Map<string, Album[]>();
  albums.forEach(a => {
    if (!byGenre.has(a.genre)) byGenre.set(a.genre, []);
    byGenre.get(a.genre)!.push(a);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: T.bg, overflowY: 'auto' }}>
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.bg2}`, cursor: 'pointer',
          background: T.bg1, color: T.ink2, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow,
        }}>↓</button>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: T.ink1 }}>Explore</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: T.ink3 }}>What each collection is, and when it fits</p>
        </div>
      </div>

      {rightNow && (
        <div style={{ margin: '18px 16px', padding: '18px 20px', borderRadius: 22, background: `${rightNow.color}12`, border: `1px solid ${rightNow.color}30` }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: rightNow.color, marginBottom: 8 }}>
            Fits right now · {window_}
          </div>
          <button onClick={() => onOpenAlbum(rightNow)} style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: `radial-gradient(circle at 35% 35%, ${rightNow.accent}CC, ${rightNow.color} 55%, ${rightNow.color}88)`,
              boxShadow: `0 4px 16px ${rightNow.color}40`,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink1 }}>{rightNow.title}</div>
              <div style={{ fontSize: 12, color: T.ink3, marginTop: 2, lineHeight: 1.5 }}>{rightNow.description}</div>
            </div>
          </button>
        </div>
      )}

      <div style={{ padding: '4px 16px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[...byGenre.entries()].map(([genre, genreAlbums]) => (
          <div key={genre}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink3, marginBottom: 10 }}>
              {genre}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {genreAlbums.map(album => (
                <button key={album.id} onClick={() => onOpenAlbum(album)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  background: T.bg1, border: `1px solid ${T.bg2}`, borderRadius: 16, padding: '12px 14px',
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadow,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle at 35% 35%, ${album.accent}CC, ${album.color} 55%, ${album.color}88)`,
                  }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink1 }}>{album.title}</div>
                    <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>{album.subtitle}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.ink4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{album.tracks.length}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
