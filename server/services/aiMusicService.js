/**
 * Anahata — AI Music Generation Service
 * Builds dynamic prompt from biometric parameters and calls AI Music API.
 */

const axios = require('axios');

const API_KEY = process.env.AI_MUSIC_API_KEY;
const API_URL = process.env.AI_MUSIC_API_URL;

/**
 * Constructs a high-fidelity music generation prompt from biometric parameters.
 * Designed for Lyria RealTime, Loudly API, or Suno meta-prompt format.
 */
function buildMusicPrompt(params) {
  const {
    currentHeartRate, targetHeartRate, musicalTempo,
    desiredBrainwaveState, binauralHz, leftEarHz, rightEarHz,
    emotionalTone
  } = params;

  return `You are an AI composer specialising in therapeutic, biofeedback-responsive classical music for deep meditation and healing.

Generate a continuous, seamlessly looping instrumental piece with the following precise specifications:

[BIOMETRIC CONTEXT]
- Listener's Current Heart Rate: ${currentHeartRate} BPM
- Target Resting Heart Rate: ${targetHeartRate} BPM
- Emotional Tone Required: ${emotionalTone}

[MUSICAL PARAMETERS]
- Tempo: ${musicalTempo} BPM — use heart rate entrainment principles; the music tempo should gradually guide the listener toward the target heart rate
- Style: Classical orchestral, inspired by Mozart's Symphony No. 40, Piano Concerto No. 21, and Debussy's Clair de Lune
- Instrumentation: Soft string quartet (cello, viola, two violins), solo grand piano with sustain pedal, breathy flute, and subtle French horn undertones. No percussion. No electric instruments.
- Dynamics: Begin pianissimo, swell gently to mezzo-forte at the midpoint, return to piano. Use long, legato phrases.
- Structure: ABA form, 90–120 seconds total. Seamless looping enabled.

[BINAURAL BEATS — EMBEDDED]
- Embed hidden binaural beats beneath the musical mix at the following frequencies:
  - Left ear channel carrier: ${leftEarHz} Hz
  - Right ear channel carrier: ${rightEarHz} Hz
  - Beat frequency difference: ${binauralHz} Hz
  - Target brainwave state: ${desiredBrainwaveState} (${binauralHz}Hz induces ${desiredBrainwaveState} waves)
- The binaural tones must be subtle, not consciously audible, hidden within the resonance of the string instruments
- Slowly pan the spatial audio from left to right over 30-second intervals to enhance 8D immersive effect

[QUALITY DIRECTIVES]
- Output must be studio-quality, 44100 Hz sample rate, stereo
- Transitions between loops must be imperceptible
- The composition should feel like a warm, safe, timeless space — like floating in stillness
- Avoid jarring intervals, dissonance, or sudden dynamic shifts

Title suggestion: "${desiredBrainwaveState} — ${musicalTempo} BPM Healing Passage"`;
}

async function fetchAiMusic(params) {
  const prompt = buildMusicPrompt(params);

  try {
    const response = await axios.post(API_URL, {
      prompt,
      duration: 120,
      genre: 'classical',
      mood: 'meditative',
      tempo: params.musicalTempo,
      loop: true,
      quality: 'high'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return {
      url: response.data.audioUrl || response.data.url,
      duration: response.data.duration || 120,
      prompt // store for session logging
    };

  } catch (err) {
    console.error('[AI Music] Generation failed:', err.response?.data || err.message);
    // Return a fallback public domain Mozart track
    return {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Mozart_-_Piano_Concerto_No._21_in_C_major%2C_KV467_-_2._Andante.ogg',
      duration: 120,
      prompt,
      isFallback: true
    };
  }
}

module.exports = { fetchAiMusic, buildMusicPrompt };
