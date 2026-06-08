const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');
const { sanitizeBiometricSample, buildBiometricAdvice } = require('../services/biometricCoach');

router.use(requireAuth);

function userFilter(userId) {
  return `user_id = "${userId}"`;
}

function requireWatchConsent(sample) {
  if (sample.source !== 'watch') return;

  const consent = sample.metadata?.biometric_consent;
  const valid = consent
    && Number(consent.version) >= 1
    && consent.scope === 'heart-rate-and-battery'
    && typeof consent.grantedAt === 'string'
    && consent.grantedAt.length > 0;

  if (!valid) {
    const err = new Error('Biometric sharing consent is required before saving watch data.');
    err.status = 403;
    throw err;
  }
}

async function recentSamples(userId, limit = 24) {
  if (!pb) return [];
  const result = await pb.collection('biometric_samples').getList(1, limit, {
    filter: userFilter(userId),
    sort: '-created',
  });
  return result.items || [];
}

async function saveAdvice(userId, sample, advice) {
  if (!pb) return null;
  try {
    return await pb.collection('biometric_recommendations').create({
      user_id: userId,
      sample_id: sample?.id || '',
      heart_rate: advice.metrics.heartRate,
      zone: advice.metrics.zone.id,
      trend: advice.metrics.trend.direction,
      breathing_id: advice.breathing.id,
      breathing_label: advice.breathing.label,
      music_intention: advice.music.intention,
      brainwave_state: advice.music.brainwave,
      advice,
    });
  } catch {
    return null;
  }
}

router.get('/samples', async (req, res, next) => {
  try {
    if (!pb) return res.json({ samples: [] });
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const result = await pb.collection('biometric_samples').getList(1, limit, {
      filter: userFilter(req.user.userId),
      sort: '-created',
    });
    res.json({ samples: result.items, pagination: { total: result.totalItems, page: result.page, limit: result.perPage } });
  } catch (err) { next(err); }
});

router.post('/samples', async (req, res, next) => {
  try {
    const samplePayload = sanitizeBiometricSample(req.body, { user_id: req.user.userId });
    requireWatchConsent(samplePayload);
    let sample = samplePayload;
    let recent = [samplePayload];

    if (pb) {
      sample = await pb.collection('biometric_samples').create(samplePayload);
      recent = await recentSamples(req.user.userId, 24);
    }

    const advice = buildBiometricAdvice(sample, recent);
    const recommendation = await saveAdvice(req.user.userId, sample, advice);

    res.status(201).json({ sample, advice, recommendation, recentCount: recent.length });
  } catch (err) { next(err); }
});

router.post('/advice', async (req, res, next) => {
  try {
    const sample = sanitizeBiometricSample(req.body, { user_id: req.user.userId });
    requireWatchConsent(sample);
    const recent = await recentSamples(req.user.userId, 24);
    const advice = buildBiometricAdvice(sample, recent);
    res.json({ advice, recentCount: recent.length });
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    if (!pb) return res.json({ samples: [], latestSample: null, latestAdvice: null, advice: null });

    const samples = await recentSamples(req.user.userId, 24);
    let latestAdvice = null;
    try {
      const result = await pb.collection('biometric_recommendations').getList(1, 1, {
        filter: userFilter(req.user.userId),
        sort: '-created',
      });
      latestAdvice = result.items[0] || null;
    } catch {}

    const latestSample = samples[0] || null;
    const advice = latestSample ? buildBiometricAdvice(latestSample, samples) : null;
    res.json({ samples, latestSample, latestAdvice, advice });
  } catch (err) { next(err); }
});

module.exports = router;
