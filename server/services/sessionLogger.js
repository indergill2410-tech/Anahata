/**
 * Anahata — Session Logger
 * Persists each meditation session to Supabase for analytics and personalisation.
 */

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

async function logSession(userId, rawMetrics, musicParams, audioResult) {
  try {
    const db = getSupabase();
    const { error } = await db.from('meditation_sessions').insert({
      user_id: userId,
      heart_rate: rawMetrics.heartRate,
      hrv: rawMetrics.hrv || null,
      spo2: rawMetrics.spo2 || null,
      stress_level: rawMetrics.stressLevel || null,
      target_heart_rate: musicParams.targetHeartRate,
      musical_tempo: musicParams.musicalTempo,
      brainwave_state: musicParams.desiredBrainwaveState,
      binaural_hz: musicParams.binauralHz,
      audio_url: audioResult.url,
      is_fallback: audioResult.isFallback || false,
      prompt_used: audioResult.prompt,
      created_at: new Date().toISOString()
    });

    if (error) console.error('[Session Logger] Supabase insert error:', error.message);
  } catch (err) {
    console.error('[Session Logger] Failed to log session:', err.message);
  }
}

module.exports = { logSession };
