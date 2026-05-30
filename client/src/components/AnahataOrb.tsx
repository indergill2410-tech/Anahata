import React from 'react';

export type OrbId =
  // Moods
  | 'mood-rough' | 'mood-okay' | 'mood-good' | 'mood-great' | 'mood-blissful'
  // Brainwaves
  | 'bw-delta' | 'bw-theta' | 'bw-alpha' | 'bw-beta' | 'bw-gamma'
  // Intentions
  | 'int-sleep' | 'int-focus' | 'int-heal' | 'int-dream' | 'int-energy' | 'int-peace'
  // Elements
  | 'el-water' | 'el-earth' | 'el-fire' | 'el-air' | 'el-ether';

interface AnahataOrbProps {
  id: OrbId;
  size?: number;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface OrbDef {
  gradId: string;
  glow: string;
  ringColor: string;
  defs: React.ReactElement;
  inner: React.ReactElement;
}

const ORBS: Record<OrbId, OrbDef> = {
  'mood-rough': {
    gradId: 'grad-mood-rough',
    glow: 'rgba(251,113,133,0.45)',
    ringColor: '#fb7185',
    defs: (
      <defs>
        <radialGradient id="grad-mood-rough" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="55%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#be185d" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Storm cloud */}
        <ellipse cx="32" cy="30" rx="11" ry="6" fill="rgba(255,255,255,0.25)" />
        <ellipse cx="26" cy="32" rx="7" ry="5" fill="rgba(255,255,255,0.22)" />
        <ellipse cx="38" cy="32" rx="7" ry="5" fill="rgba(255,255,255,0.22)" />
        {/* Lightning bolt */}
        <polyline points="33,36 29,43 32,43 28,51" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Rain drops */}
        <line x1="24" y1="40" x2="22" y2="46" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="38" y1="38" x2="36" y2="44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="43" y1="42" x2="41" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    ),
  },

