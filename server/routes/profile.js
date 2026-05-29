/**
 * Anahata — Profile Routes
 * GET /api/profile   → get current user's profile
 * PUT /api/profile   → update name / avatar_url
 */

const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');

router.use(requireAuth);

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
        subscription: user.subscription || 'free'
      }
    });
  } catch (err) { next(err); }
});

// PUT /api/profile
router.put('/', async (req, res, next) => {
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
        subscription: user.subscription || 'free'
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
