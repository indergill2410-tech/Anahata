/**
 * Anahata — Meditation Routes
 * POST /api/meditation/analyze  → One-shot biometric analysis (non-WS fallback)
 */

const express = require('express');
const router  = express.Router();
const { generateMeditation } = require('../services/musicEngine');
const { optionalAuth }       = require('../middleware/auth');

// Optional auth — guests can use one-shot analysis
router.post('/analyze', optionalAuth, async (req, res, next) => {
  try {
    const { heartRate, hrv, spo2 } = req.body;

    if (!heartRate || typeof heartRate !== 'number' || heartRate < 30 || heartRate > 220) {
      return res.status(400).json({ error: 'A valid heartRate number (30–220 BPM) is required.' });
    }

    const result = await generateMeditation({ heartRate, hrv, spo2 });

    res.json({
      brainwaveState:   result.brainwaveState,
      binauralHz:       result.binauralHz,
      targetHeartRate:  result.targetHeartRate,
      musicalTempo:     result.musicalTempo,
      stressLevel:      result.stressLevel,
      audioUrl:         result.audioUrl,
      trackId:          result.trackId,
      trackTitle:       result.trackTitle,
      generatedAt:      result.generatedAt,
      isFallback:       false
    });
  } catch (err) { next(err); }
});

module.exports = router;
