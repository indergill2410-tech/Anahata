/**
 * Anahata — Session Routes
 * GET  /api/sessions       → List user's past sessions (most recent 50)
 * POST /api/sessions       → Save a completed session
 * GET  /api/sessions/:id   → Get single session
 * DELETE /api/sessions/:id → Delete a session
 */

const express  = require('express');
const router   = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../services/supabaseClient');

// All session routes require auth
router.use(requireAuth);

// GET /api/sessions
router.get('/', async (req, res, next) => {
  try {
    if (!supabase) return res.json({ sessions: [] });

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ sessions: data || [] });
  } catch (err) { next(err); }
});

// POST /api/sessions
router.post('/', async (req, res, next) => {
  try {
    const {
      heart_rate, hrv, spo2, stress_level,
      target_heart_rate, musical_tempo,
      brainwave_state, binaural_hz,
      audio_url, track_id, duration_seconds
    } = req.body;

    if (!heart_rate) return res.status(400).json({ error: 'heart_rate is required.' });
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id:          req.user.userId,
        heart_rate:       heart_rate,
        hrv:              hrv || null,
        spo2:             spo2 || null,
        stress_level:     stress_level || null,
        target_heart_rate: target_heart_rate || null,
        musical_tempo:    musical_tempo || null,
        brainwave_state:  brainwave_state || null,
        binaural_hz:      binaural_hz || null,
        audio_url:        audio_url || null,
        duration_seconds: duration_seconds || 0
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (err) { next(err); }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Session not found.' });
    res.json({ session: data });
  } catch (err) { next(err); }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { error } = await supabase
      .from('meditation_sessions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
