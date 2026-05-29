const pb = require('./pbClient');

async function logSession(userId, rawMetrics, musicParams, audioResult) {
  try {
    if (!pb) return;
    await pb.collection('meditation_sessions').create({
      user_id:           userId,
      heart_rate:        rawMetrics.heartRate,
      hrv:               rawMetrics.hrv || null,
      spo2:              rawMetrics.spo2 || null,
      stress_level:      rawMetrics.stressLevel || null,
      target_heart_rate: musicParams.targetHeartRate,
      musical_tempo:     musicParams.musicalTempo,
      brainwave_state:   musicParams.desiredBrainwaveState,
      binaural_hz:       musicParams.binauralHz,
      audio_url:         audioResult.url || null,
      is_fallback:       audioResult.isFallback || false,
      prompt_used:       audioResult.prompt || null
    });
  } catch (err) {
    console.error('[Session Logger] Failed to log session:', err.message);
  }
}

module.exports = { logSession };
