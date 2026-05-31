export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  ytId: string;
  tags?: string[];
  audioUrl?: string; // R2-backed audio URL (takes priority over ytId)
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
      { id: 'rp-01', title: 'Raga Bhairav', artist: 'Pandit Hariprasad Chaurasia', duration: '38 min', ytId: 'f_yNQSb-EtM', tags: ['morning', 'raga'] },
      { id: 'rp-02', title: 'Raga Lalit', artist: 'Ustad Vilayat Khan', duration: '42 min', ytId: 'uQQL6UqgFT8', tags: ['morning', 'raga'] },
      { id: 'rp-03', title: 'Raga Ahir Bhairav', artist: 'Hariprasad Chaurasia', duration: '35 min', ytId: '1ZYbU82GVz4', tags: ['morning', 'raga'] },
      { id: 'rp-04', title: 'Raga Ramkali', artist: 'Amjad Ali Khan', duration: '44 min', ytId: 'tQG2bpUvQr8', tags: ['morning', 'raga'] },
      { id: 'rp-05', title: 'Raga Todi', artist: 'Pandit Shivkumar Sharma', duration: '31 min', ytId: 'SvW3mRMxJJg', tags: ['morning', 'raga'] },
      { id: 'rp-06', title: 'Raga Jaunpuri', artist: 'Kishori Amonkar', duration: '29 min', ytId: '3EGTvOnIcGk', tags: ['morning', 'raga'] },
      { id: 'rp-07', title: 'Raga Asavari', artist: 'Ustad Rashid Khan', duration: '36 min', ytId: 'N_mEKJ4-UAI', tags: ['morning', 'raga'] },
      { id: 'rp-08', title: 'Raga Gunakali', artist: 'Bismillah Khan', duration: '22 min', ytId: 'k6JW1Sm2hRc', tags: ['morning', 'raga'] },
      { id: 'rp-09', title: 'Raga Komal Rishabh Asavari', artist: 'Ravi Shankar', duration: '33 min', ytId: 'r0bYhQ3SLAE', tags: ['morning', 'raga'] },
      { id: 'rp-10', title: 'Raga Desi', artist: 'Pandit Ravi Shankar', duration: '27 min', ytId: 'LXL-hLuStOE', tags: ['morning', 'raga'] },
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
      { id: 'rs-01', title: 'Raga Yaman', artist: 'Ustad Rashid Khan', duration: '45 min', ytId: 'gJGNg8aPgdU', tags: ['evening', 'raga'] },
      { id: 'rs-02', title: 'Raga Bhupali', artist: 'Pandit Ravi Shankar', duration: '34 min', ytId: 'E6I0bsMCTbU', tags: ['evening', 'raga'] },
      { id: 'rs-03', title: 'Raga Marwa', artist: 'Amjad Ali Khan', duration: '38 min', ytId: 'GkXNsj3UQXQ', tags: ['evening', 'raga'] },
      { id: 'rs-04', title: 'Raga Puriya Kalyan', artist: 'Shivkumar Sharma', duration: '42 min', ytId: 'g4mIDTEtqwI', tags: ['evening', 'raga'] },
      { id: 'rs-05', title: 'Raga Kedar', artist: 'Hariprasad Chaurasia', duration: '36 min', ytId: 'jLoMa1WyeCM', tags: ['evening', 'raga'] },
      { id: 'rs-06', title: 'Raga Hameer', artist: 'Vilayat Khan', duration: '29 min', ytId: 'WtHcEi4ZMXE', tags: ['evening', 'raga'] },
      { id: 'rs-07', title: 'Raga Shuddh Kalyan', artist: 'Pandit Jasraj', duration: '48 min', ytId: 'x3VnMFnF5QE', tags: ['evening', 'raga'] },
      { id: 'rs-08', title: 'Raga Bageshri', artist: 'Kishori Amonkar', duration: '35 min', ytId: 'hx-eXvbMbio', tags: ['evening', 'raga'] },
      { id: 'rs-09', title: 'Raga Kamod', artist: 'Ustad Zakir Hussain', duration: '27 min', ytId: 'Qm_xMkT9qeE', tags: ['evening', 'raga'] },
      { id: 'rs-10', title: 'Raga Bihag', artist: 'Pandit Bhimsen Joshi', duration: '40 min', ytId: 'YVvFBRRrDjM', tags: ['evening', 'raga'] },
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
      { id: 'rr-01', title: 'Raga Darbari Kanada', artist: 'Ustad Rashid Khan', duration: '52 min', ytId: 'BVWTi_1M_sM', tags: ['night', 'raga'] },
      { id: 'rr-02', title: 'Raga Malkauns', artist: 'Pandit Bhimsen Joshi', duration: '46 min', ytId: 'j3XZ8FVKWUA', tags: ['night', 'raga'] },
      { id: 'rr-03', title: 'Raga Yaman Kalyan', artist: 'Ravi Shankar', duration: '38 min', ytId: 'HT2CRhp8vG8', tags: ['night', 'raga'] },
      { id: 'rr-04', title: 'Raga Charukeshi', artist: 'Hariprasad Chaurasia', duration: '33 min', ytId: 'YaRmKk3_OQo', tags: ['night', 'raga'] },
      { id: 'rr-05', title: 'Raga Chandrakauns', artist: 'Amjad Ali Khan', duration: '44 min', ytId: 'WZuWWNNMePQ', tags: ['night', 'raga'] },
      { id: 'rr-06', title: 'Raga Kafi', artist: 'Ustad Vilayat Khan', duration: '31 min', ytId: 'RFCbMkRx8pY', tags: ['night', 'raga'] },
      { id: 'rr-07', title: 'Raga Bageshri', artist: 'Pandit Shivkumar Sharma', duration: '40 min', ytId: 'p8eGWRaqnx4', tags: ['night', 'raga'] },
      { id: 'rr-08', title: 'Raga Bhatiyar', artist: 'Pandit Jasraj', duration: '35 min', ytId: 'V5oItHYC_sQ', tags: ['night', 'raga'] },
      { id: 'rr-09', title: 'Raga Tilak Kamod', artist: 'Rashid Khan', duration: '28 min', ytId: 'lMCsQovKFrY', tags: ['night', 'raga'] },
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
      { id: 'sf-01', title: '174Hz — Foundation & Pain Relief', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'pZFpOVBxQ1k', tags: ['solfeggio', 'healing'] },
      { id: 'sf-02', title: '285Hz — Tissue Regeneration', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'lMCsQovKFrY', tags: ['solfeggio', 'healing'] },
      { id: 'sf-03', title: '396Hz — Liberation from Fear', artist: 'Solfeggio Tones', duration: '30 min', ytId: '76b2EqGEBHM', tags: ['solfeggio', 'healing'] },
      { id: 'sf-04', title: '417Hz — Undoing Situations', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'BSsfjTbhDmw', tags: ['solfeggio', 'healing'] },
      { id: 'sf-05', title: '528Hz — Love Frequency', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'jGqFGpbv46c', tags: ['solfeggio', 'healing'] },
      { id: 'sf-06', title: '639Hz — Relationship Harmony', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'NBIHLcNFnX4', tags: ['solfeggio', 'healing'] },
      { id: 'sf-07', title: '741Hz — Expression & Solutions', artist: 'Solfeggio Tones', duration: '30 min', ytId: '5M2VPiNxiNE', tags: ['solfeggio', 'healing'] },
      { id: 'sf-08', title: '852Hz — Spiritual Return', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'd3Q9WTzMlAk', tags: ['solfeggio', 'healing'] },
      { id: 'sf-09', title: '963Hz — Pineal Activation', artist: 'Solfeggio Tones', duration: '30 min', ytId: 'fAPYDJSEjOg', tags: ['solfeggio', 'healing'] },
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
      { id: 'bn-01', title: 'Delta 0.5Hz — Deep Sleep', artist: 'Binaural Depth', duration: '60 min', ytId: 'WHPYKLB9BnM', tags: ['binaural', 'sleep'] },
      { id: 'bn-02', title: 'Delta 2Hz — Dreamless Rest', artist: 'Binaural Depth', duration: '45 min', ytId: 'TLZ6_w9C_cE', tags: ['binaural', 'sleep'] },
      { id: 'bn-03', title: 'Theta 4Hz — Meditation', artist: 'Binaural Depth', duration: '45 min', ytId: 'ZToicYcHIOU', tags: ['binaural', 'meditation'] },
      { id: 'bn-04', title: 'Theta 6Hz — Creative Flow', artist: 'Binaural Depth', duration: '40 min', ytId: 'EQnFcfxN4i4', tags: ['binaural', 'focus'] },
      { id: 'bn-05', title: 'Alpha 8Hz — Relaxation', artist: 'Binaural Depth', duration: '40 min', ytId: 'rqCzGJ4IYGU', tags: ['binaural', 'relax'] },
      { id: 'bn-06', title: 'Alpha 10Hz — Calm Focus', artist: 'Binaural Depth', duration: '45 min', ytId: 'wnJVFnA0FoY', tags: ['binaural', 'focus'] },
      { id: 'bn-07', title: 'Beta 14Hz — Active Mind', artist: 'Binaural Depth', duration: '30 min', ytId: 'nzMCBOqFoqc', tags: ['binaural', 'focus'] },
      { id: 'bn-08', title: 'Beta 20Hz — Alertness', artist: 'Binaural Depth', duration: '30 min', ytId: '2OTmKDWfuAk', tags: ['binaural', 'focus'] },
      { id: 'bn-09', title: 'Gamma 40Hz — Peak Performance', artist: 'Binaural Depth', duration: '30 min', ytId: 'F4IR7km-9bY', tags: ['binaural', 'focus'] },
      { id: 'bn-10', title: 'Gamma 100Hz — Hyper Focus', artist: 'Binaural Depth', duration: '25 min', ytId: 'LVmtB-EsGxA', tags: ['binaural', 'focus'] },
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
      { id: 'fu-01', title: 'Passages', artist: 'Ravi Shankar & Philip Glass', duration: '8 min', ytId: 'LJe9fXFSYG0', tags: ['fusion'] },
      { id: 'fu-02', title: 'Joy', artist: 'Shakti (John McLaughlin)', duration: '9 min', ytId: 'n3Fz2md5HWw', tags: ['fusion'] },
      { id: 'fu-03', title: 'Breathing Under Water', artist: 'Anoushka Shankar', duration: '6 min', ytId: 'oZFNh_d7YOo', tags: ['fusion'] },
      { id: 'fu-04', title: 'Sangam', artist: 'Zakir Hussain & Charles Lloyd', duration: '12 min', ytId: '8_Gof-MaP9Y', tags: ['fusion'] },
      { id: 'fu-05', title: 'Crazy Saints', artist: 'Trilok Gurtu', duration: '7 min', ytId: 'Y9Dh3M-DzYI', tags: ['fusion'] },
      { id: 'fu-06', title: 'Junun', artist: 'Shye Ben Tzur & Jonny Greenwood', duration: '9 min', ytId: 'p8pghbpRdXs', tags: ['fusion'] },
      { id: 'fu-07', title: 'Table of Contents', artist: 'Bela Fleck & Zakir Hussain', duration: '7 min', ytId: 'z8D_Mhq6p04', tags: ['fusion'] },
      { id: 'fu-08', title: 'Nirvana', artist: 'Ravi Shankar & Yehudi Menuhin', duration: '11 min', ytId: 'm2EODF0XfXk', tags: ['fusion'] },
      { id: 'fu-09', title: 'East Meets West', artist: 'Pandit Ronu Majumdar', duration: '8 min', ytId: 'Ld0tPZaBgQk', tags: ['fusion'] },
      { id: 'fu-10', title: 'Garden of Eden', artist: 'Ustad Sultan Khan', duration: '10 min', ytId: 'oVUb0iYBBpQ', tags: ['fusion'] },
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
      { id: 'bm-01', title: 'Misra Khamaj', artist: 'Hariprasad Chaurasia', duration: '38 min', ytId: 'KwFCMBKn_PQ', tags: ['bansuri', 'raga'] },
      { id: 'bm-02', title: 'Bhairavi Thumri', artist: 'Ronu Majumdar', duration: '25 min', ytId: 'AriOhlDl4Wo', tags: ['bansuri', 'raga'] },
      { id: 'bm-03', title: 'Raga Bhimpalasi', artist: 'Hariprasad Chaurasia', duration: '34 min', ytId: 'Ie_f44dEKSY', tags: ['bansuri', 'raga'] },
      { id: 'bm-04', title: 'Raga Bageshri (Bansuri)', artist: 'Ronu Majumdar', duration: '29 min', ytId: 'rDEfxKXiKrc', tags: ['bansuri', 'raga'] },
      { id: 'bm-05', title: 'Raga Shivranjani', artist: 'Hariprasad Chaurasia', duration: '27 min', ytId: 'UWLGFpSRr0g', tags: ['bansuri', 'raga'] },
      { id: 'bm-06', title: 'Morning Raga Meditation', artist: 'Pravin Godkhindi', duration: '40 min', ytId: 'kMJz3TN7uZk', tags: ['bansuri', 'raga'] },
      { id: 'bm-07', title: 'Raga Yaman (Bansuri)', artist: 'Ronu Majumdar', duration: '32 min', ytId: 'uGCSEjMFmac', tags: ['bansuri', 'raga'] },
      { id: 'bm-08', title: 'Raga Kirwani', artist: 'Hariprasad Chaurasia', duration: '28 min', ytId: 'q1YWvWWn2Q0', tags: ['bansuri', 'raga'] },
      { id: 'bm-09', title: 'Healing Flute', artist: 'Steve Gold & Ronu Majumdar', duration: '45 min', ytId: 'V5oItHYC_sQ', tags: ['bansuri', 'healing'] },
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
      { id: 'td-01', title: 'Tanpura Sa — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: 'mUotGxHxVkw', tags: ['drone', 'tanpura'] },
      { id: 'td-02', title: 'Tanpura Pa — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: 'eCeGdFzXxWA', tags: ['drone', 'tanpura'] },
      { id: 'td-03', title: 'Tanpura Ma — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: 'pCxS2L6-kIs', tags: ['drone', 'tanpura'] },
      { id: 'td-04', title: 'Tanpura Ni — 60 min Drone', artist: 'Drone World', duration: '60 min', ytId: 'b4U7I0E9c1E', tags: ['drone', 'tanpura'] },
      { id: 'td-05', title: 'C Drone — 432Hz', artist: 'Drone World', duration: '60 min', ytId: 'lUQ-OjStBNQ', tags: ['drone', '432hz'] },
      { id: 'td-06', title: 'D Drone — Healing', artist: 'Drone World', duration: '60 min', ytId: 'K-9iB2ZzwVk', tags: ['drone', 'healing'] },
      { id: 'td-07', title: 'Om Drone — Deep Meditation', artist: 'Drone World', duration: '60 min', ytId: 'XqZsoesa55w', tags: ['drone', 'meditation'] },
      { id: 'td-08', title: 'Shruti Box A', artist: 'Drone World', duration: '45 min', ytId: 'Y4ADFTUiUhQ', tags: ['drone', 'shruti'] },
      { id: 'td-09', title: 'Swarmandal Drone', artist: 'Drone World', duration: '45 min', ytId: 'q3KeVQ8WqzA', tags: ['drone'] },
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
      { id: 'tb-01', title: '7 Chakra Bowls — Full Session', artist: 'Tibetan Bowl Masters', duration: '60 min', ytId: '09mZnBpFaOI', tags: ['bowls', 'chakra'] },
      { id: 'tb-02', title: 'Root Chakra 396Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'kIMmAi6VaGM', tags: ['bowls', 'chakra'] },
      { id: 'tb-03', title: 'Sacral Chakra 417Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'KgRCkMcLHpk', tags: ['bowls', 'chakra'] },
      { id: 'tb-04', title: 'Solar Plexus 528Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'cCp68bFBHiI', tags: ['bowls', 'chakra'] },
      { id: 'tb-05', title: 'Heart Chakra 639Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'OTa_9D8nnU4', tags: ['bowls', 'chakra'] },
      { id: 'tb-06', title: 'Throat Chakra 741Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'gJGNg8aPgdU', tags: ['bowls', 'chakra'] },
      { id: 'tb-07', title: 'Third Eye 852Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: '9gJwNr09NQE', tags: ['bowls', 'chakra'] },
      { id: 'tb-08', title: 'Crown 963Hz Bowl', artist: 'Tibetan Bowl Masters', duration: '30 min', ytId: 'RMfbJp0DWYY', tags: ['bowls', 'chakra'] },
      { id: 'tb-09', title: 'Tibetan Master Bowl Meditation', artist: 'Tibetan Bowl Masters', duration: '45 min', ytId: '04F4xlWSFh0', tags: ['bowls'] },
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
      { id: 'hz-01', title: '432Hz Sleep Music', artist: '432Hz Healing', duration: '3 hrs', ytId: 'jZbjEgR7Lno', tags: ['432hz', 'sleep'] },
      { id: 'hz-02', title: '432Hz Deep Meditation', artist: '432Hz Healing', duration: '1 hr', ytId: 'WN9r-Mp7i4s', tags: ['432hz', 'meditation'] },
      { id: 'hz-03', title: '432Hz Healing Music — Piano', artist: '432Hz Healing', duration: '1 hr', ytId: 'LWbFRZ3GZHU', tags: ['432hz', 'healing'] },
      { id: 'hz-04', title: '432Hz Nature Sounds', artist: '432Hz Healing', duration: '2 hrs', ytId: 'WHPYKLB9BnM', tags: ['432hz', 'nature'] },
      { id: 'hz-05', title: '432Hz Delta Waves', artist: '432Hz Healing', duration: '8 hrs', ytId: 'TLZ6_w9C_cE', tags: ['432hz', 'sleep'] },
      { id: 'hz-06', title: '432Hz Theta Meditation', artist: '432Hz Healing', duration: '1 hr', ytId: 'ZToicYcHIOU', tags: ['432hz', 'meditation'] },
      { id: 'hz-07', title: '432Hz Alpha Waves', artist: '432Hz Healing', duration: '1 hr', ytId: 'rqCzGJ4IYGU', tags: ['432hz', 'relax'] },
      { id: 'hz-08', title: '432Hz Solfeggio Blend', artist: '432Hz Healing', duration: '1 hr', ytId: 'jGqFGpbv46c', tags: ['432hz', 'solfeggio'] },
      { id: 'hz-09', title: '432Hz Positive Energy', artist: '432Hz Healing', duration: '1 hr', ytId: '76b2EqGEBHM', tags: ['432hz', 'healing'] },
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
      { id: 'nr-01', title: 'Raga Bhupali + Rain', artist: 'Nature Raga Blends', duration: '35 min', ytId: 'E6I0bsMCTbU', tags: ['nature', 'raga'] },
      { id: 'nr-02', title: 'Raga Bhairav + Forest Dawn', artist: 'Nature Raga Blends', duration: '40 min', ytId: 'f_yNQSb-EtM', tags: ['nature', 'raga'] },
      { id: 'nr-03', title: 'Raga Bageshri + Ocean', artist: 'Nature Raga Blends', duration: '38 min', ytId: 'hx-eXvbMbio', tags: ['nature', 'raga'] },
      { id: 'nr-04', title: 'Bansuri + Rainforest', artist: 'Nature Raga Blends', duration: '45 min', ytId: 'KwFCMBKn_PQ', tags: ['nature', 'bansuri'] },
      { id: 'nr-05', title: 'Sitar + Himalayan Wind', artist: 'Nature Raga Blends', duration: '32 min', ytId: 'gJGNg8aPgdU', tags: ['nature', 'raga'] },
      { id: 'nr-06', title: 'Sarod + River', artist: 'Nature Raga Blends', duration: '36 min', ytId: 'GkXNsj3UQXQ', tags: ['nature', 'raga'] },
      { id: 'nr-07', title: 'Flute + Waterfall', artist: 'Nature Raga Blends', duration: '42 min', ytId: 'AriOhlDl4Wo', tags: ['nature', 'bansuri'] },
      { id: 'nr-08', title: 'Raga Todi + Birds at Dawn', artist: 'Nature Raga Blends', duration: '38 min', ytId: 'SvW3mRMxJJg', tags: ['nature', 'raga'] },
      { id: 'nr-09', title: 'Raga Malkauns + Midnight', artist: 'Nature Raga Blends', duration: '50 min', ytId: 'j3XZ8FVKWUA', tags: ['nature', 'raga'] },
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
      { id: 'ss-01', title: 'Raga Yaman', artist: 'Ustad Amjad Ali Khan', duration: '46 min', ytId: 'GkXNsj3UQXQ', tags: ['sarod', 'raga'] },
      { id: 'ss-02', title: 'Raga Darbari', artist: 'Amjad Ali Khan', duration: '52 min', ytId: 'BVWTi_1M_sM', tags: ['sarod', 'raga'] },
      { id: 'ss-03', title: 'Raga Bhairavi', artist: 'Ravi Shankar (Sitar)', duration: '38 min', ytId: 'r0bYhQ3SLAE', tags: ['sitar', 'raga'] },
      { id: 'ss-04', title: 'Raga Multani', artist: 'Amjad Ali Khan', duration: '44 min', ytId: 'tQG2bpUvQr8', tags: ['sarod', 'raga'] },
      { id: 'ss-05', title: 'Raga Shree', artist: 'Vilayat Khan', duration: '39 min', ytId: 'uQQL6UqgFT8', tags: ['sitar', 'raga'] },
      { id: 'ss-06', title: 'Raga Jog', artist: 'Ravi Shankar', duration: '33 min', ytId: 'LXL-hLuStOE', tags: ['sitar', 'raga'] },
      { id: 'ss-07', title: 'Raga Lalit', artist: 'Amjad Ali Khan', duration: '48 min', ytId: 'WtHcEi4ZMXE', tags: ['sarod', 'raga'] },
      { id: 'ss-08', title: 'Raga Miyan Ki Malhar', artist: 'Shahid Parvez', duration: '41 min', ytId: 'Qm_xMkT9qeE', tags: ['sitar', 'raga'] },
    ],
  },
];

export const TOTAL_TRACKS = ALBUMS.reduce((acc, a) => acc + a.tracks.length, 0);

export const CATEGORIES = ['All', 'Raga', 'Solfeggio', 'Binaural', 'Fusion', 'Bowls', '432Hz', 'Nature', 'Drone'];

export function getAlbumsByCategory(cat: string): Album[] {
  if (cat === 'All') return ALBUMS;
  return ALBUMS.filter(a => a.genre === cat);
}
