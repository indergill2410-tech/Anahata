import React, { useState } from 'react';
import { useSoundEngine, INTENTIONS } from '../context/SoundEngineContext';
import AnahataOrb, { OrbId } from '../components/AnahataOrb';

const MOOD_TO_ORB: Record<string, OrbId> = {
  Sleep: 'int-sleep', Focus: 'int-focus', Healing: 'int-heal',
  Dream: 'int-dream', Energy: 'int-energy', Relax: 'int-peace', Peace: 'int-peace',
};

interface Track {
  id: string;
  title: string;
  mood: string;
  duration: string;
  bw: string;
  hz: number;
  desc: string;
  color: string;
}

const TRACKS: Track[] = [
  { id:'1',  title:'Deep Delta Sleep',   mood:'Sleep',   duration:'28 min', bw:'Delta', hz:2,  desc:'Slow ocean waves + 432Hz drone',        color:'#3B5BDB' },
  { id:'2',  title:'Theta Dreamweave',   mood:'Dream',   duration:'22 min', bw:'Theta', hz:6,  desc:'Crystal bowls + binaural Theta',         color:'#7048E8' },
  { id:'3',  title:'Alpha Flow State',   mood:'Focus',   duration:'18 min', bw:'Alpha', hz:10, desc:'Forest ambience + Alpha entrainment',     color:'#0CA678' },
  { id:'4',  title:'Morning Clarity',    mood:'Energy',  duration:'15 min', bw:'Beta',  hz:14, desc:'Tibetan bells + Beta activation',         color:'#F59F00' },
  { id:'5',  title:'Deep Heal 432Hz',    mood:'Healing', duration:'30 min', bw:'Theta', hz:7,  desc:'Solfeggio 528Hz + deep drone',            color:'#E64980' },
  { id:'6',  title:'Yaman Evening Raga', mood:'Relax',   duration:'25 min', bw:'Alpha', hz:9,  desc:'Raga Yaman + sine harmonics',             color:'#7048E8' },
  { id:'7',  title:'Gamma Peak Focus',   mood:'Focus',   duration:'20 min', bw:'Gamma', hz:40, desc:'High Gamma + rhythmic pulses',            color:'#F59F00' },
  { id:'8',  title:'Bhairavi Dawn',      mood:'Peace',   duration:'27 min', bw:'Delta', hz:3,  desc:'Raga Bhairavi + 174Hz foundation',        color:'#3B5BDB' },
  { id:'9',  title:'Ocean Theta',        mood:'Dream',   duration:'24 min', bw:'Theta', hz:5,  desc:'Deep ocean + 396Hz liberation',           color:'#0CA678' },
  { id:'10', title:'Forest Alpha Bath',  mood:'Relax',   duration:'19 min', bw:'Alpha', hz:11, desc:'Rain forest + binaural healing',          color:'#7048E8' },
  { id:'11', title:'Darbari Night',      mood:'Sleep',   duration:'32 min', bw:'Delta', hz:1,  desc:'Raga Darbari + 396Hz + Delta',            color:'#3B5BDB' },
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
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? TRACKS : TRACKS.filter(t => t.mood === filter);
  const featured = filtered[0];
  const rest = filtered.slice(1);

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
        binaural:   { active: true,              volume: 0.7, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.10 },
        drone:      { active: !!preset?.drone,   volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.20 },
        instrument: { active: !!preset?.instrument, volume: 0.4, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.30 },
        nature:     { active: !!preset?.nature,  volume: 0.5, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.15 },
        solfeggio:  { active: true,              volume: 0.3, pan: 0, mute: false, solo: false, eq: { bass:0, mid:0, treble:0 }, reverb: 0.40 },
      },
    });
    engine.start();
    onTabChange?.('journey');
  }

  return (
    <div className="dashboard fade-in">
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--ink1)', margin: 0, letterSpacing: '-0.01em' }}>
          Library
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '2px 0 0' }}>11 curated journeys</p>
      </div>

      {/* Mood filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {MOODS.map(mood => (
          <button
            key={mood}
            onClick={() => setFilter(mood)}
            style={{
              flexShrink: 0,
              height: 32,
              padding: '0 14px',
              borderRadius: 'var(--rf)',
              border: `1px solid ${filter === mood ? 'rgba(112,72,232,0.4)' : 'var(--border)'}`,
              background: filter === mood ? 'var(--violet)' : 'var(--bg1)',
              color: filter === mood ? '#fff' : 'var(--ink2)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all var(--dur) var(--ease)',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow)',
            }}
          >
            {mood}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>
          No tracks found.
        </div>
      )}

      {/* Featured card */}
      {featured && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex' }}>
            {/* Color strip */}
            <div style={{ width: 6, background: featured.color, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '16px 16px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AnahataOrb id={MOOD_TO_ORB[featured.mood] || 'int-peace'} size={36} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: featured.color, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {featured.bw} · {featured.hz}Hz
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--rf)',
                      background: `${featured.color}15`, color: featured.color, border: `1px solid ${featured.color}30`,
                    }}>
                      {featured.mood}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--ink1)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                    {featured.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '0 0 12px' }}>{featured.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => playTrack(featured)}
                      style={{
                        background: featured.color, color: '#fff', border: 'none',
                        borderRadius: 'var(--rf)', padding: '8px 20px',
                        fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', boxShadow: `0 4px 14px ${featured.color}40`,
                        transition: 'all var(--dur)',
                      }}
                    >
                      ▶ Play
                    </button>
                    <span style={{
                      fontSize: 11, color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--bg2)', padding: '4px 10px', borderRadius: 'var(--rf)',
                      border: '1px solid var(--border)',
                    }}>
                      {featured.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track list */}
      {rest.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rest.map(track => (
            <button
              key={track.id}
              onClick={() => playTrack(track)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg1)',
                border: '1px solid var(--border)', borderRadius: 'var(--r)',
                boxShadow: 'var(--shadow)', cursor: 'pointer',
                textAlign: 'left', width: '100%', fontFamily: 'inherit',
                transition: 'all var(--dur)',
              }}
            >
              {/* Mood orb */}
              <AnahataOrb id={MOOD_TO_ORB[track.mood] || 'int-peace'} size={28} />

              {/* Title + desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink1)', lineHeight: 1.3, marginBottom: 2 }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{track.desc}</div>
              </div>

              {/* Mood tag */}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--rf)',
                background: `${track.color}12`, color: track.color, border: `1px solid ${track.color}25`,
                flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {track.mood}
              </span>

              {/* Duration */}
              <span style={{
                fontSize: 10, color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}>
                {track.duration}
              </span>

              {/* Chevron */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink4)" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
