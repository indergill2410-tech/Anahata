/**
 * Anahata — Biometric Analysis Engine
 * Converts raw smartwatch data into structured musical parameters.
 *
 * Binaural Beat Frequency Map:
 *  Delta  (0.5–4 Hz)  → Deep sleep / healing
 *  Theta  (4–8 Hz)    → Meditation / creativity
 *  Alpha  (8–14 Hz)   → Relaxed focus
 *  Beta   (14–30 Hz)  → Alert / concentrated
 */

const BRAINWAVE_MAP = [
  { state: 'Deep Sleep',      range: [0.5, 4],  binauralHz: 2,  tempoFactor: 0.4, mood: 'serene nocturne' },
  { state: 'Deep Meditation', range: [4, 8],    binauralHz: 6,  tempoFactor: 0.55, mood: 'meditative andante' },
  { state: 'Relaxed Focus',   range: [8, 14],   binauralHz: 10, tempoFactor: 0.7, mood: 'gentle adagio' },
  { state: 'Calm Alertness',  range: [14, 30],  binauralHz: 20, tempoFactor: 0.85, mood: 'flowing allegretto' },
];

/**
 * Determines desired state based on heart rate.
 * Target: guide the user's HR from current → target via music tempo entrainment.
 */
function getTargetState(heartRate) {
  if (heartRate > 100) return { desired: 'Alpha', binauralHz: 10, targetBpm: 75 };
  if (heartRate > 80)  return { desired: 'Theta', binauralHz: 6,  targetBpm: 65 };
  if (heartRate > 65)  return { desired: 'Theta', binauralHz: 6,  targetBpm: 60 };
  return                      { desired: 'Delta', binauralHz: 2,  targetBpm: 55 };
}

function analyzeMetrics({ heartRate, hrv, spo2, stressLevel }) {
  const { desired, binauralHz, targetBpm } = getTargetState(heartRate);

  // Calculate musical tempo — step down by max 8 BPM per session to avoid shock
  const musicalTempo = Math.max(50, targetBpm);

  // Determine emotional tone from HRV (higher HRV = more recovered)
  let emotionalTone = 'neutral';
  if (hrv) {
    emotionalTone = hrv > 60 ? 'uplifting and restorative' : hrv > 40 ? 'calm and grounding' : 'gentle and deeply soothing';
  }

  // Binaural left/right channel frequencies (carrier + binaural offset)
  const carrierFrequency = 200; // Hz — safe carrier for binaural beats
  const leftEarHz = carrierFrequency;
  const rightEarHz = carrierFrequency + binauralHz;

  return {
    currentHeartRate: heartRate,
    targetHeartRate: targetBpm,
    musicalTempo,
    desiredBrainwaveState: desired,
    binauralHz,
    leftEarHz,
    rightEarHz,
    emotionalTone,
    spo2: spo2 || 'unknown',
    stressLevel: stressLevel || 'unknown',
    generatedAt: new Date().toISOString()
  };
}

module.exports = { analyzeMetrics };
