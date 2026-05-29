/**
 * Anahata — Session Routes
 * GET    /api/sessions       → List user's past sessions (most recent 50)
 * POST   /api/sessions       → Save a completed session
 * GET    /api/sessions/:id   → Get single session
 * DELETE /api/sessions/:id   → Delete a session
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');

router.use(requireAuth);

// GET /api/sessions
router.get('/', async (req, res, next) => {
  try {
    if (!pb) return res.json({ sessions: [] });
    const result = await pb.collection('meditation_sessions').getList(1, 50, {
      filter: `user_id = "${req.user.userId}"`,
      sort: '-created'
    });
    res.json({ sessions: result.items });
  } catch (err) { next(err); }
});

// POST /api/sessions
router.post('/', async (req, res, next) => {
  try {
    const {
      heart_rate, hrv, spo2, stress_level,
      target_heart_rate, musical_tempo,
      brainwave_state, binaural_hz,
      audio_url, duration_seconds
    } = req.body;

    if (!heart_rate) return res.status(400).json({ error: 'heart_rate is required.' });
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });

    const session = await pb.collection('meditation_sessions').create({
      user_id:           req.user.userId,
      heart_rate,
      hrv:               hrv || null,
      spo2:              spo2 || null,
      stress_level:      stress_level || null,
      target_heart_rate: target_heart_rate || null,
      musical_tempo:     musical_tempo || null,
      brainwave_state:   brainwave_state || null,
      binaural_hz:       binaural_hz || null,
      audio_url:         audio_url || null,
      duration_seconds:  duration_seconds || 0
    });

    res.status(201).json({ session });
  } catch (err) { next(err); }
});

// GET /api/sessions/stats
router.get('/stats', async (req, res, next) => {
  try {
    if (!pb) return res.json({ stats: {} });
    const result = await pb.collection('meditation_sessions').getList(1, 500, {
      filter: `user_id = "${req.user.userId}"`,
      sort: '-created'
    });
    const sessions = result.items;
    if (!sessions.length) return res.json({ stats: { total: 0 } });

    const total = sessions.length;
    const avgHeartRate = Math.round(sessions.reduce((s, x) => s + (x.heart_rate || 0), 0) / total);
    const totalDuration = sessions.reduce((s, x) => s + (x.duration_seconds || 0), 0);
    const stateCounts = {};
    sessions.forEach(s => {
      if (s.brainwave_state) stateCounts[s.brainwave_state] = (stateCounts[s.brainwave_state] || 0) + 1;
    });
    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({ stats: { total, avgHeartRate, totalDuration, topBrainwaveState: topState, stateCounts } });
  } catch (err) { next(err); }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    let session;
    try {
      session = await pb.collection('meditation_sessions').getOne(req.params.id);
    } catch {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    res.json({ session });
  } catch (err) { next(err); }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    let session;
    try {
      session = await pb.collection('meditation_sessions').getOne(req.params.id);
    } catch {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    await pb.collection('meditation_sessions').delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
