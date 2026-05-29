/**
 * Anahata — Music Library API Routes
 *
 * GET  /api/library              — All tracks (with filter/sort/search/pagination)
 * GET  /api/library/categories   — All categories with counts
 * GET  /api/library/:id          — Single track by ID
 * GET  /api/library/recommend    — Recommend tracks by current biometrics
 */

const express = require('express');
const router = express.Router();
const { TRACKS, CATEGORIES } = require('../data/tracks');

// GET /api/library
// Query params: category, brainwave, instrument, search, sort, page, limit
router.get('/', (req, res) => {
  let results = [...TRACKS];

  const { category, brainwave, instrument, search, sort = 'title', page = 1, limit = 20 } = req.query;

  if (category)   results = results.filter(t => t.category === category);
  if (brainwave)  results = results.filter(t => t.brainwave === brainwave);
  if (instrument) results = results.filter(t => t.instruments.includes(instrument.toLowerCase()));

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    );
  }

  // Sorting
  if (sort === 'duration')  results.sort((a, b) => b.duration - a.duration);
  if (sort === 'bpm')       results.sort((a, b) => (a.bpm || 0) - (b.bpm || 0));
  if (sort === 'binaural')  results.sort((a, b) => (a.binauralHz || 0) - (b.binauralHz || 0));
  if (sort === 'title')     results.sort((a, b) => a.title.localeCompare(b.title));

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
      hasPrev: pageNum > 1
    }
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
    // Primary: exact match; fallback: adjacent state
    const exact = pool.filter(t => t.brainwave === brainwave);
    pool = exact.length >= 3 ? exact : pool;
  }

  if (heartRate) {
    const hr = parseInt(heartRate);
    // Prefer longer, slower tracks for high HR; shorter for low HR
    pool.sort((a, b) => hr > 80
      ? b.duration - a.duration   // high HR → favour longer calming tracks
      : a.duration - b.duration
    );
  }

  // Shuffle top candidates for variety
  const top = pool.slice(0, 20);
  const shuffled = top.sort(() => Math.random() - 0.5);

  res.json({ recommended: shuffled.slice(0, 6) });
});

// GET /api/library/:id  (must come after named routes)
router.get('/:id', (req, res) => {
  const track = TRACKS.find(t => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found.' });
  res.json({ track });
});

module.exports = router;
