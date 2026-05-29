import React from 'react';

const BRAINWAVE_COLOURS = {
  Delta: '#818cf8',
  Theta: '#a78bfa',
  Alpha: '#34d399',
  Beta:  '#fbbf24',
  Gamma: '#f472b6',
};

const INSTRUMENT_ICONS = {
  sitar: '\uD83C\uDFB8', bansuri: '\uD83C\uDFB5', tabla: '\uD83E\uDD41',
  tanpura: '\uD83C\uDFB9', santoor: '\u2728', sarod: '\uD83C\uDFBC',
  veena: '\uD83C\uDFB7', shehnai: '\uD83C\uDFBA', mridangam: '\uD83E\uDD41',
  harmonium: '\uD83C\uDFB9',
};

export default function TrackCard({ track, isPlaying, onPlay, fmtDur }) {
  const bwColour = BRAINWAVE_COLOURS[track.brainwave] || 'var(--t3)';

  return (
    <div
      className="card"
      style={{
        display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
        cursor:'pointer',
        borderColor: isPlaying ? 'rgba(109,74,255,0.4)' : undefined,
        background: isPlaying ? 'linear-gradient(135deg, rgba(109,74,255,0.06) 0%, var(--bg-1) 100%)' : undefined,
        transition:'all var(--dur) var(--ease)'
      }}
      onClick={onPlay}
    >
      {/* Play Icon */}
      <div style={{
        width:38, height:38, borderRadius:'50%', flexShrink:0,
        background: isPlaying ? 'var(--accent)' : 'var(--bg-2)',
        border:`1px solid ${isPlaying ? 'var(--accent)':'var(--border)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'all var(--dur) var(--ease)',
        boxShadow: isPlaying ? '0 4px 16px rgba(109,74,255,0.35)' : 'none'
      }}>
        {isPlaying
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{color:'var(--t2)',marginLeft:1}}><path d="M8 5v14l11-7z"/></svg>
        }
      </div>

      {/* Track Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>
          {track.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {track.brainwave && (
            <span style={{ fontSize:10, fontWeight:600, color:bwColour, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {track.brainwave}
            </span>
          )}
          {track.binauralHz && (
            <span style={{ fontSize:10, color:'var(--t3)' }}>{track.binauralHz}Hz</span>
          )}
          <span style={{ fontSize:10, color:'var(--t3)' }}>· {fmtDur(track.duration)}</span>
          <span style={{ fontSize:11 }}>
            {track.instruments.slice(0,2).map(i => INSTRUMENT_ICONS[i] || '\uD83C\uDFB5').join(' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
