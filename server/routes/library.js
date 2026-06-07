/**
 * Anahata - Music Library API Routes
 *
 * GET  /api/library              - All tracks (with filter/sort/search/pagination)
 * GET  /api/library/categories   - All categories with counts
 * GET  /api/library/recommend    - Recommend tracks by current biometrics
 * GET  /api/library/favourites   - User favourites
 * GET  /api/library/plays        - User play history
 * GET  /api/library/:id          - Single track by ID
 */

const express = require('express');
const router = express.Router();
const { TRACKS, CATEGORIES } = require('../data/tracks');
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');

// GET /api/library
// Query params: category, brainwave, instrument, search, sort, page, limit
router.get('/', (req, res) => {
  let results = [...TRACKS];

  const { category, brainwave, instrument, search, sort = 'title', page = 1, limit = 20 } = req.query;

  if (category) results = results.filter(t => t.category === category);
  if (brainwave) results = results.filter(t => t.brainwave === brainwave);
  if (instrument) results = results.filter(t => t.instruments.includes(instrument.toLowerCase()));

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    );
  }

  if (sort === 'duration') results.sort((a, b) => b.duration - a.duration);
  if (sort === 'bpm') results.sort((a, b) => (a.bpm || 0) - (b.bpm || 0));
  if (sort === 'binaural') results.sort((a, b) => (a.binauralHz || 0) - (b.binauralHz || 0));
  if (sort === 'title') results.sort((a, b) => a.title.localeCompare(b.title));

  const total = results.length;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const start = (pageNum - 1) * limitNum;
  const paginated = results.slice(start, start + limitNum);

  res.json({
    tracks: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      hasNext: start + limitNum < total,
      hasPrev: pageNum > 1,
    },
  });
});

// GET /api/library/categories
router.get('/categories', (req, res) => {
  const counts = {};
  Object.values(CATEGORIES).forEach(cat => { counts[cat] = 0; });
  TRACKS.forEach(t => { if (counts[t.category] !== undefined) counts[t.category]++; });
  const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
  res.json({ categories: list, total: TRACKS.length });
});

// GET /api/library/recommend?heartRate=85&brainwave=Theta
router.get('/recommend', (req, res) => {
  const { heartRate, brainwave } = req.query;
  let pool = [...TRACKS];

  if (brainwave) {
    const exact = pool.filter(t => t.brainwave === brainwave);
    pool = exact.length >= 3 ? exact : pool;
  }

  if (heartRate) {
    const hr = parseInt(heartRate);
    pool.sort((a, b) => hr > 80
      ? b.duration - a.duration
      : a.duration - b.duration
    );
  }

  const top = pool.slice(0, 20);
  const shuffled = top.sort(() => Math.random() - 0.5);

  res.json({ recommended: shuffled.slice(0, 6) });
});

// GET /api/library/favourites - list user's favourited tracks
router.get('/favourites', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.json({ favourites: [] });
    const result = await pb.collection('library_favourites').getList(1, 200, {
      filter: `user_id = "${req.user.userId}"`,
      sort: '-created',
    });
    res.json({ favourites: result.items });
  } catch (err) { next(err); }
});

// POST /api/library/favourites/:trackId - add a favourite
router.post('/favourites/:trackId', requireAuth, async (req, res, next) => {
  try {
    const { trackId } = req.params;
    if (!trackId) return res.status(400).json({ error: 'trackId is required.' });
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });

    const existing = await pb.collection('library_favourites').getList(1, 1, {
      filter: `user_id = "${req.user.userId}" && track_id = "${trackId}"`,
    });
    if (existing.items.length > 0) {
      return res.status(409).json({ error: 'Track already in favourites.' });
    }

    const fav = await pb.collection('library_favourites').create({
      user_id: req.user.userId,
      track_id: trackId,
    });
    res.status(201).json({ favourite: fav });
  } catch (err) { next(err); }
});

// DELETE /api/library/favourites/:trackId - remove a favourite
router.delete('/favourites/:trackId', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const existing = await pb.collection('library_favourites').getList(1, 1, {
      filter: `user_id = "${req.user.userId}" && track_id = "${req.params.trackId}"`,
    });
    if (!existing.items.length) {
      return res.status(404).json({ error: 'Favourite not found.' });
    }
    await pb.collection('library_favourites').delete(existing.items[0].id);
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/library/plays - list user's recent play history
router.get('/plays', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.json({ plays: [] });
    const result = await pb.collection('library_plays').getList(1, 100, {
      filter: `user_id = "${req.user.userId}"`,
      sort: '-created',
    });
    res.json({ plays: result.items });
  } catch (err) { next(err); }
});

// POST /api/library/plays - record a track play
router.post('/plays', requireAuth, async (req, res, next) => {
  try {
    const { track_id, duration_played } = req.body;
    if (!track_id) return res.status(400).json({ error: 'track_id is required.' });
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });

    const play = await pb.collection('library_plays').create({
      user_id: req.user.userId,
      track_id,
      duration_played: duration_played || 0,
    });
    res.status(201).json({ play });
  } catch (err) { next(err); }
});

// GET /api/library/:id  (must come after all named routes)
router.get('/:id', (req, res) => {
  const track = TRACKS.find(t => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found.' });
  res.json({ track });
});

module.exports = router;
