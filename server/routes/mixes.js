const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');

// GET /api/mixes — list user's saved mixes
router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.json({ mixes: [] });
    const result = await pb.collection('user_mixes').getList(1, 50, {
      filter: `user_id = "${req.user.userId}"`,
      sort: '-created',
    });
    res.json({ mixes: result.items });
  } catch (err) { next(err); }
});

// POST /api/mixes — save a mix
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, settings, volumes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const mix = await pb.collection('user_mixes').create({
      user_id:  req.user.userId,
      name:     name.trim().slice(0, 80),
      settings: JSON.stringify(settings || {}),
      volumes:  JSON.stringify(volumes  || {}),
    });
    res.status(201).json({ mix });
  } catch (err) { next(err); }
});

// DELETE /api/mixes/:id — delete a saved mix
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    let mix;
    try { mix = await pb.collection('user_mixes').getOne(req.params.id); }
    catch { return res.status(404).json({ error: 'Mix not found.' }); }
    if (mix.user_id !== req.user.userId) return res.status(404).json({ error: 'Mix not found.' });
    await pb.collection('user_mixes').delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
