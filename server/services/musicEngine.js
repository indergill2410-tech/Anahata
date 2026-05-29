const { analyzeBiometrics, selectBinauralTone } = require('../utils/biometricAnalyzer');
const { TRACKS } = require('../data/tracks');

/**
 * musicEngine — maps biometrics to a meditation music recommendation
 * In production: replace selectTrack with actual AI/audio generation API call
 */

function selectTrack(brainwaveState, binauralHz) {
  // Filter tracks matching brainwave state
  const candidates = TRACKS.filter(t =>
    t.brainwave === brainwaveState ||
    (t.category === 'Binaural + Indian Fusion' && Math.abs((t.binauralHz || 0) - binauralHz) < 2)
  );
  const pool = candidates.length > 0 ? candidates : TRACKS;
  // Random selection from top matches for variety
  return pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
}

/**
 * Generate meditation response from biometric input
 * @param {{ heartRate: number, hrv?: number, spo2?: number }} biometrics
 * @returns {Object} meditation session data
 */
async function generateMeditation(biometrics) {
  const { heartRate, hrv, spo2 } = biometrics;
  const analysis = analyzeBiometrics(heartRate);
  const binauralHz = selectBinauralTone(analysis.brainwaveState, hrv);
  const track = selectTrack(analysis.brainwaveState, binauralHz);

  return {
    ...analysis,
    binauralHz,
    audioUrl:  track?.url || null,
    trackId:   track?.id  || null,
    trackTitle: track?.title || null,
    spo2: spo2 || null,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { generateMeditation, selectTrack };