  'mood-okay': {
    gradId: 'grad-mood-okay',
    glow: 'rgba(251,191,36,0.45)',
    ringColor: '#fbbf24',
    defs: (
      <defs>
        <radialGradient id="grad-mood-okay" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Horizon line */}
        <line x1="18" y1="42" x2="46" y2="42" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Half sun */}
        <path d="M32 42 A9 9 0 0 1 23 42 Z" fill="rgba(255,255,255,0.0)" />
        <path d="M23 42 A9 9 0 0 1 41 42" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="rgba(255,255,255,0.25)" />
        {/* Sun rays */}
        <line x1="32" y1="29" x2="32" y2="26" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="39" y1="31" x2="41" y2="29" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="31" x2="23" y2="29" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="37" x2="45" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="37" x2="19" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  },

  'mood-good': {
    gradId: 'grad-mood-good',
    glow: 'rgba(16,185,129,0.45)',
    ringColor: '#10b981',
    defs: (
      <defs>
        <radialGradient id="grad-mood-good" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#065f46" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* 5-petal lotus */}
        <ellipse cx="32" cy="26" rx="4.5" ry="8" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="32" cy="26" rx="4.5" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(72 32 32)" />
        <ellipse cx="32" cy="26" rx="4.5" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(144 32 32)" />
        <ellipse cx="32" cy="26" rx="4.5" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(216 32 32)" />
        <ellipse cx="32" cy="26" rx="4.5" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(288 32 32)" />
        {/* Centre dot */}
        <circle cx="32" cy="32" r="3.5" fill="rgba(255,255,255,0.85)" />
      </g>
    ),
  },

  'mood-great': {
    gradId: 'grad-mood-great',
    glow: 'rgba(59,130,246,0.45)',
    ringColor: '#3b82f6',
    defs: (
      <defs>
        <radialGradient id="grad-mood-great" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* 8-point burst star */}
        <polygon points="32,18 34,28 44,26 36,32 44,38 34,36 32,46 30,36 20,38 28,32 20,26 30,28" fill="rgba(255,255,255,0.5)" />
        {/* Orbit ellipse ring */}
        <ellipse cx="32" cy="32" rx="16" ry="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" transform="rotate(-20 32 32)" />
        {/* Orbiting dot */}
        <circle cx="45" cy="24" r="2.5" fill="rgba(255,255,255,0.85)" />
      </g>
    ),
  },

  'mood-blissful': {
    gradId: 'grad-mood-blissful',
    glow: 'rgba(167,139,250,0.45)',
    ringColor: '#a78bfa',
    defs: (
      <defs>
        <radialGradient id="grad-mood-blissful" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Infinity symbol ∞ */}
        <path d="M20 32 C20 26 26 26 32 32 C38 38 44 38 44 32 C44 26 38 26 32 32 C26 38 20 38 20 32 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 4 corner stars */}
        <polygon points="16,18 17,21 20,18 17,15" fill="rgba(255,255,255,0.7)" />
        <polygon points="48,18 49,21 52,18 49,15" fill="rgba(255,255,255,0.7)" />
        <polygon points="16,46 17,49 20,46 17,43" fill="rgba(255,255,255,0.7)" />
        <polygon points="48,46 49,49 52,46 49,43" fill="rgba(255,255,255,0.7)" />
        {/* Double dashed outer ring */}
        <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" strokeDasharray="3,5" />
        <circle cx="32" cy="32" r="25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2,7" />
      </g>
    ),
  },

  'bw-delta': {
    gradId: 'grad-bw-delta',
    glow: 'rgba(29,78,216,0.45)',
    ringColor: '#1d4ed8',
    defs: (
      <defs>
        <radialGradient id="grad-bw-delta" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Slow wide sine wave */}
        <path d="M14 36 Q20 26 26 36 Q32 46 38 36 Q44 26 50 36" stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* δ Greek letter */}
        <text x="16" y="26" fontSize="11" fill="rgba(255,255,255,0.7)" fontFamily="serif" fontStyle="italic">δ</text>
        {/* zzz rising top-right */}
        <text x="40" y="22" fontSize="8" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">z</text>
        <text x="44" y="18" fontSize="7" fill="rgba(255,255,255,0.45)" fontFamily="sans-serif">z</text>
        <text x="47" y="14" fontSize="6" fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">z</text>
      </g>
    ),
  },

  'bw-theta': {
    gradId: 'grad-bw-theta',
    glow: 'rgba(112,72,232,0.45)',
    ringColor: '#7048E8',
    defs: (
      <defs>
        <radialGradient id="grad-bw-theta" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="55%" stopColor="#7048E8" />
          <stop offset="100%" stopColor="#2e1065" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Spiral */}
        <path d="M32 32 Q36 28 36 32 Q36 38 30 38 Q24 38 24 32 Q24 24 32 24 Q42 24 42 34" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Crescent moon top-right */}
        <path d="M45 14 A7 7 0 1 1 45 28 A4 4 0 1 0 45 14Z" fill="rgba(255,255,255,0.6)" />
        {/* 2 small stars */}
        <polygon points="18,18 19,21 22,18 19,15" fill="rgba(255,255,255,0.6)" />
        <polygon points="22,28 23,31 26,28 23,25" fill="rgba(255,255,255,0.5)" />
      </g>
    ),
  },

  'bw-alpha': {
    gradId: 'grad-bw-alpha',
    glow: 'rgba(5,150,105,0.45)',
    ringColor: '#059669',
    defs: (
      <defs>
        <radialGradient id="grad-bw-alpha" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Two flowing sine waves */}
        <path d="M14 34 Q18 28 22 34 Q26 40 30 34 Q34 28 38 34 Q42 40 50 34" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M14 38 Q20 32 26 38 Q32 44 38 38 Q44 32 50 38" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="2,3" />
        {/* Leaf at top */}
        <path d="M32 14 Q38 20 32 26 Q26 20 32 14Z" fill="rgba(255,255,255,0.45)" />
      </g>
    ),
  },

  'bw-beta': {
    gradId: 'grad-bw-beta',
    glow: 'rgba(37,99,235,0.45)',
    ringColor: '#2563eb',
    defs: (
      <defs>
        <radialGradient id="grad-bw-beta" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Fast sharp zigzag wave */}
        <polyline points="14,36 17,28 20,36 23,28 26,36 29,28 32,36 35,28 38,36 41,28 44,36 47,28 50,36" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* 2 energy dots */}
        <circle cx="22" cy="44" r="2.5" fill="rgba(255,255,255,0.65)" />
        <circle cx="42" cy="44" r="2.5" fill="rgba(255,255,255,0.65)" />
      </g>
    ),
  },

  'bw-gamma': {
    gradId: 'grad-bw-gamma',
    glow: 'rgba(245,159,0,0.45)',
    ringColor: '#f59f00',
    defs: (
      <defs>
        <radialGradient id="grad-bw-gamma" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="55%" stopColor="#f59f00" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Dense fast wave */}
        <polyline points="12,34 14,29 16,34 18,29 20,34 22,29 24,34 26,29 28,34 30,29 32,34 34,29 36,34 38,29 40,34 42,29 44,34 46,29 48,34 50,29 52,34" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bright centre circle */}
        <circle cx="32" cy="32" r="5" fill="rgba(255,255,255,0.5)" />
        <circle cx="32" cy="32" r="3" fill="rgba(255,255,255,0.8)" />
        {/* Double outer ring */}
        <circle cx="32" cy="32" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
        <circle cx="32" cy="32" r="23" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
      </g>
    ),
  },

  'int-sleep': {
    gradId: 'grad-int-sleep',
    glow: 'rgba(30,64,175,0.45)',
    ringColor: '#1e40af',
    defs: (
      <defs>
        <radialGradient id="grad-int-sleep" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="55%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Crescent moon */}
        <path d="M32 16 A14 14 0 1 1 32 48 A10 10 0 1 0 32 16Z" fill="rgba(255,255,255,0.6)" />
        {/* 4 scattered stars */}
        <polygon points="20,20 21,23 24,20 21,17" fill="rgba(255,255,255,0.7)" />
        <polygon points="42,24 43,27 46,24 43,21" fill="rgba(255,255,255,0.65)" />
        <polygon points="16,36 17,39 20,36 17,33" fill="rgba(255,255,255,0.55)" />
        <polygon points="46,38 47,41 50,38 47,35" fill="rgba(255,255,255,0.6)" />
        {/* 4-point star bottom-right */}
        <polygon points="44,46 45,50 46,46 45,42" fill="rgba(255,255,255,0.75)" />
        <polygon points="41,49 45,50 49,49 45,48" fill="rgba(255,255,255,0.75)" />
      </g>
    ),
  },

  'int-focus': {
    gradId: 'grad-int-focus',
    glow: 'rgba(234,179,8,0.45)',
    ringColor: '#eab308',
    defs: (
      <defs>
        <radialGradient id="grad-int-focus" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="55%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Bullseye - 3 concentric circles */}
        <circle cx="32" cy="32" r="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
        <circle cx="32" cy="32" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
        <circle cx="32" cy="32" r="4" fill="rgba(255,255,255,0.8)" />
        {/* Crosshair lines N/S/E/W */}
        <line x1="32" y1="14" x2="32" y2="18" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="46" x2="32" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="32" x2="18" y2="32" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="46" y1="32" x2="50" y2="32" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  },

  'int-heal': {
    gradId: 'grad-int-heal',
    glow: 'rgba(236,72,153,0.45)',
    ringColor: '#ec4899',
    defs: (
      <defs>
        <radialGradient id="grad-int-heal" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="55%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#701a75" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Heart shape */}
        <path d="M32 44 C32 44 16 34 16 25 C16 20 20 17 24 17 C27 17 30 19 32 22 C34 19 37 17 40 17 C44 17 48 20 48 25 C48 34 32 44 32 44Z" fill="rgba(255,255,255,0.5)" />
        {/* Cross of light */}
        <line x1="32" y1="22" x2="32" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="30" x2="40" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  },

  'int-dream': {
    gradId: 'grad-int-dream',
    glow: 'rgba(168,85,247,0.45)',
    ringColor: '#a855f7',
    defs: (
      <defs>
        <radialGradient id="grad-int-dream" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* 3 cloud puffs */}
        <ellipse cx="26" cy="38" rx="8" ry="5" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="38" cy="38" rx="8" ry="5" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="32" cy="34" rx="10" ry="6" fill="rgba(255,255,255,0.4)" />
        {/* 2 floating 4-point stars */}
        <polygon points="22,24 23,27 24,24 23,21" fill="rgba(255,255,255,0.75)" />
        <polygon points="19,27 22,28 25,27 22,26" fill="rgba(255,255,255,0.75)" />
        <polygon points="40,20 41,23 42,20 41,17" fill="rgba(255,255,255,0.75)" />
        <polygon points="37,23 40,24 43,23 40,22" fill="rgba(255,255,255,0.75)" />
        {/* Dashed outer ring */}
        <circle cx="32" cy="32" r="23" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeDasharray="3,6" />
      </g>
    ),
  },

  'int-energy': {
    gradId: 'grad-int-energy',
    glow: 'rgba(249,115,22,0.45)',
    ringColor: '#f97316',
    defs: (
      <defs>
        <radialGradient id="grad-int-energy" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Large outer flame */}
        <path d="M32 48 C24 48 18 40 20 32 C21 28 24 25 24 21 C24 18 26 15 28 13 C27 17 29 19 30 18 C30 14 33 11 36 10 C34 14 35 17 37 18 C40 15 42 18 42 22 C43 26 44 30 44 32 C46 40 40 48 32 48Z" fill="rgba(255,255,255,0.4)" />
        {/* Inner bright flame core */}
        <path d="M32 44 C27 44 24 39 25 34 C26 31 28 29 29 26 C30 29 31 30 33 29 C33 26 35 23 37 22 C36 26 37 28 38 28 C40 30 40 34 39 37 C38 41 35 44 32 44Z" fill="rgba(255,255,255,0.65)" />
      </g>
    ),
  },

  'int-peace': {
    gradId: 'grad-int-peace',
    glow: 'rgba(13,148,136,0.45)',
    ringColor: '#0d9488',
    defs: (
      <defs>
        <radialGradient id="grad-int-peace" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ccfbf1" />
          <stop offset="55%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#134e4a" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Dove wings (two wing shapes) */}
        <path d="M32 32 Q20 26 16 20 Q22 24 28 28" fill="rgba(255,255,255,0.5)" />
        <path d="M32 32 Q44 26 48 20 Q42 24 36 28" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="32" cy="34" rx="5" ry="3.5" fill="rgba(255,255,255,0.5)" />
        {/* OM circle */}
        <circle cx="32" cy="32" r="16" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
        <text x="32" y="37" fontSize="13" fill="rgba(255,255,255,0.6)" textAnchor="middle" fontFamily="serif">ॐ</text>
      </g>
    ),
  },

  'el-water': {
    gradId: 'grad-el-water',
    glow: 'rgba(14,165,233,0.45)',
    ringColor: '#0ea5e9',
    defs: (
      <defs>
        <radialGradient id="grad-el-water" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="55%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Large water droplet */}
        <path d="M32 16 Q40 26 40 34 A8 8 0 0 1 24 34 Q24 26 32 16Z" fill="rgba(255,255,255,0.45)" />
        {/* Two inner ripple ellipses */}
        <ellipse cx="32" cy="34" rx="6" ry="3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
        <ellipse cx="32" cy="34" rx="3.5" ry="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
      </g>
    ),
  },

  'el-earth': {
    gradId: 'grad-el-earth',
    glow: 'rgba(101,163,13,0.45)',
    ringColor: '#65a30d',
    defs: (
      <defs>
        <radialGradient id="grad-el-earth" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#d9f99d" />
          <stop offset="55%" stopColor="#65a30d" />
          <stop offset="100%" stopColor="#1a2e05" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Ground line */}
        <line x1="16" y1="46" x2="48" y2="46" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Mountain silhouette */}
        <path d="M16 46 L28 26 L32 30 L38 18 L48 46 Z" fill="rgba(255,255,255,0.4)" />
        {/* Small sun circle */}
        <circle cx="20" cy="22" r="4" fill="rgba(255,255,255,0.65)" />
        <line x1="20" y1="16" x2="20" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24" y1="18" x2="26" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="18" x2="14" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    ),
  },

  'el-fire': {
    gradId: 'grad-el-fire',
    glow: 'rgba(239,68,68,0.45)',
    ringColor: '#ef4444',
    defs: (
      <defs>
        <radialGradient id="grad-el-fire" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="55%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Outer triple-flame */}
        <path d="M32 48 C22 48 15 40 17 30 C18 24 22 22 22 16 C24 20 23 24 26 24 C26 18 30 12 32 10 C34 12 38 18 38 24 C41 24 40 20 42 16 C42 22 46 24 47 30 C49 40 42 48 32 48Z" fill="rgba(255,255,255,0.35)" />
        {/* Inner bright flame core */}
        <path d="M32 44 C26 44 22 38 23 32 C24 28 27 26 27 22 C29 25 28 28 30 28 C30 24 32 19 34 18 C36 19 38 24 38 28 C40 28 39 25 41 22 C41 26 44 28 45 32 C46 38 38 44 32 44Z" fill="rgba(255,255,255,0.6)" />
      </g>
    ),
  },

  'el-air': {
    gradId: 'grad-el-air',
    glow: 'rgba(148,163,184,0.45)',
    ringColor: '#94a3b8',
    defs: (
      <defs>
        <radialGradient id="grad-el-air" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="55%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* 2 wind swirl curves */}
        <path d="M14 28 Q22 22 32 28 Q42 34 46 28" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M14 36 Q24 30 34 36 Q40 40 48 36" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 2 dandelion seeds with stems */}
        <line x1="42" y1="22" x2="42" y2="28" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="42" cy="21" r="1.5" fill="rgba(255,255,255,0.6)" />
        <line x1="40" y1="20" x2="42" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="44" y1="20" x2="42" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="20" y1="44" x2="20" y2="50" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="20" cy="43" r="1.5" fill="rgba(255,255,255,0.6)" />
        <line x1="18" y1="42" x2="20" y2="43" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="22" y1="42" x2="20" y2="43" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      </g>
    ),
  },

  'el-ether': {
    gradId: 'grad-el-ether',
    glow: 'rgba(99,102,241,0.45)',
    ringColor: '#6366f1',
    defs: (
      <defs>
        <radialGradient id="grad-el-ether" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#0f0720" />
        </radialGradient>
      </defs>
    ),
    inner: (
      <g>
        {/* Small planet circle */}
        <circle cx="32" cy="32" r="6" fill="rgba(255,255,255,0.5)" />
        {/* Saturn ring ellipse rotated -15deg */}
        <ellipse cx="32" cy="32" rx="16" ry="6" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" transform="rotate(-15 32 32)" />
        {/* 4 stars */}
        <polygon points="16,16 17,19 20,16 17,13" fill="rgba(255,255,255,0.65)" />
        <polygon points="44,18 45,21 48,18 45,15" fill="rgba(255,255,255,0.6)" />
        <polygon points="14,44 15,47 18,44 15,41" fill="rgba(255,255,255,0.55)" />
        <polygon points="46,46 47,49 50,46 47,43" fill="rgba(255,255,255,0.6)" />
        {/* 4-point star */}
        <polygon points="50,28 51,32 52,28 51,24" fill="rgba(255,255,255,0.7)" />
        <polygon points="47,31 51,32 55,31 51,30" fill="rgba(255,255,255,0.7)" />
      </g>
    ),
  },
};

export default function AnahataOrb({ id, size = 48, selected = false, className, style, onClick }: AnahataOrbProps) {
  const orb = ORBS[id];
  const glowColor = orb.glow;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      onClick={onClick}
      style={{
        borderRadius: '50%',
        cursor: onClick ? 'pointer' : 'default',
        filter: selected
          ? `drop-shadow(0 0 ${size * 0.3}px ${glowColor}) drop-shadow(0 4px 16px ${glowColor})`
          : `drop-shadow(0 4px 12px ${glowColor})`,
        transform: selected ? 'scale(1.12)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        ...style,
      }}
    >
      {orb.defs}
      {selected && <circle cx="32" cy="32" r="31" stroke={orb.ringColor} strokeWidth="1.5" fill="none" opacity="0.6" />}
      {!selected && <circle cx="32" cy="32" r="31" stroke={orb.ringColor} strokeWidth="0.5" fill="none" opacity="0.3" />}
      <circle cx="32" cy="32" r="28" fill={`url(#${orb.gradId})`} />
      {orb.inner}
      <ellipse cx="22" cy="20" rx="9" ry="5.5" fill="rgba(255,255,255,0.2)" opacity="0.7" />
    </svg>
  );
}
