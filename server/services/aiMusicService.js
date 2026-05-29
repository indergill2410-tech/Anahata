/**
 * aiMusicService — AI music generation stub
 *
 * In production: replace generateAiTrack() with a real AI audio API call
 * (e.g. Suno AI, Udio, ElevenLabs, or a self-hosted model).
 *
 * Currently: selects a matching track from the local library as fallback.
 */

const { generateMeditation } = require('./musicEngine');

/**
 * fetchAiMusic — called by older meditation.js references
 * Delegates to musicEngine for consistency.
 * @param {{ brainwaveState, binauralHz, musicalTempo }} params
 */
async function fetchAiMusic(params) {
  // In production: POST to AI music API here
  // const res = await fetch('https://api.ai-music.example/generate', { ... });

  // Fallback: select from local library
  const { TRACKS } = require('../data/tracks');
  const bw = params.brainwaveState || 'Theta';
  const hz = params.binauralHz    || 6;

  const candidates = TRACKS.filter(t =>
    t.brainwave === bw ||
    (t.binauralHz && Math.abs(t.binauralHz - hz) < 2)
  );
  const pool  = candidates.length > 0 ? candidates : TRACKS;
  const track = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];

  return {
    url:        track?.url || null,
    duration:   track?.duration || 660,
    trackId:    track?.id || null,
    trackTitle: track?.title || null,
    isFallback: true
  };
}

module.exports = { fetchAiMusic };
