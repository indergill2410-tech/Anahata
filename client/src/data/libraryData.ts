export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  ytId: string;
  tags?: string[];
}

export interface Album {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  color: string;
  accent: string;
  description: string;
  tracks: Track[];
}

export const ALBUMS: Album[] = [
  {
    id: 'raga-prahar',
    title: 'Raga Prahar',
    subtitle: 'Morning Ragas',
    genre: 'Raga',
    color: '#D97706',
    accent: '#FFF7ED',
    description: 'Sacred morning ragas to awaken the spirit at dawn, performed by India\'s greatest classical masters.',
    tracks: [
      { id: 'rp-01', title: 'Raga Bhairav', artist: 'Pandit Hariprasad Chaurasia', duration: '38 min', ytId: 'wdBph1u9fck', tags: ['morning', 'raga'] },
      { id: 'rp-02', title: 'Raga Lalit', artist: 'Ustad Vilayat Khan', duration: '42 min', ytId: 'OmJnJjAslLI', tags: ['morning', 'raga'] },
      { id: 'rp-03', title: 'Raga Ahir Bhairav', artist: 'Hariprasad Chaurasia', duration: '35 min', ytId: '9GlMrtTfSD0', tags: ['morning', 'raga'] },
      { id: 'rp-04', title: 'Raga Ramkali', artist: 'Amjad Ali Khan', duration: '44 min', ytId: 'TTRD38MmHa8', tags: ['morning', 'raga'] },
      { id: 'rp-05', title: 'Raga Todi', artist: 'Pandit Shivkumar Sharma', duration: '31 min', ytId: 'kiDC8zTc168', tags: ['morning', 'raga'] },
      { id: 'rp-06', title: 'Raga Jaunpuri', artist: 'Kishori Amonkar', duration: '29 min', ytId: 'a9E1jeshQ5c', tags: ['morning', 'raga'] },
      { id: 'rp-07', title: 'Raga Asavari', artist: 'Ustad Rashid Khan', duration: '36 min', ytId: 'xrhtPK5-RSM', tags: ['morning', 'raga'] },
      { id: 'rp-08', title: 'Raga Gunakali', artist: 'Bismillah Khan', duration: '22 min', ytId: 'k7OOBCibcI0', tags: ['morning', 'raga'] },
      { id: 'rp-09', title: 'Raga Komal Rishabh Asavari', artist: 'Ravi Shankar', duration: '33 min', ytId: 'ThcAD8R0YRk', tags: ['morning', 'raga'] },
      { id: 'rp-10', title: 'Raga Desi', artist: 'Pandit Ravi Shankar', duration: '27 min', ytId: 'ynDVvoPKjAw', tags: ['morning', 'raga'] },
    ],
  },
  {
    id: 'raga-sandhya',
    title: 'Raga Sandhya',
    subtitle: 'Evening Ragas',
    genre: 'Raga',
    color: '#7048E8',
    accent: '#F5F3FF',
    description: 'Evening ragas that capture the twilight hour — reflective, deep, and luminous.',
    tracks: [
      { id: 'rs-01', title: 'Raga Yaman', artist: 'Ustad Rashid Khan', duration: '45 min', ytId: '4eFzfbicz6k', tags: ['evening', 'raga'] },
      { id: 'rs-02', title: 'Raga Bhupali', artist: 'Pandit Ravi Shankar', duration: '34 min', ytId: '7VaGBqBFag4', tags: ['evening', 'raga'] },
      { id: 'rs-03', title: 'Raga Marwa', artist: 'Amjad Ali Khan', duration: '38 min', ytId: '2yhTw_uYIRU', tags: ['evening', 'raga'] },
      { id: 'rs-04', title: 'Raga Puriya Kalyan', artist: 'Shivkumar Sharma', duration: '42 min', ytId: '-VZeEIKdn7M', tags: ['evening', 'raga'] },
      { id: 'rs-05', title: 'Raga Kedar', artist: 'Hariprasad Chaurasia', duration: '36 min', ytId: 'XxF-FB0hijA', tags: ['evening', 'raga'] },
      { id: 'rs-06', title: 'Raga Hameer', artist: 'Vilayat Khan', duration: '29 min', ytId: 'E28eoBo0mkI', tags: ['evening', 'raga'] },
      { id: 'rs-07', title: 'Raga Shuddh Kalyan', artist: 'Pandit Jasraj', duration: '48 min', ytId: 'x3VnMFnF5QE', tags: ['evening', 'raga'] },
      { id: 'rs-08', title: 'Raga Bageshri', artist: 'Kishori Amonkar', duration: '35 min', ytId: 'ejib8Tubv7Y', tags: ['evening', 'raga'] },
      { id: 'rs-09', title: 'Raga Kamod', artist: 'Ustad Zakir Hussain', duration: '27 min', ytId: 'uhyJrNxTxQ4', tags: ['evening', 'raga'] },
      { id: 'rs-10', title: 'Raga Bihag', artist: 'Pandit Bhimsen Joshi', duration: '40 min', ytId: 'lEroLI7QX8w', tags: ['evening', 'raga'] },
    ],
  },
  {
    id: 'raga-ratri',
    title: 'Raga Ratri',
    subtitle: 'Night Ragas',
    genre: 'Raga',
    color: '#1A0F3C',
    accent: '#A78BFA',
    description: 'Deep night ragas for late-hour meditation — vast, still, and profoundly settling.',
    tracks: [
      { id: 'rr-01', title: 'Raga Darbari Kanada', artist: 'Ustad Rashid Khan', duration: '52 min', ytId: 'CdqjCt2DRQk', tags: ['night', 'raga'] },
      { id: 'rr-02', title: 'Raga Malkauns', artist: 'Pandit Bhimsen Joshi', duration: '46 min', ytId: 'sneMFUOomv8', tags: ['night', 'raga'] },
      { id: 'rr-03', title: 'Raga Yaman Kalyan', artist: 'Ravi Shankar', duration: '38 min', ytId: 'Dy3cnSKtgcA', tags: ['night', 'raga'] },
      { id: 'rr-04', title: 'Raga Charukeshi', artist: 'Hariprasad Chaurasia', duration: '33 min', ytId: 'HPdg75gadgc', tags: ['night', 'raga'] },
      { id: 'rr-05', title: 'Raga Chandrakauns', artist: 'Amjad Ali Khan', duration: '44 min', ytId: 'yJuRh_N2Pik', tags: ['night', 'raga'] },
      { id: 'rr-06', title: 'Raga Kafi', artist: 'Ustad Vilayat Khan', duration: '31 min', ytId: 'Ir75SGvWfXQ', tags: ['night', 'raga'] },
      { id: 'rr-07', title: 'Raga Bageshri', artist: 'Pandit Shivkumar Sharma', duration: '40 min', ytId: 'APP5mLY__zQ', tags: ['night', 'raga'] },
      { id: 'rr-08', title: 'Raga Bhatiyar', artist: 'Pandit Jasraj', duration: '35 min', ytId: '7hhX-Ru6YU4', tags: ['night', 'raga'] },
      { id: 'rr-09', title: 'Raga Tilak Kamod', artist: 'Rashid Khan', duration: '28 min', ytId: 'y_PjbArrUYo', tags: ['night', 'raga'] },
    ],
  },
  {
    id: 'solfeggio',
    title: 'Solfeggio Sacred Tones',
    subtitle: 'Sacred Frequencies',
    genre: 'Solfeggio',
    color: '#0CA678',
    accent: '#ECFDF5',
    description: 'The nine ancient solfeggio frequencies — each a key to a different dimension of healing.',
    tracks: [
      { id: 'sf-01', title: '174Hz — Foundation & Pain Relief', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'mFTYggwY34M', tags: ['solfeggio', 'healing'] },
      { id: 'sf-02', title: '285Hz — Tissue Regeneration', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'O275wnurMEQ', tags: ['solfeggio', 'healing'] },
      { id: 'sf-03', title: '396Hz — Liberation from Fear', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'LU_lEl-n5Ec', tags: ['solfeggio', 'healing'] },
      { id: 'sf-04', title: '417Hz — Undoing Situations', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'mX_UYl5kyoE', tags: ['solfeggio', 'healing'] },
      { id: 'sf-05', title: '528Hz — Love Frequency', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'lLQ7lEhpfjc', tags: ['solfeggio', 'healing'] },
      { id: 'sf-06', title: '639Hz — Relationship Harmony', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'NBIHLcNFnX4', tags: ['solfeggio', 'healing'] },
      { id: 'sf-07', title: '741Hz — Expression & Solutions', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'gIQaUEAOkUk', tags: ['solfeggio', 'healing'] },
      { id: 'sf-08', title: '852Hz — Spiritual Return', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'RDCKZk-KsI4', tags: ['solfeggio', 'healing'] },
      { id: 'sf-09', title: '963Hz — Pineal Activation', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'JmKYU38wNFE', tags: ['solfeggio', 'healing'] },
    ],
  },
  {
    id: 'binaural-depth',
    title: 'Binaural Depth',
    subtitle: 'Brainwave Entrainment',
    genre: 'Binaural',
    color: '#3B5BDB',
    accent: '#EEF2FF',
    description: 'Pure binaural beats across all brainwave bands — Delta through Gamma.',
    tracks: [
      { id: 'bn-01', title: 'Delta 0.5Hz — Deep Sleep', artist: 'Binaural Depth', duration: '60 min', ytId: 'eOhhvWElyWs', tags: ['binaural', 'sleep'] },
      { id: 'bn-02', title: 'Delta 2Hz — Dreamless Rest', artist: 'Binaural Depth', duration: '45 min', ytId: 'SCWtZihkAE8', tags: ['binaural', 'sleep'] },
      { id: 'bn-03', title: 'Theta 4Hz — Meditation', artist: 'Binaural Depth', duration: '45 min', ytId: 'qQ_W1w9v-2Y', tags: ['binaural', 'meditation'] },
      { id: 'bn-04', title: 'Theta 6Hz — Creative Flow', artist: 'Binaural Depth', duration: '40 min', ytId: 'aCF07BQ3znE', tags: ['binaural', 'focus'] },
      { id: 'bn-05', title: 'Alpha 8Hz — Relaxation', artist: 'Binaural Depth', duration: '40 min', ytId: 'uh7rcb4obuQ', tags: ['binaural', 'relax'] },
      { id: 'bn-06', title: 'Alpha 10Hz — Calm Focus', artist: 'Binaural Depth', duration: '45 min', ytId: 'vYf5NZrLbY4', tags: ['binaural', 'focus'] },
      { id: 'bn-07', title: 'Beta 14Hz — Active Mind', artist: 'Binaural Depth', duration: '30 min', ytId: 'HA6nSQawROM', tags: ['binaural', 'focus'] },
      { id: 'bn-08', title: 'Beta 20Hz — Alertness', artist: 'Binaural Depth', duration: '30 min', ytId: '5lN3X5qVoqQ', tags: ['binaural', 'focus'] },
      { id: 'bn-09', title: 'Gamma 40Hz — Peak Performance', artist: 'Binaural Depth', duration: '30 min', ytId: 'AiGShfz6ddw', tags: ['binaural', 'focus'] },
      { id: 'bn-10', title: 'Gamma 100Hz — Hyper Focus', artist: 'Binaural Depth', duration: '25 min', ytId: '3TYarb_Q-Yc', tags: ['binaural', 'focus'] },
    ],
  },
  {
    id: 'fusion',
    title: 'Western · Indian Fusion',
    subtitle: 'Cross-Cultural Masters',
    genre: 'Fusion',
    color: '#E64980',
    accent: '#FFF0F6',
    description: 'East meets West — transcendent collaborations between Indian classical and Western masters.',
    tracks: [
      { id: 'fu-01', title: 'Passages', artist: 'Ravi Shankar & Philip Glass', duration: '8 min', ytId: '9ODkIhKL2fY', tags: ['fusion'] },
      { id: 'fu-02', title: 'Joy', artist: 'Shakti (John McLaughlin)', duration: '9 min', ytId: 'VnW2g6qbbrA', tags: ['fusion'] },
      { id: 'fu-03', title: 'Breathing Under Water', artist: 'Anoushka Shankar', duration: '6 min', ytId: 'Z_HT-d8W1_M', tags: ['fusion'] },
      { id: 'fu-04', title: 'Sangam', artist: 'Zakir Hussain & Charles Lloyd', duration: '12 min', ytId: 'fSz4aUMYOcw', tags: ['fusion'] },
      { id: 'fu-05', title: 'Crazy Saints', artist: 'Trilok Gurtu', duration: '7 min', ytId: 'nj8W-ToId2E', tags: ['fusion'] },
      { id: 'fu-06', title: 'Junun', artist: 'Shye Ben Tzur & Jonny Greenwood', duration: '9 min', ytId: 'pQ9uZLOWlso', tags: ['fusion'] },
      { id: 'fu-07', title: 'Table of Contents', artist: 'Bela Fleck & Zakir Hussain', duration: '7 min', ytId: 'Cx8AaSvH4EQ', tags: ['fusion'] },
      { id: 'fu-08', title: 'Nirvana', artist: 'Ravi Shankar & Yehudi Menuhin', duration: '11 min', ytId: 'fJ5ZBkZGW9U', tags: ['fusion'] },
      { id: 'fu-09', title: 'East Meets West', artist: 'Pandit Ronu Majumdar', duration: '8 min', ytId: '90Iu8z0j0nI', tags: ['fusion'] },
      { id: 'fu-10', title: 'Garden of Eden', artist: 'Ustad Sultan Khan', duration: '10 min', ytId: 'EIGtMrQrd7g', tags: ['fusion'] },
    ],
  },
  {
    id: 'bansuri',
    title: 'Bansuri Meditations',
    subtitle: 'Flute Masters',
    genre: 'Raga',
    color: '#0CA678',
    accent: '#ECFDF5',
    description: 'The bansuri — bamboo flute of the divine — played by masters who breathe the raga into existence.',
    tracks: [
      { id: 'bm-01', title: 'Misra Khamaj', artist: 'Hariprasad Chaurasia', duration: '38 min', ytId: 'Hed2c_dUmWk', tags: ['bansuri', 'raga'] },
      { id: 'bm-02', title: 'Bhairavi Thumri', artist: 'Ronu Majumdar', duration: '25 min', ytId: 'U4mKpoj_ZX8', tags: ['bansuri', 'raga'] },
      { id: 'bm-03', title: 'Raga Bhimpalasi', artist: 'Hariprasad Chaurasia', duration: '34 min', ytId: 'hbA8-n7FNnA', tags: ['bansuri', 'raga'] },
      { id: 'bm-04', title: 'Raga Bageshri (Bansuri)', artist: 'Ronu Majumdar', duration: '29 min', ytId: 'H9hYlhAkLE0', tags: ['bansuri', 'raga'] },
      { id: 'bm-05', title: 'Raga Shivranjani', artist: 'Hariprasad Chaurasia', duration: '27 min', ytId: 'p0CK4J02ZRI', tags: ['bansuri', 'raga'] },
      { id: 'bm-06', title: 'Morning Raga Meditation', artist: 'Pravin Godkhindi', duration: '40 min', ytId: '6P5XBqQvRZM', tags: ['bansuri', 'raga'] },
      { id: 'bm-07', title: 'Raga Yaman (Bansuri)', artist: 'Ronu Majumdar', duration: '32 min', ytId: 'x6jTZfBZ9Og', tags: ['bansuri', 'raga'] },
      { id: 'bm-08', title: 'Raga Kirwani', artist: 'Hariprasad Chaurasia', duration: '28 min', ytId: 'kAqrppmbQ5U', tags: ['bansuri', 'raga'] },
      { id: 'bm-09', title: 'Healing Flute', artist: 'Steve Gold & Ronu Majumdar', duration: '45 min', ytId: 'mf9aCmqT5RE', tags: ['bansuri', 'healing'] },
    ],
  },
  {
    id: 'tanpura-drone',
    title: 'Tanpura & Drone World',
    subtitle: 'Sacred Drone',
    genre: 'Drone',
    color: '#6366F1',
    accent: '#EEF2FF',
    description: 'Infinite drone fields — tanpura, shruti box, and sacred harmonic foundations for meditation.',
    tracks: [
      { id: 'td-01', title: 'Tanpura Sa — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: '47ED-zK3t7U', tags: ['drone', 'tanpura'] },
      { id: 'td-02', title: 'Tanpura Pa — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: '47ED-zK3t7U', tags: ['drone', 'tanpura'] },
      { id: 'td-03', title: 'Tanpura Ma — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: '47ED-zK3t7U', tags: ['drone', 'tanpura'] },
      { id: 'td-04', title: 'Tanpura Ni — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: 'AaXezCmilPY', tags: ['drone', 'tanpura'] },
      { id: 'td-05', title: 'C Drone — 432Hz', artist: 'Drone World', duration: '60 min', ytId: '47ED-zK3t7U', tags: ['drone', '432hz'] },
      { id: 'td-06', title: 'D Drone — Healing', artist: 'Drone World', duration: '60 min', ytId: 'gqNdvuPPaJ4', tags: ['drone', 'healing'] },
      { id: 'td-07', title: 'Om Drone — Deep Meditation', artist: 'Drone World', duration: '60 min', ytId: 'VpDa7Q0jx5Q', tags: ['drone', 'meditation'] },
      { id: 'td-08', title: 'Shruti Box A', artist: 'Drone World', duration: '45 min', ytId: 'HwOmfHE0xFI', tags: ['drone', 'shruti'] },
      { id: 'td-09', title: 'Swarmandal Drone', artist: 'Drone World', duration: '45 min', ytId: 'xfI4xK93K-I', tags: ['drone'] },
    ],
  },
  {
    id: 'tibetan-bowls',
    title: 'Tibetan Bowl Sessions',
    subtitle: 'Crystal & Metal Bowls',
    genre: 'Bowls',
    color: '#F59F00',
    accent: '#FFFBEB',
    description: 'Singing bowls tuned to each chakra frequency — ancient resonance for deep healing.',
    tracks: [
      { id: 'tb-01', title: '7 Chakra Bowls — Full Session', artist: 'Tibetan Bowl Masters', duration: '60 min', ytId: 'EyrimDMod4I', tags: ['bowls', 'chakra'] },
      { id: 'tb-02', title: 'Root Chakra 396Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'd7ZQpunacp0', tags: ['bowls', 'chakra'] },
      { id: 'tb-03', title: 'Sacral Chakra 417Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'WnoxSeZsTyI', tags: ['bowls', 'chakra'] },
      { id: 'tb-04', title: 'Solar Plexus 528Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'h6PPpikbMjo', tags: ['bowls', 'chakra'] },
      { id: 'tb-05', title: 'Heart Chakra 639Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'XaPYrJt1l_4', tags: ['bowls', 'chakra'] },
      { id: 'tb-06', title: 'Throat Chakra 741Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'niY96dH7U-c', tags: ['bowls', 'chakra'] },
      { id: 'tb-07', title: 'Third Eye 852Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: '5UmLBQkb9mo', tags: ['bowls', 'chakra'] },
      { id: 'tb-08', title: 'Crown 963Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'ICPL5QLdB2U', tags: ['bowls', 'chakra'] },
      { id: 'tb-09', title: 'Tibetan Master Bowl Meditation', artist: 'Tibetan Bowl Masters', duration: '45 min', ytId: 'TAESZsLJdVw', tags: ['bowls'] },
    ],
  },
  {
    id: '432hz-healing',
    title: '432Hz Healing Series',
    subtitle: 'The Natural Frequency',
    genre: '432Hz',
    color: '#E64980',
    accent: '#FFF0F6',
    description: '432Hz — the frequency of nature, the universe, and the human heart. Pure healing resonance.',
    tracks: [
      { id: 'hz-01', title: '432Hz Sleep Music', artist: '432Hz Healing', duration: '3 hrs', ytId: 'kRsHvtRMkYc', tags: ['432hz', 'sleep'] },
      { id: 'hz-02', title: '432Hz Deep Meditation', artist: '432Hz Healing', duration: '1 hr', ytId: 'cca9v8AkUXU', tags: ['432hz', 'meditation'] },
      { id: 'hz-03', title: '432Hz Healing Music — Piano', artist: '432Hz Healing', duration: '1 hr', ytId: '8XBpZAetcb8', tags: ['432hz', 'healing'] },
      { id: 'hz-04', title: '432Hz Nature Sounds', artist: '432Hz Healing', duration: '2 hrs', ytId: '0fjo9ZwpepA', tags: ['432hz', 'nature'] },
      { id: 'hz-05', title: '432Hz Delta Waves', artist: '432Hz Healing', duration: '8 hrs', ytId: 'txQ6t4yPIM0', tags: ['432hz', 'sleep'] },
      { id: 'hz-06', title: '432Hz Theta Meditation', artist: '432Hz Healing', duration: '1 hr', ytId: '2l_gWmjBiV0', tags: ['432hz', 'meditation'] },
      { id: 'hz-07', title: '432Hz Alpha Waves', artist: '432Hz Healing', duration: '1 hr', ytId: 'VUnN0jILbmQ', tags: ['432hz', 'relax'] },
      { id: 'hz-08', title: '432Hz Solfeggio Blend', artist: '432Hz Healing', duration: '1 hr', ytId: 'C9hMaqQFKXk', tags: ['432hz', 'solfeggio'] },
      { id: 'hz-09', title: '432Hz Positive Energy', artist: '432Hz Healing', duration: '1 hr', ytId: 'IU13sdrLQ-M', tags: ['432hz', 'healing'] },
    ],
  },
  {
    id: 'nature-raga',
    title: 'Nature + Raga Blends',
    subtitle: 'Earth & Raga',
    genre: 'Nature',
    color: '#2F9E44',
    accent: '#EBFBEE',
    description: 'Classical ragas woven with the sounds of rain, forest, ocean, and birdsong.',
    tracks: [
      { id: 'nr-01', title: 'Raga Bhupali + Rain', artist: 'Nature Raga Blends', duration: '35 min', ytId: '1654bKyVwb4', tags: ['nature', 'raga'] },
      { id: 'nr-02', title: 'Raga Bhairav + Forest Dawn', artist: 'Nature Raga Blends', duration: '40 min', ytId: 'GKrGyBWyn3M', tags: ['nature', 'raga'] },
      { id: 'nr-03', title: 'Raga Bageshri + Ocean', artist: 'Nature Raga Blends', duration: '38 min', ytId: 'jLOrLqbvV88', tags: ['nature', 'raga'] },
      { id: 'nr-04', title: 'Bansuri + Rainforest', artist: 'Nature Raga Blends', duration: '45 min', ytId: 'zQtfnPTlFFE', tags: ['nature', 'bansuri'] },
      { id: 'nr-05', title: 'Sitar + Himalayan Wind', artist: 'Nature Raga Blends', duration: '32 min', ytId: 'KzqSXO6X66Y', tags: ['nature', 'raga'] },
      { id: 'nr-06', title: 'Sarod + River', artist: 'Nature Raga Blends', duration: '36 min', ytId: 'y13pBvh0r5Y', tags: ['nature', 'raga'] },
      { id: 'nr-07', title: 'Flute + Waterfall', artist: 'Nature Raga Blends', duration: '42 min', ytId: 'HOmjFCECnOU', tags: ['nature', 'bansuri'] },
      { id: 'nr-08', title: 'Raga Todi + Birds at Dawn', artist: 'Nature Raga Blends', duration: '38 min', ytId: 'pSfoglIlsss', tags: ['nature', 'raga'] },
      { id: 'nr-09', title: 'Raga Malkauns + Midnight', artist: 'Nature Raga Blends', duration: '50 min', ytId: '0KB8bdObKS0', tags: ['nature', 'raga'] },
    ],
  },
  {
    id: 'sarod-sitar',
    title: 'Sarod & Sitar Masters',
    subtitle: 'String Legends',
    genre: 'Raga',
    color: '#B45309',
    accent: '#FFF7ED',
    description: 'The greatest sarod and sitar recordings — architectural sound, profound depth.',
    tracks: [
      { id: 'ss-01', title: 'Raga Yaman', artist: 'Ustad Amjad Ali Khan', duration: '46 min', ytId: 'iWllVettpbA', tags: ['sarod', 'raga'] },
      { id: 'ss-02', title: 'Raga Darbari', artist: 'Amjad Ali Khan', duration: '52 min', ytId: 'ld7cedSfTk0', tags: ['sarod', 'raga'] },
      { id: 'ss-03', title: 'Raga Bhairavi', artist: 'Ravi Shankar (Sitar)', duration: '38 min', ytId: 'n91Vhdrrkss', tags: ['sitar', 'raga'] },
      { id: 'ss-04', title: 'Raga Multani', artist: 'Amjad Ali Khan', duration: '44 min', ytId: '2TdJmkSfxAs', tags: ['sarod', 'raga'] },
      { id: 'ss-05', title: 'Raga Shree', artist: 'Vilayat Khan', duration: '39 min', ytId: 'Ah9iD83a0Nk', tags: ['sitar', 'raga'] },
      { id: 'ss-06', title: 'Raga Jog', artist: 'Ravi Shankar', duration: '33 min', ytId: 'aNKTWhcw5nI', tags: ['sitar', 'raga'] },
      { id: 'ss-07', title: 'Raga Lalit', artist: 'Amjad Ali Khan', duration: '48 min', ytId: 'DofXpB0B47k', tags: ['sarod', 'raga'] },
      { id: 'ss-08', title: 'Raga Miyan Ki Malhar', artist: 'Shahid Parvez', duration: '41 min', ytId: 'CByPTp2Rcgw', tags: ['sitar', 'raga'] },
    ],
  },
];

export const TOTAL_TRACKS = ALBUMS.reduce((acc, a) => acc + a.tracks.length, 0);

export const CATEGORIES = ['All', 'Raga', 'Solfeggio', 'Binaural', 'Fusion', 'Bowls', '432Hz', 'Nature', 'Drone'];

export function getAlbumsByCategory(cat: string): Album[] {
  if (cat === 'All') return ALBUMS;
  return ALBUMS.filter(a => a.genre === cat);
}
