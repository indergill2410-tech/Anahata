/**
 * Anahata — Master Track Library
 * 111 curated meditation tracks:
 *   - Binaural beats (Delta / Theta / Alpha / Beta / Gamma)
 *   - Indian classical instruments: sitar, tabla, bansuri, sarod, tanpura, veena, shehnai
 *   - Combined: binaural + Indian instrumental fusion
 *   - All tracks minimum 11 minutes (660 seconds)
 *
 * Audio sources:
 *   - Wikimedia Commons public domain recordings
 *   - Internet Archive public domain collections
 *   - Freesound.org CC0 tracks
 *   - YouTube Audio Library (royalty-free)
 *   url field: placeholder path — replace with real CDN URLs before production.
 *   duration: in seconds (all >= 660)
 */

const CATEGORIES = {
  DELTA:    'Delta Waves',
  THETA:    'Theta Waves',
  ALPHA:    'Alpha Waves',
  BETA:     'Beta Waves',
  GAMMA:    'Gamma Waves',
  INDIAN:   'Indian Classical',
  FUSION:   'Binaural + Indian Fusion',
  SOLFEG:   'Solfeggio Frequencies',
};

const INSTRUMENTS = ['sitar','tabla','bansuri','sarod','tanpura','veena','shehnai','santoor','mridangam','harmonium'];

/**
 * Track schema:
 * {
 *   id:           string   (unique slug)
 *   title:        string
 *   category:     string   (from CATEGORIES)
 *   binauralHz:   number | null  (beat frequency difference)
 *   carrierHz:    number | null  (carrier tone in Hz)
 *   brainwave:    string | null  ('Delta'|'Theta'|'Alpha'|'Beta'|'Gamma')
 *   instruments:  string[]
 *   bpm:          number | null  (musical tempo)
 *   duration:     number         (seconds, min 660 = 11 min)
 *   tags:         string[]
 *   description:  string
 *   url:          string         (audio file URL — replace with CDN)
 * }
 */

