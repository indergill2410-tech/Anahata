/**
 * Anahata — Meditation Routes
 * POST /api/meditation/analyze  → Manual biometric analysis (non-WS)
 */

const express = require('express');
const router = express.Router();
const { analyzeMetrics } = require('../services/biometricAnalyzer');
const { fetchAiMusic } = require('../services/aiMusicService');
const { authenticate } = require('../middleware/authenticate');

// Optional auth — guests can use one-shot analysis
router.post('/analyze', async (req, res, next) => {
  try {
    const { heartRate, hrv, spo2, stressLevel } = req.body;
    if (!heartRate || heartRate < 30 || heartRate > 220) {
      return res.status(400).json({ error: 'A valid heart rate (30–220 BPM) is required.' });
    }

    const musicParams = analyzeMetrics({ heartRate, hrv, spo2, stressLevel });
    const audioResult = await fetchAiMusic(musicParams);

    res.json({
      musicParams,
      audioUrl: audioResult.url,
      duration: audioResult.duration,
      isFallback: audioResult.isFallback || false
    });
  } catch (err) { next(err); }
});

module.exports = router;
