import React, { useState } from 'react';
import { useSoundEngine, INTENTIONS } from '../context/SoundEngineContext';

interface Track {
  id: string; title: string; mood: string; duration: string;
  bw: string; hz: number; desc: string; color: string; emoji: string;
}

const TRACKS: Track[] = [
  { id:'1',  title:'Deep Delta Sleep',   mood:'Sleep',   duration:'28 min', bw:'Delta', hz:2,  desc:'Ocean waves + 432Hz drone',         color:'#3B5BDB', emoji:'🌊' },
  { id:'2',  title:'Theta Dreamweave',   mood:'Dream',   duration:'22 min', bw:'Theta', hz:6,  desc:'Crystal bowls + binaural Theta',    color:'#7048E8', emoji:'🌙' },
  { id:'3',  title:'Alpha Flow State',   mood:'Focus',   duration:'18 min', bw:'Alpha', hz:10, desc:'Forest ambience + Alpha waves',      color:'#0CA678', emoji:'🌿' },
  { id:'4',  title:'Morning Clarity',    mood:'Energy',  duration:'15 min', bw:'Beta',  hz:14, desc:'Tibetan bells + Beta activation',    color:'#F59F00', emoji:'☀️' },
  { id:'5',  title:'Deep Heal 432Hz',    mood:'Healing', duration:'30 min', bw:'Theta', hz:7,  desc:'Solfeggio 528Hz + deep drone',       color:'#E64980', emoji:'💗' },
  { id:'6',  title:'Yaman Evening Raga', mood:'Relax',   duration:'25 min', bw:'Alpha', hz:9,  desc:'Raga Yaman + sine harmonics',        color:'#7048E8', emoji:'🪷' },
  { id:'7',  title:'Gamma Peak Focus',   mood:'Focus',   duration:'20 min', bw:'Gamma', hz:40, desc:'High Gamma + rhythmic pulses',       color:'#F59F00', emoji:'⚡' },
  { id:'8',  title:'Bhairavi Dawn',      mood:'Peace',   duration:'27 min', bw:'Delta', hz:3,  desc:'Raga Bhairavi + 174Hz foundation',   color:'#3B5BDB', emoji:'🕊️' },
  { id:'9',  title:'Ocean Theta',        mood:'Dream',   duration:'24 min', bw:'Theta', hz:5,  desc:'Deep ocean + 396Hz liberation',      color:'#0CA678', emoji:'🐚' },
  { id:'10', title:'Forest Alpha Bath',  mood:'Relax',   duration:'19 min', bw:'Alpha', hz:11, desc:'Rain forest + binaural healing',     color:'#7048E8', emoji:'🌲' },
  { id:'11', title:'Darbari Night',      mood:'Sleep',   duration:'32 min', bw:'Delta', hz:1,  desc:'Raga Darbari + 396Hz + Delta',       color:'#3B5BDB', emoji:'🌌' },
];

const MOODS = ['All', 'Sleep', 'Dream', 'Focus', 'Energy', 'Healing', 'Relax', 'Peace'];
const BW_TO_INTENTION: Record<string, string> = {
  Delta: 'sleep', Theta: 'meditate', Alpha: 'focus', Beta: 'energize', Gamma: 'focus',
};

interface LibraryPageProps {
  onTabChange?: (tab: 'journey' | 'library' | 'studio' | 'journal' | 'profile') => void;
}

export default function LibraryPage({ onTabChange }: LibraryPageProps) {
  const engine = useSoundEngine();
  const [filter, setFilter]       = useState('All');
  const [playing, setPlaying]     = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const filtered = filter === 'All' ? TRACKS : TRACKS.filter(t => t.mood === filter);

  function playTrack(track: Track) {
    const intention = BW_TO_INTENTION[track.bw] || 'meditate';
    const preset = (INTENTIONS as Record<string, typeof INTENTIONS[keyof typeof INTENTIONS]>)[intention];
    engine.applyMix({
      intention,
      settings: {
        binaural:   { hz: track.hz, carrierHz: preset?.carrierHz || 200 },
        drone:      { type: preset?.drone || 'tanpura' },
        instrument: { type: preset?.instrument || 'bansuri' },
        nature:     { type: preset?.nature || 'rain' },
        solfeggio:  { hz: preset?.solfeggio || 528 },
      },
      layers: {
        binaural:   { active: true,               volume: 0.7, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.10 },
        drone:      { active: !!preset?.drone,    volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.20 },
        instrument: { active: !!preset?.instrument, volume: 0.4, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.30 },
        nature:     { active: !!preset?.nature,   volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.15 },
        solfeggio:  { active: true,               volume: 0.3, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.40 },
      },
    });
    engine.start();
    setPlaying(track.id);
    onTabChange?.('journey');
  }

  return (
    <div className="dashboard fade-in" style={{ gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--ink1)', letterSpacing: '-0.02em' }}>Library</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink3)' }}>{TRACKS.length} curated journeys</p>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'JetBrains Mono', monospace" }}>
          {filtered.length} shown
        </div>
      </div>

      {/* Filter chips */}
      <div className="lib-filter-row">
        {MOODS.map(mood => (
          <button key={mood} onClick={() => setFilter(mood)} className={`lib-chip ${filter === mood ? 'active' : ''}`}>
            {mood}
          </button>
        ))}
      </div>

      {/* 2-col grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>No tracks found.</div>
      ) : (
        <div className="lib-grid">
          {filtered.map(track => {
            const isPlaying = playing === track.id;
            const isOpen    = expanded === track.id;
            return (
              <div key={track.id} className="lib-card" style={{ '--lc': track.color } as React.CSSProperties}
                onClick={() => setExpanded(isOpen ? null : track.id)}>

                {/* Background gradient */}
                <div className="lib-card-bg" />

                {/* Top: emoji + bw badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="lib-emoji">{track.emoji}</span>
                  <span className="lib-bw-badge">{track.bw}</span>
                </div>

                {/* Title */}
                <h3 className="lib-title">{track.title}</h3>

                {/* Desc (expanded) */}
                {isOpen && <p className="lib-desc">{track.desc}</p>}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
                  <span className="lib-duration">{track.duration}</span>
                  <button className={`lib-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={e => { e.stopPropagation(); playTrack(track); }}>
                    {isPlaying ? '▐▐' : '▶'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