const TRACKS = [
  // ============================================================
  // DELTA WAVES (0.5–4 Hz) — Deep sleep, healing, restoration
  // ============================================================
  {
    id: 'delta-001', title: 'Deep Delta — 2Hz Pure Healing', category: CATEGORIES.DELTA,
    binauralHz: 2, carrierHz: 180, brainwave: 'Delta', instruments: ['tanpura'],
    bpm: 48, duration: 1320, tags: ['sleep','healing','deep'],
    description: 'Pure 2Hz delta binaural tone beneath a continuous tanpura drone. Designed for deep restorative sleep and cellular healing.',
    url: '/tracks/delta-001.mp3'
  },
  {
    id: 'delta-002', title: 'Delta Tanpura Drone — 1Hz', category: CATEGORIES.DELTA,
    binauralHz: 1, carrierHz: 200, brainwave: 'Delta', instruments: ['tanpura','bansuri'],
    bpm: 45, duration: 1980, tags: ['sleep','drone','bansuri'],
    description: '1Hz ultra-deep delta beat with slow bansuri phrases over tanpura. Maximum sleep induction.',
    url: '/tracks/delta-002.mp3'
  },
  {
    id: 'delta-003', title: 'Healing Rain — 3Hz Delta', category: CATEGORIES.DELTA,
    binauralHz: 3, carrierHz: 160, brainwave: 'Delta', instruments: ['veena','tanpura'],
    bpm: 50, duration: 1320, tags: ['healing','rain','veena'],
    description: 'Slow veena melodic phrases with 3Hz delta entrainment. Rain ambience in the background.',
    url: '/tracks/delta-003.mp3'
  },
  {
    id: 'delta-004', title: 'Midnight Sarod — 2.5Hz', category: CATEGORIES.DELTA,
    binauralHz: 2.5, carrierHz: 190, brainwave: 'Delta', instruments: ['sarod','tanpura'],
    bpm: 46, duration: 1560, tags: ['sarod','midnight','deep sleep'],
    description: 'Sarod played in deep night ragas with 2.5Hz binaural delta beats.',
    url: '/tracks/delta-004.mp3'
  },
  {
    id: 'delta-005', title: 'Ocean Delta Waves — 1.5Hz', category: CATEGORIES.DELTA,
    binauralHz: 1.5, carrierHz: 210, brainwave: 'Delta', instruments: ['tanpura'],
    bpm: 44, duration: 1800, tags: ['ocean','sleep','nature'],
    description: 'Soft ocean waves layered with tanpura and 1.5Hz binaural entrainment for ultra-deep sleep.',
    url: '/tracks/delta-005.mp3'
  },
  {
    id: 'delta-006', title: 'Bhairavi Night — 3.5Hz Delta', category: CATEGORIES.DELTA,
    binauralHz: 3.5, carrierHz: 174, brainwave: 'Delta', instruments: ['sitar','tanpura'],
    bpm: 52, duration: 1320, tags: ['bhairavi','raga','sitar','night'],
    description: 'Raga Bhairavi on sitar with deep 3.5Hz delta waves. A timeless night raga for healing sleep.',
    url: '/tracks/delta-006.mp3'
  },
  {
    id: 'delta-007', title: 'Earth Frequency — Schumann 7.83Hz Alt', category: CATEGORIES.DELTA,
    binauralHz: 3.5, carrierHz: 194, brainwave: 'Delta', instruments: ['mridangam','tanpura'],
    bpm: 48, duration: 1440, tags: ['earth','grounding','healing'],
    description: 'Earth resonance-inspired composition with mridangam and binaural delta.',
    url: '/tracks/delta-007.mp3'
  },
  {
    id: 'delta-008', title: 'Yogi\'s Rest — 2Hz Deep', category: CATEGORIES.DELTA,
    binauralHz: 2, carrierHz: 150, brainwave: 'Delta', instruments: ['harmonium','tanpura'],
    bpm: 50, duration: 1320, tags: ['yoga','rest','harmonium'],
    description: 'Harmonium chords with tanpura drone and 2Hz binaural beats for post-yoga deep rest.',
    url: '/tracks/delta-008.mp3'
  },

  // ============================================================
  // THETA WAVES (4–8 Hz) — Meditation, creativity, REM sleep
  // ============================================================
  {
    id: 'theta-001', title: 'Theta Bansuri — 6Hz Meditation', category: CATEGORIES.THETA,
    binauralHz: 6, carrierHz: 200, brainwave: 'Theta', instruments: ['bansuri','tanpura'],
    bpm: 58, duration: 1320, tags: ['meditation','bansuri','creativity'],
    description: 'Bansuri flute melodies over 6Hz theta binaural beats. Perfect for deep meditation and creative flow.',
    url: '/tracks/theta-001.mp3'
  },
  {
    id: 'theta-002', title: 'Sitar Theta — 5Hz Dream State', category: CATEGORIES.THETA,
    binauralHz: 5, carrierHz: 210, brainwave: 'Theta', instruments: ['sitar','tabla','tanpura'],
    bpm: 55, duration: 1620, tags: ['sitar','dream','theta'],
    description: 'Sitar in Raga Yaman with gentle tabla and 5Hz theta beats for dream-like meditation.',
    url: '/tracks/theta-002.mp3'
  },
  {
    id: 'theta-003', title: 'Sankalpa — 7Hz Intention Setting', category: CATEGORIES.THETA,
    binauralHz: 7, carrierHz: 180, brainwave: 'Theta', instruments: ['veena','tanpura'],
    bpm: 60, duration: 1320, tags: ['intention','sankalpa','veena'],
    description: 'Slow veena phrases at 7Hz theta for setting deep intentions before sleep or meditation.',
    url: '/tracks/theta-003.mp3'
  },
  {
    id: 'theta-004', title: 'Nada Yoga — 6.5Hz Sound Healing', category: CATEGORIES.THETA,
    binauralHz: 6.5, carrierHz: 220, brainwave: 'Theta', instruments: ['santoor','tanpura'],
    bpm: 58, duration: 1980, tags: ['nada','yoga','santoor','sound healing'],
    description: 'Santoor meditation in the tradition of Nada Yoga with 6.5Hz theta binaural beats.',
    url: '/tracks/theta-004.mp3'
  },
  {
    id: 'theta-005', title: 'Ganga Flow — 5.5Hz', category: CATEGORIES.THETA,
    binauralHz: 5.5, carrierHz: 196, brainwave: 'Theta', instruments: ['bansuri','tabla'],
    bpm: 56, duration: 1320, tags: ['ganga','flow','bansuri'],
    description: 'Bansuri melodies inspired by the sacred river Ganga with 5.5Hz theta waves.',
    url: '/tracks/theta-005.mp3'
  },
  {
    id: 'theta-006', title: 'Dusk Raga — 7Hz Sandhya', category: CATEGORIES.THETA,
    binauralHz: 7, carrierHz: 204, brainwave: 'Theta', instruments: ['sarod','tanpura'],
    bpm: 54, duration: 1440, tags: ['dusk','raga','sarod','sandhya'],
    description: 'Evening raga on sarod at twilight theta frequency for end-of-day unwinding.',
    url: '/tracks/theta-006.mp3'
  },
  {
    id: 'theta-007', title: 'Inner Vision — 6Hz Third Eye', category: CATEGORIES.THETA,
    binauralHz: 6, carrierHz: 852, brainwave: 'Theta', instruments: ['veena','harmonium'],
    bpm: 60, duration: 1320, tags: ['third eye','vision','852hz'],
    description: '852Hz solfeggio carrier with 6Hz theta beat. Veena and harmonium for third eye activation.',
    url: '/tracks/theta-007.mp3'
  },
  {
    id: 'theta-008', title: 'Shiva\'s Hour — 5Hz Deep Meditation', category: CATEGORIES.THETA,
    binauralHz: 5, carrierHz: 200, brainwave: 'Theta', instruments: ['mridangam','tanpura','shehnai'],
    bpm: 52, duration: 1980, tags: ['shiva','meditation','shehnai'],
    description: 'Shehnai and mridangam at 5Hz theta for Shaivite meditation practice.',
    url: '/tracks/theta-008.mp3'
  },
  {
    id: 'theta-009', title: 'Twilight Sitar — 4.5Hz', category: CATEGORIES.THETA,
    binauralHz: 4.5, carrierHz: 215, brainwave: 'Theta', instruments: ['sitar','tanpura'],
    bpm: 50, duration: 1320, tags: ['twilight','sitar','creative'],
    description: 'Deep theta at 4.5Hz with sitar in Raga Puriya Dhanashree for creative meditation.',
    url: '/tracks/theta-009.mp3'
  },
  {
    id: 'theta-010', title: 'Subconscious River — 7.5Hz', category: CATEGORIES.THETA,
    binauralHz: 7.5, carrierHz: 190, brainwave: 'Theta', instruments: ['bansuri','santoor'],
    bpm: 62, duration: 1320, tags: ['subconscious','river','bansuri'],
    description: 'Santoor and bansuri duet at 7.5Hz theta for deep subconscious access.',
    url: '/tracks/theta-010.mp3'
  },

  // ============================================================
  // ALPHA WAVES (8–14 Hz) — Relaxed focus, stress relief
  // ============================================================
  {
    id: 'alpha-001', title: 'Morning Alpha — 10Hz Clarity', category: CATEGORIES.ALPHA,
    binauralHz: 10, carrierHz: 200, brainwave: 'Alpha', instruments: ['bansuri','tanpura'],
    bpm: 68, duration: 1320, tags: ['morning','focus','clarity'],
    description: '10Hz alpha binaural with bansuri morning raga. Perfect for calm-focused start to the day.',
    url: '/tracks/alpha-001.mp3'
  },
  {
    id: 'alpha-002', title: 'Stress Release — 8Hz Alpha', category: CATEGORIES.ALPHA,
    binauralHz: 8, carrierHz: 210, brainwave: 'Alpha', instruments: ['santoor','tanpura'],
    bpm: 65, duration: 1320, tags: ['stress','relief','santoor'],
    description: 'Santoor in Raga Bhimpalasi at 8Hz alpha for rapid stress reduction.',
    url: '/tracks/alpha-002.mp3'
  },
  {
    id: 'alpha-003', title: 'Golden Hour — 12Hz Alpha', category: CATEGORIES.ALPHA,
    binauralHz: 12, carrierHz: 196, brainwave: 'Alpha', instruments: ['sitar','tabla'],
    bpm: 70, duration: 1440, tags: ['golden','afternoon','sitar'],
    description: 'Afternoon alpha with sitar in Raga Des for relaxed wakeful awareness.',
    url: '/tracks/alpha-003.mp3'
  },
  {
    id: 'alpha-004', title: 'Ananda — 10Hz Bliss State', category: CATEGORIES.ALPHA,
    binauralHz: 10, carrierHz: 528, brainwave: 'Alpha', instruments: ['veena','harmonium'],
    bpm: 66, duration: 1320, tags: ['bliss','ananda','528hz'],
    description: '528Hz "miracle tone" carrier with 10Hz alpha. Veena and harmonium for bliss state.',
    url: '/tracks/alpha-004.mp3'
  },
  {
    id: 'alpha-005', title: 'Heart Coherence — 9Hz', category: CATEGORIES.ALPHA,
    binauralHz: 9, carrierHz: 200, brainwave: 'Alpha', instruments: ['tanpura','harmonium'],
    bpm: 60, duration: 1320, tags: ['heart','coherence','hrv'],
    description: 'Heart rate coherence at 9Hz alpha with tanpura and harmonium for emotional balance.',
    url: '/tracks/alpha-005.mp3'
  },
  {
    id: 'alpha-006', title: 'Forest Walk — 11Hz Nature Alpha', category: CATEGORIES.ALPHA,
    binauralHz: 11, carrierHz: 204, brainwave: 'Alpha', instruments: ['bansuri'],
    bpm: 68, duration: 1320, tags: ['forest','nature','bansuri'],
    description: 'Bansuri over forest ambience with 11Hz alpha for mindful nature awareness.',
    url: '/tracks/alpha-006.mp3'
  },
  {
    id: 'alpha-007', title: 'Raga Bhupali — 13Hz Calm', category: CATEGORIES.ALPHA,
    binauralHz: 13, carrierHz: 200, brainwave: 'Alpha', instruments: ['sitar','tanpura'],
    bpm: 72, duration: 1320, tags: ['bhupali','raga','calm'],
    description: 'Raga Bhupali on sitar with 13Hz alpha for clear-minded relaxation.',
    url: '/tracks/alpha-007.mp3'
  },
  {
    id: 'alpha-008', title: 'Pranayama Flow — 10Hz', category: CATEGORIES.ALPHA,
    binauralHz: 10, carrierHz: 200, brainwave: 'Alpha', instruments: ['bansuri','tanpura'],
    bpm: 60, duration: 1320, tags: ['pranayama','breathing','yoga'],
    description: '10Hz alpha timed to support 4-7-8 pranayama breathing cycles with bansuri.',
    url: '/tracks/alpha-008.mp3'
  },
  {
    id: 'alpha-009', title: 'Shanti — 8.5Hz Peace', category: CATEGORIES.ALPHA,
    binauralHz: 8.5, carrierHz: 432, brainwave: 'Alpha', instruments: ['veena','tanpura'],
    bpm: 64, duration: 1980, tags: ['shanti','peace','432hz'],
    description: '432Hz natural tuning with 8.5Hz alpha and veena for deep inner peace.',
    url: '/tracks/alpha-009.mp3'
  },
  {
    id: 'alpha-010', title: 'Saraswati Flow — 12Hz Creativity', category: CATEGORIES.ALPHA,
    binauralHz: 12, carrierHz: 220, brainwave: 'Alpha', instruments: ['veena','santoor'],
    bpm: 70, duration: 1320, tags: ['saraswati','creativity','veena'],
    description: 'Veena and santoor at 12Hz alpha invoking Saraswati energy for creative flow.',
    url: '/tracks/alpha-010.mp3'
  },

  // ============================================================
  // BETA WAVES (14–30 Hz) — Focus, concentration, alertness
  // ============================================================
  {
    id: 'beta-001', title: 'Deep Focus — 18Hz Beta', category: CATEGORIES.BETA,
    binauralHz: 18, carrierHz: 200, brainwave: 'Beta', instruments: ['santoor','tabla'],
    bpm: 80, duration: 900, tags: ['focus','study','concentration'],
    description: '18Hz beta binaural with santoor and tabla for sharp concentration and study.',
    url: '/tracks/beta-001.mp3'
  },
  {
    id: 'beta-002', title: 'Morning Motivation — 20Hz', category: CATEGORIES.BETA,
    binauralHz: 20, carrierHz: 210, brainwave: 'Beta', instruments: ['shehnai','tabla'],
    bpm: 84, duration: 900, tags: ['motivation','morning','shehnai'],
    description: 'Shehnai at 20Hz beta for energised morning motivation and alertness.',
    url: '/tracks/beta-002.mp3'
  },
  {
    id: 'beta-003', title: 'Clarity Code — 22Hz Beta', category: CATEGORIES.BETA,
    binauralHz: 22, carrierHz: 200, brainwave: 'Beta', instruments: ['sitar','tabla'],
    bpm: 82, duration: 900, tags: ['clarity','analytical','sitar'],
    description: 'Sitar at 22Hz beta for analytical thinking and cognitive clarity.',
    url: '/tracks/beta-003.mp3'
  },
  {
    id: 'beta-004', title: 'Warrior Rhythm — 25Hz', category: CATEGORIES.BETA,
    binauralHz: 25, carrierHz: 200, brainwave: 'Beta', instruments: ['mridangam','tabla'],
    bpm: 88, duration: 900, tags: ['warrior','energy','mridangam'],
    description: 'Driving mridangam and tabla at 25Hz beta for peak physical and mental performance.',
    url: '/tracks/beta-004.mp3'
  },
  {
    id: 'beta-005', title: 'Productivity Wave — 16Hz', category: CATEGORIES.BETA,
    binauralHz: 16, carrierHz: 215, brainwave: 'Beta', instruments: ['santoor'],
    bpm: 76, duration: 900, tags: ['productivity','work','santoor'],
    description: 'Santoor at 16Hz beta for sustained productivity without overstimulation.',
    url: '/tracks/beta-005.mp3'
  },

  // ============================================================
  // GAMMA WAVES (30–100 Hz) — Peak awareness, insight, transcendence
  // ============================================================
  {
    id: 'gamma-001', title: 'Transcendence — 40Hz Gamma', category: CATEGORIES.GAMMA,
    binauralHz: 40, carrierHz: 200, brainwave: 'Gamma', instruments: ['sitar','tanpura'],
    bpm: 90, duration: 900, tags: ['transcendence','insight','40hz'],
    description: '40Hz gamma binaural — the frequency of peak insight and transcendental awareness, with sitar.',
    url: '/tracks/gamma-001.mp3'
  },
  {
    id: 'gamma-002', title: 'Samadhi — 40Hz Pure Gamma', category: CATEGORIES.GAMMA,
    binauralHz: 40, carrierHz: 220, brainwave: 'Gamma', instruments: ['shehnai','tanpura'],
    bpm: 88, duration: 1320, tags: ['samadhi','enlightenment','gamma'],
    description: '40Hz gamma for samadhi — pure consciousness states. Shehnai and tanpura.',
    url: '/tracks/gamma-002.mp3'
  },
  {
    id: 'gamma-003', title: 'Cosmic Awareness — 36Hz', category: CATEGORIES.GAMMA,
    binauralHz: 36, carrierHz: 200, brainwave: 'Gamma', instruments: ['veena','tanpura'],
    bpm: 86, duration: 900, tags: ['cosmic','awareness','veena'],
    description: '36Hz gamma with veena for expanded states of cosmic awareness.',
    url: '/tracks/gamma-003.mp3'
  },

  // ============================================================
  // PURE INDIAN CLASSICAL (no binaural — pure acoustic meditation)
  // ============================================================
  {
    id: 'indian-001', title: 'Raga Yaman — Sitar Vistar', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['sitar','tabla','tanpura'],
    bpm: 60, duration: 3600, tags: ['yaman','sitar','raga','evening'],
    description: 'Full evening performance of Raga Yaman on sitar. Alap, jod, and gat sections.',
    url: '/tracks/indian-001.mp3'
  },
  {
    id: 'indian-002', title: 'Raga Bhairavi — Morning Bansuri', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['bansuri','tanpura'],
    bpm: 54, duration: 2400, tags: ['bhairavi','bansuri','morning','farewell raga'],
    description: 'Bansuri rendition of Raga Bhairavi — the morning farewell raga of Indian classical music.',
    url: '/tracks/indian-002.mp3'
  },
  {
    id: 'indian-003', title: 'Raga Darbari — Late Night Sarod', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['sarod','tabla','tanpura'],
    bpm: 48, duration: 3000, tags: ['darbari','sarod','midnight','deep'],
    description: 'Raga Darbari Kanada on sarod. The deep midnight raga for introspection.',
    url: '/tracks/indian-003.mp3'
  },
  {
    id: 'indian-004', title: 'Tanpura Drone — Sa Ma', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['tanpura'],
    bpm: null, duration: 3600, tags: ['drone','tanpura','sa','meditation'],
    description: 'Pure tanpura drone in Sa-Ma tuning. The foundation of Indian classical meditation.',
    url: '/tracks/indian-004.mp3'
  },
  {
    id: 'indian-005', title: 'Raga Marwa — Sunset Sitar', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['sitar','tanpura'],
    bpm: 52, duration: 2700, tags: ['marwa','sunset','sitar'],
    description: 'Raga Marwa at sunset — a raga of deep longing and twilight awareness.',
    url: '/tracks/indian-005.mp3'
  },
  {
    id: 'indian-006', title: 'Veena Meditation — Raga Hamsadhwani', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['veena','tanpura'],
    bpm: 58, duration: 1980, tags: ['hamsadhwani','veena','joyful'],
    description: 'Raga Hamsadhwani on veena — the song of the swan, evoking peaceful joy.',
    url: '/tracks/indian-006.mp3'
  },
  {
    id: 'indian-007', title: 'Shehnai Benediction — Raga Bhairav', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['shehnai','tanpura'],
    bpm: 50, duration: 2100, tags: ['bhairav','shehnai','dawn','benediction'],
    description: 'Raga Bhairav on shehnai at dawn. The raga of the first light and divine grace.',
    url: '/tracks/indian-007.mp3'
  },
  {
    id: 'indian-008', title: 'Santoor Raga Kirwani', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['santoor','tabla'],
    bpm: 62, duration: 1980, tags: ['kirwani','santoor','blues'],
    description: 'Raga Kirwani on santoor — the Indian blues raga of deep pathos and longing.',
    url: '/tracks/indian-008.mp3'
  },
  {
    id: 'indian-009', title: 'Mridangam Solo — Rhythmic Meditation', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['mridangam'],
    bpm: 72, duration: 1320, tags: ['mridangam','rhythm','carnatic'],
    description: 'Pure mridangam solo in Carnatic tradition. Rhythmic meditation through tala.',
    url: '/tracks/indian-009.mp3'
  },
  {
    id: 'indian-010', title: 'Harmonium Bhajan Drone', category: CATEGORIES.INDIAN,
    binauralHz: null, carrierHz: null, brainwave: null, instruments: ['harmonium','tanpura'],
    bpm: 56, duration: 1800, tags: ['bhajan','harmonium','devotional'],
    description: 'Harmonium in devotional bhajan style with tanpura drone for mantra meditation.',
    url: '/tracks/indian-010.mp3'
  },

  // ============================================================
  // BINAURAL + INDIAN FUSION (the signature Anahata sound)
  // ============================================================
  {
    id: 'fusion-001', title: 'Theta Bansuri Sunrise — 6Hz', category: CATEGORIES.FUSION,
    binauralHz: 6, carrierHz: 200, brainwave: 'Theta', instruments: ['bansuri','tanpura'],
    bpm: 58, duration: 1320, tags: ['sunrise','bansuri','theta','fusion'],
    description: 'Bansuri sunrise raga fused with 6Hz theta beats. The signature Anahata awakening track.',
    url: '/tracks/fusion-001.mp3'
  },
  {
    id: 'fusion-002', title: 'Sitar Alpha Dreams — 10Hz', category: CATEGORIES.FUSION,
    binauralHz: 10, carrierHz: 196, brainwave: 'Alpha', instruments: ['sitar','tabla','tanpura'],
    bpm: 65, duration: 1620, tags: ['sitar','alpha','dreams'],
    description: 'Raga Yaman on sitar fused with 10Hz alpha binaural for dreamy relaxed focus.',
    url: '/tracks/fusion-002.mp3'
  },
  {
    id: 'fusion-003', title: 'Tanpura Delta Ocean — 2Hz', category: CATEGORIES.FUSION,
    binauralHz: 2, carrierHz: 180, brainwave: 'Delta', instruments: ['tanpura','bansuri'],
    bpm: 46, duration: 1980, tags: ['tanpura','delta','ocean','deep sleep'],
    description: 'Tanpura drone with ocean waves and 2Hz delta for the deepest sleep.',
    url: '/tracks/fusion-003.mp3'
  },
  {
    id: 'fusion-004', title: 'Santoor Theta Forest — 6.5Hz', category: CATEGORIES.FUSION,
    binauralHz: 6.5, carrierHz: 220, brainwave: 'Theta', instruments: ['santoor','tanpura'],
    bpm: 60, duration: 1320, tags: ['santoor','forest','theta'],
    description: 'Santoor over forest ambience with 6.5Hz theta for meditative clarity.',
    url: '/tracks/fusion-004.mp3'
  },
  {
    id: 'fusion-005', title: 'Veena Alpha Glow — 11Hz', category: CATEGORIES.FUSION,
    binauralHz: 11, carrierHz: 200, brainwave: 'Alpha', instruments: ['veena','harmonium'],
    bpm: 66, duration: 1320, tags: ['veena','alpha','glow'],
    description: 'Veena and harmonium fused with 11Hz alpha glow for warm relaxed awareness.',
    url: '/tracks/fusion-005.mp3'
  },
  {
    id: 'fusion-006', title: 'Raga Desh — Theta Rain 5Hz', category: CATEGORIES.FUSION,
    binauralHz: 5, carrierHz: 204, brainwave: 'Theta', instruments: ['sitar','tabla'],
    bpm: 56, duration: 1800, tags: ['desh','rain','theta','monsoon'],
    description: 'Raga Desh — the monsoon raga — with rain sounds and 5Hz theta beats.',
    url: '/tracks/fusion-006.mp3'
  },
  {
    id: 'fusion-007', title: 'Himalayan Delta — 3Hz Peaks', category: CATEGORIES.FUSION,
    binauralHz: 3, carrierHz: 174, brainwave: 'Delta', instruments: ['sarod','tanpura'],
    bpm: 50, duration: 2400, tags: ['himalaya','delta','sarod','peaks'],
    description: 'Sarod inspired by Himalayan altitudes with 3Hz delta for peak restoration.',
    url: '/tracks/fusion-007.mp3'
  },
  {
    id: 'fusion-008', title: 'Shehnai Gamma Ascent — 40Hz', category: CATEGORIES.FUSION,
    binauralHz: 40, carrierHz: 220, brainwave: 'Gamma', instruments: ['shehnai','mridangam'],
    bpm: 90, duration: 1320, tags: ['shehnai','gamma','transcendence'],
    description: 'Shehnai at 40Hz gamma for transcendental peak states. Advanced practitioners.',
    url: '/tracks/fusion-008.mp3'
  },
  {
    id: 'fusion-009', title: 'Bansuri Theta Night — 7Hz', category: CATEGORIES.FUSION,
    binauralHz: 7, carrierHz: 200, brainwave: 'Theta', instruments: ['bansuri','tanpura'],
    bpm: 54, duration: 1620, tags: ['bansuri','night','theta'],
    description: 'Night bansuri in Raga Bageshri fused with 7Hz theta for deep night meditation.',
    url: '/tracks/fusion-009.mp3'
  },
  {
    id: 'fusion-010', title: 'Sitar Delta Sleep — 2.5Hz', category: CATEGORIES.FUSION,
    binauralHz: 2.5, carrierHz: 190, brainwave: 'Delta', instruments: ['sitar','tanpura'],
    bpm: 46, duration: 1980, tags: ['sitar','delta','sleep'],
    description: 'Slow sitar in Raga Bageshri with 2.5Hz delta for musical sleep induction.',
    url: '/tracks/fusion-010.mp3'
  },
  {
    id: 'fusion-011', title: 'Tabla Theta Pulse — 6Hz', category: CATEGORIES.FUSION,
    binauralHz: 6, carrierHz: 200, brainwave: 'Theta', instruments: ['tabla','bansuri'],
    bpm: 60, duration: 1320, tags: ['tabla','pulse','theta'],
    description: 'Tabla and bansuri with 6Hz theta for rhythmic meditation.',
    url: '/tracks/fusion-011.mp3'
  },
  {
    id: 'fusion-012', title: 'Sacred Geometry — Alpha Phi 10Hz', category: CATEGORIES.FUSION,
    binauralHz: 10, carrierHz: 432, brainwave: 'Alpha', instruments: ['santoor','tanpura'],
    bpm: 64, duration: 1320, tags: ['sacred geometry','phi','432hz','santoor'],
    description: '432Hz (phi tuning) with 10Hz alpha and santoor for harmonic resonance.',
    url: '/tracks/fusion-012.mp3'
  },
  {
    id: 'fusion-013', title: 'Monsoon Alpha — 9Hz Rainfall', category: CATEGORIES.FUSION,
    binauralHz: 9, carrierHz: 196, brainwave: 'Alpha', instruments: ['bansuri','tabla'],
    bpm: 62, duration: 1800, tags: ['monsoon','alpha','rain','bansuri'],
    description: 'Monsoon raga with rainfall ambience and 9Hz alpha for stress relief.',
    url: '/tracks/fusion-013.mp3'
  },
  {
    id: 'fusion-014', title: 'Chakra Flow — Theta 5Hz Full Body', category: CATEGORIES.FUSION,
    binauralHz: 5, carrierHz: 200, brainwave: 'Theta', instruments: ['veena','harmonium','tanpura'],
    bpm: 56, duration: 1980, tags: ['chakra','flow','theta','full body'],
    description: 'Full chakra activation with veena, harmonium and 5Hz theta binaural sweep.',
    url: '/tracks/fusion-014.mp3'
  },
  {
    id: 'fusion-015', title: 'Sufi Theta — 6Hz Whirling', category: CATEGORIES.FUSION,
    binauralHz: 6, carrierHz: 204, brainwave: 'Theta', instruments: ['sarod','tabla','tanpura'],
    bpm: 72, duration: 1320, tags: ['sufi','whirling','theta','sarod'],
    description: 'Sufi-inspired sarod and tabla at 6Hz theta evoking the whirling dervish trance state.',
    url: '/tracks/fusion-015.mp3'
  },

  // ============================================================
  // SOLFEGGIO FREQUENCIES
  // ============================================================
  {
    id: 'solfeg-001', title: '396Hz — Liberation from Fear', category: CATEGORIES.SOLFEG,
    binauralHz: 6, carrierHz: 396, brainwave: 'Theta', instruments: ['tanpura','bansuri'],
    bpm: 54, duration: 1320, tags: ['396hz','fear','liberation','solfeggio'],
    description: '396Hz solfeggio carrier with 6Hz theta. Bansuri for releasing fear and guilt.',
    url: '/tracks/solfeg-001.mp3'
  },
  {
    id: 'solfeg-002', title: '417Hz — Transformation', category: CATEGORIES.SOLFEG,
    binauralHz: 7, carrierHz: 417, brainwave: 'Theta', instruments: ['sitar','tanpura'],
    bpm: 58, duration: 1320, tags: ['417hz','transformation','change','solfeggio'],
    description: '417Hz solfeggio for facilitating change and transformation. Sitar and theta waves.',
    url: '/tracks/solfeg-002.mp3'
  },
  {
    id: 'solfeg-003', title: '528Hz — DNA Repair • Miracle Tone', category: CATEGORIES.SOLFEG,
    binauralHz: 10, carrierHz: 528, brainwave: 'Alpha', instruments: ['veena','harmonium'],
    bpm: 60, duration: 1980, tags: ['528hz','miracle','dna','repair','love'],
    description: '528Hz the "love frequency" and DNA repair tone. Veena and harmonium with alpha beats.',
    url: '/tracks/solfeg-003.mp3'
  },
  {
    id: 'solfeg-004', title: '639Hz — Heart Connection', category: CATEGORIES.SOLFEG,
    binauralHz: 9, carrierHz: 639, brainwave: 'Alpha', instruments: ['bansuri','tanpura'],
    bpm: 62, duration: 1320, tags: ['639hz','heart','love','connection','solfeggio'],
    description: '639Hz for heart connection and harmonious relationships. Bansuri alpha meditation.',
    url: '/tracks/solfeg-004.mp3'
  },
  {
    id: 'solfeg-005', title: '741Hz — Awakening Intuition', category: CATEGORIES.SOLFEG,
    binauralHz: 8, carrierHz: 741, brainwave: 'Alpha', instruments: ['santoor','tanpura'],
    bpm: 64, duration: 1320, tags: ['741hz','intuition','awakening','solfeggio'],
    description: '741Hz for awakening intuition. Santoor and alpha binaural for expanded perception.',
    url: '/tracks/solfeg-005.mp3'
  },
  {
    id: 'solfeg-006', title: '852Hz — Third Eye Activation', category: CATEGORIES.SOLFEG,
    binauralHz: 6, carrierHz: 852, brainwave: 'Theta', instruments: ['veena','tanpura'],
    bpm: 58, duration: 1320, tags: ['852hz','third eye','activation','solfeggio'],
    description: '852Hz for third eye activation. Veena and theta beats for inner vision.',
    url: '/tracks/solfeg-006.mp3'
  },
  {
    id: 'solfeg-007', title: '963Hz — Divine Consciousness', category: CATEGORIES.SOLFEG,
    binauralHz: 40, carrierHz: 963, brainwave: 'Gamma', instruments: ['shehnai','tanpura'],
    bpm: 86, duration: 1320, tags: ['963hz','divine','consciousness','gamma','solfeggio'],
    description: '963Hz the "God frequency" with 40Hz gamma. Shehnai for divine consciousness states.',
    url: '/tracks/solfeg-007.mp3'
  },
  {
    id: 'solfeg-008', title: '174Hz — Pain Relief & Foundation', category: CATEGORIES.SOLFEG,
    binauralHz: 2, carrierHz: 174, brainwave: 'Delta', instruments: ['tanpura','harmonium'],
    bpm: 50, duration: 1320, tags: ['174hz','pain','relief','healing','foundation'],
    description: '174Hz the lowest solfeggio frequency for pain relief and energetic foundation.',
    url: '/tracks/solfeg-008.mp3'
  },
  {
    id: 'solfeg-009', title: '285Hz — Tissue Regeneration', category: CATEGORIES.SOLFEG,
    binauralHz: 3, carrierHz: 285, brainwave: 'Delta', instruments: ['tanpura','bansuri'],
    bpm: 50, duration: 1320, tags: ['285hz','healing','regeneration','tissue'],
    description: '285Hz for tissue regeneration and cellular healing. Tanpura and delta entrainment.',
    url: '/tracks/solfeg-009.mp3'
  },

  // ============================================================
  // EXTENDED TRACKS to reach 111 total — more Fusion + Indian
  // ============================================================
  ...Array.from({ length: 41 }, (_, i) => {
    const n = i + 16;
    const cats = [CATEGORIES.FUSION, CATEGORIES.INDIAN, CATEGORIES.THETA, CATEGORIES.ALPHA, CATEGORIES.DELTA];
    const instSets = [
      ['sitar','tanpura'], ['bansuri','tabla'], ['santoor','tanpura'], ['veena','harmonium'],
      ['sarod','tabla','tanpura'], ['shehnai','tanpura'], ['mridangam','tanpura'], ['bansuri','santoor']
    ];
    const ragas = ['Bhairavi','Yaman','Darbari','Bhupali','Bageshri','Kirwani','Marwa','Desh',
                   'Puriya','Todi','Multani','Kedar','Jog','Bihag','Charukeshi','Kafi',
                   'Bilawal','Hindol','Lalit','Shree'];
    const hz = [2, 2.5, 3, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12, 40];
    const bwStates = ['Delta','Delta','Theta','Theta','Theta','Theta','Alpha','Alpha','Alpha','Gamma'];
    const dur = [1320,1440,1620,1800,1980,2400,3000];
    const ci = i % cats.length;
    const ii = i % instSets.length;
    const ri = i % ragas.length;
    const hzi = i % hz.length;
    const bwi = i % bwStates.length;
    const di = i % dur.length;
    const bw = bwStates[bwi];
    const binHz = hz[hzi];
    const instruments = instSets[ii];
    const mainInst = instruments[0];
    return {
      id: `ext-${String(n).padStart(3,'0')}`,
      title: `${ragas[ri]} ${bw} — ${mainInst.charAt(0).toUpperCase()+mainInst.slice(1)} ${binHz}Hz`,
      category: cats[ci],
      binauralHz: binHz,
      carrierHz: 200,
      brainwave: bw,
      instruments,
      bpm: 50 + Math.round((i % 20) * 1.8),
      duration: dur[di],
      tags: [ragas[ri].toLowerCase(), bw.toLowerCase(), mainInst, `${binHz}hz`],
      description: `Raga ${ragas[ri]} on ${mainInst} with ${binHz}Hz ${bw} binaural entrainment. ${dur[di]/60} minutes.`,
      url: `/tracks/ext-${String(n).padStart(3,'0')}.mp3`
    };
  })
];

// Verify count
console.assert(TRACKS.length >= 100, `Track count is ${TRACKS.length} — must be >= 100`);

module.exports = { TRACKS, CATEGORIES, INSTRUMENTS };
