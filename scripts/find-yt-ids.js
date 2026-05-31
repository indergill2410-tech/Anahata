#!/usr/bin/env node
/**
 * Searches YouTube for each track and updates libraryData.ts with real IDs.
 *
 * Prerequisites: yt-dlp installed
 * Usage: node scripts/find-yt-ids.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LIB_FILE = path.join(__dirname, '../client/src/data/libraryData.ts');

const tracks = [
  // Morning Ragas
  { id: 'rp-01', q: 'Raga Bhairav Hariprasad Chaurasia flute full' },
  { id: 'rp-02', q: 'Raga Lalit Vilayat Khan sitar' },
  { id: 'rp-03', q: 'Raga Ahir Bhairav Hariprasad Chaurasia' },
  { id: 'rp-04', q: 'Raga Ramkali Amjad Ali Khan sarod' },
  { id: 'rp-05', q: 'Raga Todi Shivkumar Sharma santoor' },
  { id: 'rp-06', q: 'Raga Jaunpuri Kishori Amonkar vocal' },
  { id: 'rp-07', q: 'Raga Asavari Rashid Khan vocal' },
  { id: 'rp-08', q: 'Raga Gunakali Bismillah Khan shehnai' },
  { id: 'rp-09', q: 'Raga Komal Rishabh Asavari Ravi Shankar sitar' },
  { id: 'rp-10', q: 'Raga Desi Ravi Shankar full concert' },
  // Evening Ragas
  { id: 'rs-01', q: 'Raga Yaman Rashid Khan vocal full' },
  { id: 'rs-02', q: 'Raga Bhupali Ravi Shankar sitar' },
  { id: 'rs-03', q: 'Raga Marwa Amjad Ali Khan sarod' },
  { id: 'rs-04', q: 'Raga Puriya Kalyan Shivkumar Sharma santoor' },
  { id: 'rs-05', q: 'Raga Kedar Hariprasad Chaurasia flute' },
  { id: 'rs-06', q: 'Raga Hameer Vilayat Khan sitar' },
  { id: 'rs-07', q: 'Raga Shuddh Kalyan Pandit Jasraj vocal' },
  { id: 'rs-08', q: 'Raga Bageshri Kishori Amonkar vocal' },
  { id: 'rs-09', q: 'Raga Kamod Zakir Hussain tabla concert' },
  { id: 'rs-10', q: 'Raga Bihag Bhimsen Joshi vocal' },
  // Night Ragas
  { id: 'rr-01', q: 'Raga Darbari Kanada Rashid Khan full' },
  { id: 'rr-02', q: 'Raga Malkauns Bhimsen Joshi vocal' },
  { id: 'rr-03', q: 'Raga Yaman Kalyan Ravi Shankar sitar' },
  { id: 'rr-04', q: 'Raga Charukeshi Hariprasad Chaurasia flute' },
  { id: 'rr-05', q: 'Raga Chandrakauns Amjad Ali Khan sarod' },
  { id: 'rr-06', q: 'Raga Kafi Vilayat Khan sitar full' },
  { id: 'rr-07', q: 'Raga Bageshri Shivkumar Sharma santoor' },
  { id: 'rr-08', q: 'Raga Bhatiyar Pandit Jasraj vocal' },
  { id: 'rr-09', q: 'Raga Tilak Kamod Rashid Khan full concert' },
  // Solfeggio
  { id: 'sf-01', q: '174hz solfeggio frequency healing 1 hour' },
  { id: 'sf-02', q: '285hz solfeggio frequency tissue regeneration' },
  { id: 'sf-03', q: '396hz solfeggio liberation fear 1 hour' },
  { id: 'sf-04', q: '417hz solfeggio undoing situations 1 hour' },
  { id: 'sf-05', q: '528hz solfeggio love frequency 1 hour' },
  { id: 'sf-06', q: '639hz solfeggio relationship harmony' },
  { id: 'sf-07', q: '741hz solfeggio expression solutions' },
  { id: 'sf-08', q: '852hz solfeggio spiritual return' },
  { id: 'sf-09', q: '963hz solfeggio pineal gland activation' },
  // Binaural
  { id: 'bn-01', q: '0.5hz delta binaural beats deep sleep 1 hour' },
  { id: 'bn-02', q: '2hz delta binaural beats dreamless sleep' },
  { id: 'bn-03', q: '4hz theta binaural beats meditation' },
  { id: 'bn-04', q: '6hz theta binaural beats creative flow' },
  { id: 'bn-05', q: '8hz alpha binaural beats relaxation' },
  { id: 'bn-06', q: '10hz alpha binaural beats calm focus' },
  { id: 'bn-07', q: '14hz beta binaural beats active mind focus' },
  { id: 'bn-08', q: '20hz beta binaural beats alertness' },
  { id: 'bn-09', q: '40hz gamma binaural beats peak performance' },
  { id: 'bn-10', q: '100hz gamma binaural beats hyper focus' },
  // Fusion
  { id: 'fu-01', q: 'Passages Ravi Shankar Philip Glass' },
  { id: 'fu-02', q: 'Joy Shakti John McLaughlin' },
  { id: 'fu-03', q: 'Breathing Under Water Anoushka Shankar' },
  { id: 'fu-04', q: 'Sangam Zakir Hussain Charles Lloyd' },
  { id: 'fu-05', q: 'Crazy Saints Trilok Gurtu' },
  { id: 'fu-06', q: 'Junun Shye Ben Tzur Jonny Greenwood' },
  { id: 'fu-07', q: 'Table of Contents Bela Fleck Zakir Hussain' },
  { id: 'fu-08', q: 'Nirvana Ravi Shankar Yehudi Menuhin' },
  { id: 'fu-09', q: 'East Meets West Ronu Majumdar flute' },
  { id: 'fu-10', q: 'Garden of Eden Sultan Khan sarangi' },
  // Bansuri
  { id: 'bm-01', q: 'Misra Khamaj Hariprasad Chaurasia bansuri' },
  { id: 'bm-02', q: 'Bhairavi Thumri Ronu Majumdar bansuri' },
  { id: 'bm-03', q: 'Raga Bhimpalasi Hariprasad Chaurasia flute' },
  { id: 'bm-04', q: 'Raga Bageshri Ronu Majumdar bansuri' },
  { id: 'bm-05', q: 'Raga Shivranjani Hariprasad Chaurasia bansuri' },
  { id: 'bm-06', q: 'Morning Raga Meditation bansuri flute 40 min' },
  { id: 'bm-07', q: 'Raga Yaman Ronu Majumdar bansuri flute' },
  { id: 'bm-08', q: 'Raga Kirwani Hariprasad Chaurasia bansuri' },
  { id: 'bm-09', q: 'healing bansuri flute meditation 45 minutes' },
  // Tanpura & Drone
  { id: 'td-01', q: 'tanpura sa drone 1 hour meditation' },
  { id: 'td-02', q: 'tanpura pa drone 1 hour' },
  { id: 'td-03', q: 'tanpura ma drone 1 hour meditation' },
  { id: 'td-04', q: 'tanpura ni drone 1 hour' },
  { id: 'td-05', q: 'C drone 432hz 1 hour meditation' },
  { id: 'td-06', q: 'D drone healing frequency 1 hour' },
  { id: 'td-07', q: 'Om drone deep meditation 1 hour' },
  { id: 'td-08', q: 'shruti box A drone 45 minutes' },
  { id: 'td-09', q: 'swarmandal drone meditation' },
  // Tibetan Bowls
  { id: 'tb-01', q: '7 chakra tibetan singing bowls full session 1 hour' },
  { id: 'tb-02', q: 'root chakra 396hz singing bowl meditation' },
  { id: 'tb-03', q: 'sacral chakra 417hz singing bowl' },
  { id: 'tb-04', q: 'solar plexus 528hz singing bowl' },
  { id: 'tb-05', q: 'heart chakra 639hz singing bowl' },
  { id: 'tb-06', q: 'throat chakra 741hz singing bowl' },
  { id: 'tb-07', q: 'third eye 852hz singing bowl' },
  { id: 'tb-08', q: 'crown chakra 963hz singing bowl' },
  { id: 'tb-09', q: 'tibetan master bowl meditation 45 minutes' },
  // 432Hz
  { id: 'hz-01', q: '432hz sleep music 3 hours' },
  { id: 'hz-02', q: '432hz deep meditation music 1 hour' },
  { id: 'hz-03', q: '432hz healing piano music 1 hour' },
  { id: 'hz-04', q: '432hz nature sounds healing 2 hours' },
  { id: 'hz-05', q: '432hz delta waves sleep 8 hours' },
  { id: 'hz-06', q: '432hz theta meditation 1 hour' },
  { id: 'hz-07', q: '432hz alpha waves relaxation 1 hour' },
  { id: 'hz-08', q: '432hz solfeggio blend meditation' },
  { id: 'hz-09', q: '432hz positive energy healing music' },
  // Nature + Raga
  { id: 'nr-01', q: 'Raga Bhupali rain nature sounds meditation' },
  { id: 'nr-02', q: 'Raga Bhairav forest dawn birds morning' },
  { id: 'nr-03', q: 'Raga Bageshri ocean waves music' },
  { id: 'nr-04', q: 'bansuri flute rainforest nature sounds' },
  { id: 'nr-05', q: 'sitar himalayan wind nature meditation' },
  { id: 'nr-06', q: 'sarod river water sounds meditation' },
  { id: 'nr-07', q: 'bansuri flute waterfall nature' },
  { id: 'nr-08', q: 'Raga Todi birds dawn morning nature' },
  { id: 'nr-09', q: 'Raga Malkauns midnight nature sounds' },
  // Sarod & Sitar
  { id: 'ss-01', q: 'Raga Yaman Amjad Ali Khan sarod full' },
  { id: 'ss-02', q: 'Raga Darbari Amjad Ali Khan sarod concert' },
  { id: 'ss-03', q: 'Raga Bhairavi Ravi Shankar sitar full' },
  { id: 'ss-04', q: 'Raga Multani Amjad Ali Khan sarod' },
  { id: 'ss-05', q: 'Raga Shree Vilayat Khan sitar' },
  { id: 'ss-06', q: 'Raga Jog Ravi Shankar sitar full' },
  { id: 'ss-07', q: 'Raga Lalit Amjad Ali Khan sarod' },
  { id: 'ss-08', q: 'Raga Miyan Ki Malhar Shahid Parvez sitar' },
];

function searchYT(query) {
  try {
    const result = execSync(
      `yt-dlp "ytsearch1:${query}" --get-id --no-playlist`,
      { timeout: 30000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    return result || null;
  } catch {
    return null;
  }
}

async function main() {
  const results = {};
  const total = tracks.length;

  for (let i = 0; i < tracks.length; i++) {
    const { id, q } = tracks[i];
    process.stdout.write(`[${i + 1}/${total}] Searching: ${q.substring(0, 60)}...\r`);
    const ytId = searchYT(q);
    results[id] = ytId;
    console.log(`[${i + 1}/${total}] ${id} -> ${ytId || 'NOT FOUND'}`);
  }

  // Save raw results
  fs.writeFileSync(path.join(__dirname, 'yt-ids.json'), JSON.stringify(results, null, 2));
  console.log('\nSaved to scripts/yt-ids.json');

  // Patch libraryData.ts
  let src = fs.readFileSync(LIB_FILE, 'utf8');
  let patched = 0;
  for (const [id, ytId] of Object.entries(results)) {
    if (!ytId) continue;
    const regex = new RegExp(`(id: '${id}'[^}]*ytId: ')[^']+(')`,'g');
    const newSrc = src.replace(regex, `$1${ytId}$2`);
    if (newSrc !== src) { src = newSrc; patched++; }
  }
  fs.writeFileSync(LIB_FILE, src);
  console.log(`Patched ${patched} YouTube IDs in libraryData.ts`);
}

main().catch(console.error);
