/**
 * biometricAnalyzer — core biometric → music mapping logic
 */

const BRAINWAVE_STATES = [
  { state: 'Delta', range: [0.5, 4],  hrRange: [40, 55],  binauralHz: 2,  description: 'Deep sleep / healing' },
  { state: 'Theta', range: [4, 8],    hrRange: [55, 68],  binauralHz: 6,  description: 'Deep meditation / REM' },
  { state: 'Alpha', range: [8, 14],   hrRange: [68, 78],  binauralHz: 10, description: 'Relaxed focus' },
  { state: 'Beta',  range: [14, 30],  hrRange: [78, 95],  binauralHz: 18, description: 'Active thinking' },
  { state: 'Gamma', range: [30, 100], hrRange: [95, 130], binauralHz: 40, description: 'Peak awareness' },
];

/**
 * Map heart rate to brainwave state
 * @param {number} hr - heart rate in bpm
 * @returns {{ state, binauralHz, description, targetHR, musicalTempo }}
 */
function analyzeBiometrics(hr) {
  if (!hr || hr < 30 || hr > 200) throw new Error('Invalid heart rate value.');

  // Find matching state
  const match = BRAINWAVE_STATES.find(s => hr >= s.hrRange[0] && hr < s.hrRange[1])
              || BRAINWAVE_STATES[1]; // default Theta

  // Target HR: guide user toward Theta (58–68)
  const targetHR = hr > 68 ? Math.max(58, hr - 5) : hr;

  // Musical tempo: slower than resting HR to guide breathing
  const musicalTempo = Math.round(targetHR * 0.85);

  return {
    brainwaveState: match.state,
    binauralHz:     match.binauralHz,
    description:    match.description,
    targetHeartRate: targetHR,
    musicalTempo,
    stressLevel: hr > 80 ? 'elevated' : hr > 68 ? 'moderate' : 'calm'
  };
}

/**
 * Calculate HRV-based binaural offset
 * @param {number} hrv - RMSSD value in ms
 * @returns {number} offset in Hz
 */
function hrvBinauralOffset(hrv) {
  if (!hrv || hrv < 0) return 0;
  // Higher HRV → slightly higher binaural Hz (user is more coherent)
  if (hrv < 20)  return -1.5;
  if (hrv < 40)  return 0;
  if (hrv < 60)  return 0.5;
  return 1;
}

/**
 * Select best binaural tone track based on state and HRV offset
 */
function selectBinauralTone(state, hrv) {
  const base = BRAINWAVE_STATES.find(s => s.state === state)?.binauralHz || 6;
  const offset = hrvBinauralOffset(hrv);
  return Math.max(0.5, base + offset);
}

module.exports = { analyzeBiometrics, hrvBinauralOffset, selectBinauralTone, BRAINWAVE_STATES };
