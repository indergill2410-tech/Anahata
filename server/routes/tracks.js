/**
 * Anahata — Tracks API (Cloudflare R2 + PocketBase)
 *
 * POST /api/tracks/upload-url        — get presigned URL for direct browser upload
 * POST /api/tracks/confirm-upload    — save track metadata to PocketBase after upload
 * POST /api/tracks/upload            — server-side upload (multipart, for scripts)
 * GET  /api/tracks                   — list all tracks (from PocketBase)
 * GET  /api/tracks/:id               — single track
 * PUT  /api/tracks/:id               — update track metadata
 * DELETE /api/tracks/:id             — delete track + R2 object
 */

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const router   = express.Router();
const pb       = require('../services/pbClient');
const r2       = require('../services/r2Client');
const { requireAuth } = require('../middleware/auth');

// multer: memory storage (files stay in RAM, then we stream to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max per track
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.m4a', '.ogg', '.flac', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
  },
});

const CONTENT_TYPES = {
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.ogg':  'audio/ogg',
  '.flac': 'audio/flac',
  '.wav':  'audio/wav',
};

// ── Presigned upload URL (browser uploads directly to R2) ─────────────────

// POST /api/tracks/upload-url
// Body: { albumId, trackId, filename, contentType }
router.post('/upload-url', requireAuth, async (req, res, next) => {
  try {
    const { albumId, trackId, filename, contentType = 'audio/mpeg' } = req.body;
    if (!albumId || !trackId || !filename) {
      return res.status(400).json({ error: 'albumId, trackId, filename required.' });
    }
    const ext  = path.extname(filename).toLowerCase() || '.mp3';
    const key  = `${albumId}/${trackId}${ext}`;
    const url  = await r2.getUploadPresignedUrl(key, contentType);
    const publicUrl = r2.getPublicUrl(key);
    res.json({ uploadUrl: url, key, publicUrl });
  } catch (err) { next(err); }
});

// POST /api/tracks/confirm-upload
// Body: track metadata + key (after browser finished the presigned PUT)
router.post('/confirm-upload', requireAuth, async (req, res, next) => {
  try {
    const { key, albumId, trackId, title, artist, duration, genre, tags } = req.body;
    if (!key || !albumId || !trackId || !title) {
      return res.status(400).json({ error: 'key, albumId, trackId, title required.' });
    }
    const exists = await r2.objectExists(key);
    if (!exists) return res.status(400).json({ error: `Object not found in R2: ${key}` });

    const audioUrl = r2.getPublicUrl(key);
    if (!pb) return res.json({ track: { id: trackId, audioUrl } }); // no-op if no db

    const record = await pb.collection('tracks').create({
      id: trackId,
      album_id:  albumId,
      title,
      artist:    artist || '',
      duration:  duration || '',
      genre:     genre || '',
      tags:      Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      r2_key:    key,
      audio_url: audioUrl,
    });
    res.status(201).json({ track: record });
  } catch (err) { next(err); }
});

// POST /api/tracks/upload  (server-side multipart — for scripts/admin use)
// Body: multipart form with file + metadata fields
router.post('/upload', requireAuth, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided.' });
    const { albumId, trackId, title, artist, duration, genre, tags } = req.body;
    if (!albumId || !trackId || !title) {
      return res.status(400).json({ error: 'albumId, trackId, title required.' });
    }

    const ext         = path.extname(req.file.originalname).toLowerCase() || '.mp3';
    const contentType = CONTENT_TYPES[ext] || 'audio/mpeg';
    const key         = `${albumId}/${trackId}${ext}`;

    const audioUrl = await r2.uploadAudio({
      key,
      body:        req.file.buffer,
      contentType,
      metadata:    { title, artist: artist || '', albumId },
    });

    if (!pb) return res.status(201).json({ track: { id: trackId, audioUrl } });

    const record = await pb.collection('tracks').create({
      id: trackId,
      album_id:  albumId,
      title,
      artist:    artist || '',
      duration:  duration || '',
      genre:     genre || '',
      tags:      Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      r2_key:    key,
      audio_url: audioUrl,
    });
    res.status(201).json({ track: record });
  } catch (err) { next(err); }
});

// GET /api/tracks
router.get('/', async (req, res, next) => {
  try {
    if (!pb) return res.json({ tracks: [] });
    const { albumId, genre, search, page = 1, limit = 50 } = req.query;
    const filters = [];
    if (albumId) filters.push(`album_id = "${albumId}"`);
    if (genre)   filters.push(`genre = "${genre}"`);
    if (search)  filters.push(`title ~ "${search}" || artist ~ "${search}"`);

    const result = await pb.collection('tracks').getList(parseInt(page), parseInt(limit), {
      filter: filters.join(' && ') || undefined,
      sort:   'album_id,title',
    });
    res.json({ tracks: result.items, total: result.totalItems });
  } catch (err) { next(err); }
});

// GET /api/tracks/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const track = await pb.collection('tracks').getOne(req.params.id);
    res.json({ track });
  } catch (err) { next(err); }
});

// PUT /api/tracks/:id  — update metadata only
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const { title, artist, duration, genre, tags } = req.body;
    const updated = await pb.collection('tracks').update(req.params.id, {
      ...(title    && { title }),
      ...(artist   && { artist }),
      ...(duration && { duration }),
      ...(genre    && { genre }),
      ...(tags     && { tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()) }),
    });
    res.json({ track: updated });
  } catch (err) { next(err); }
});

// DELETE /api/tracks/:id  — remove from PocketBase + R2
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const track = await pb.collection('tracks').getOne(req.params.id);
    if (track.r2_key) {
      await r2.deleteAudio(track.r2_key).catch(e => console.warn('[R2] delete failed:', e.message));
    }
    await pb.collection('tracks').delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
