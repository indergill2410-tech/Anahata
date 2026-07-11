/**
 * Anahata — Profile Routes
 * GET /api/profile   → get current user's profile
 * PUT /api/profile   → update name / avatar_url
 */

const express = require('express');
const router  = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const pb = require('../services/pbClient');

router.use(requireAuth);

const PREFERENCE_KEYS = new Set(['binaural', 'reminders', 'haptics', 'autoSession']);

function cleanPreferences(value = {}) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => PREFERENCE_KEYS.has(key))
      .map(([key, val]) => [key, Boolean(val)])
  );
}

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    let user;
    try {
      user = await pb.collection('users').getOne(req.user.userId);
    } catch {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json({
      profile: {
        id:           user.id,
        email:        user.email,
        name:         user.name || '',
        avatar_url:   user.avatar_url || '',
        subscription: user.subscription || 'free',
        verified:     user.verified === true
      }
    });
  } catch (err) { next(err); }
});

// GET /api/profile/preferences
router.get('/preferences', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const result = await pb.collection('user_preferences').getList(1, 1, {
      filter: `user_id = "${req.user.userId}"`,
    });
    const record = result.items[0];
    res.json({ preferences: cleanPreferences(record?.settings || {}) });
  } catch (err) { next(err); }
});

// PUT /api/profile
router.put('/', requireVerified, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const { name, avatar_url } = req.body;
    const update = {};
    if (name !== undefined)       update.name       = String(name).trim().slice(0, 80);
    if (avatar_url !== undefined) update.avatar_url = String(avatar_url).slice(0, 500);

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'Nothing to update. Provide name or avatar_url.' });
    }

    const user = await pb.collection('users').update(req.user.userId, update);
    res.json({
      profile: {
        id:           user.id,
        email:        user.email,
        name:         user.name || '',
        avatar_url:   user.avatar_url || '',
        subscription: user.subscription || 'free',
        verified:     user.verified === true
      }
    });
  } catch (err) { next(err); }
});

// PUT /api/profile/preferences
router.put('/preferences', requireVerified, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const preferences = cleanPreferences(req.body?.preferences || req.body?.settings || req.body || {});
    if (!Object.keys(preferences).length) {
      return res.status(400).json({ error: 'Provide at least one supported preference.' });
    }

    const result = await pb.collection('user_preferences').getList(1, 1, {
      filter: `user_id = "${req.user.userId}"`,
    });
    const existing = result.items[0];
    const current = cleanPreferences(existing?.settings || {});
    const nextPreferences = { ...current, ...preferences };
    const payload = { user_id: req.user.userId, settings: nextPreferences };

    const record = existing
      ? await pb.collection('user_preferences').update(existing.id, payload)
      : await pb.collection('user_preferences').create(payload);

    res.json({ preferences: cleanPreferences(record.settings || nextPreferences) });
  } catch (err) { next(err); }
});

module.exports = router;
