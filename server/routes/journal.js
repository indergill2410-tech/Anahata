/**
 * Anahata - Journal Routes
 *
 * Stores private journal data in PocketBase for authenticated users.
 * Guests can still use the client-side localStorage journal until they sign in.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pb = require('../services/pbClient');

const COLLECTION = 'journal_entries';
const ENTRY_TYPES = new Set(['checkin', 'daily', 'dream', 'note', 'plan']);

router.use(requireAuth);

function requireDb(res) {
  if (pb) return true;
  res.status(503).json({ error: 'Database not configured.' });
  return false;
}

function escapeFilter(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function eq(field, value) {
  return `${field} = "${escapeFilter(value)}"`;
}

function parseEntryType(value) {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'dreams') return 'dream';
  if (ENTRY_TYPES.has(type)) return type;
  return null;
}

function parseEntryDate(value) {
  const date = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return date;
}

function asOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value, max = 20000) {
  if (value === undefined || value === null) return '';
  return String(value).slice(0, max);
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, 40);
}

function asObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function normalizeEntry(body) {
  const entryType = parseEntryType(body.entry_type || body.type);
  const entryDate = parseEntryDate(body.entry_date || body.date);

  if (!entryType) return { error: 'entry_type must be one of checkin, daily, dream, note, or plan.' };
  if (!entryDate) return { error: 'entry_date must use YYYY-MM-DD format.' };

  return {
    entry_type: entryType,
    entry_date: entryDate,
    mood: asOptionalNumber(body.mood),
    lucidity: asOptionalNumber(body.lucidity),
    title: asString(body.title, 160),
    text: asString(body.text),
    follow_up: asString(body.follow_up || body.followUp),
    prompt: asString(body.prompt, 2000),
    cta: asString(body.cta, 120),
    tags: asStringArray(body.tags),
    metadata: asObject(body.metadata),
  };
}

async function assertOwnEntry(id, userId) {
  let entry;
  try {
    entry = await pb.collection(COLLECTION).getOne(id);
  } catch {
    return null;
  }
  return entry.user_id === userId ? entry : null;
}

async function listUserEntries(userId) {
  const entries = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await pb.collection(COLLECTION).getList(page, 100, {
      filter: eq('user_id', userId),
      sort: '-entry_date,-created',
    });
    entries.push(...(result.items || []));
    totalPages = result.totalPages || page;
    page += 1;
  } while (page <= totalPages);

  return entries;
}

// GET /api/journal?type=checkin&from=2026-01-01&to=2026-01-31&page=1&limit=50
router.get('/', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filters = [eq('user_id', req.user.userId)];

    const type = parseEntryType(req.query.type);
    if (type) filters.push(eq('entry_type', type));

    const from = parseEntryDate(req.query.from);
    if (from) filters.push(`entry_date >= "${escapeFilter(from)}"`);

    const to = parseEntryDate(req.query.to);
    if (to) filters.push(`entry_date <= "${escapeFilter(to)}"`);

    const result = await pb.collection(COLLECTION).getList(page, limit, {
      filter: filters.join(' && '),
      sort: '-entry_date,-created',
    });

    res.json({
      entries: result.items,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/journal - create a private entry. Multiple entries can share a day.
router.post('/', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;

    const normalized = normalizeEntry(req.body || {});
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    const payload = { ...normalized, user_id: req.user.userId };

    const entry = await pb.collection(COLLECTION).create(payload);

    res.status(201).json({ entry });
  } catch (err) { next(err); }
});

// POST /api/journal/import - migrate guest localStorage entries after sign in
router.post('/import', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;

    const entries = Array.isArray(req.body?.entries) ? req.body.entries.slice(0, 200) : [];
    if (!entries.length) return res.status(400).json({ error: 'entries must be a non-empty array.' });

    const imported = [];
    const skipped = [];

    for (const raw of entries) {
      const normalized = normalizeEntry(raw || {});
      if (normalized.error) {
        skipped.push({ entry: raw, error: normalized.error });
        continue;
      }

      const payload = { ...normalized, user_id: req.user.userId };
      const entry = await pb.collection(COLLECTION).create(payload);
      imported.push(entry);
    }

    res.status(201).json({ imported, skipped, count: imported.length });
  } catch (err) { next(err); }
});

// GET /api/journal/export - download a private copy of the authenticated user's journal
router.get('/export', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;

    const entries = await listUserEntries(req.user.userId);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      exported_at: new Date().toISOString(),
      count: entries.length,
      entries,
    });
  } catch (err) { next(err); }
});

// DELETE /api/journal - clear the authenticated user's journal entries
router.delete('/', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;

    const entries = await listUserEntries(req.user.userId);
    await Promise.all(entries.map(entry => pb.collection(COLLECTION).delete(entry.id)));
    res.json({ deleted: entries.length });
  } catch (err) { next(err); }
});

// GET /api/journal/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;
    const entry = await assertOwnEntry(req.params.id, req.user.userId);
    if (!entry) return res.status(404).json({ error: 'Journal entry not found.' });
    res.json({ entry });
  } catch (err) { next(err); }
});

// PUT /api/journal/:id
router.put('/:id', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;
    const existing = await assertOwnEntry(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Journal entry not found.' });

    const normalized = normalizeEntry({
      ...existing,
      ...req.body,
      entry_type: req.body?.entry_type || req.body?.type || existing.entry_type,
      entry_date: req.body?.entry_date || req.body?.date || existing.entry_date,
    });
    if (normalized.error) return res.status(400).json({ error: normalized.error });

    const entry = await pb.collection(COLLECTION).update(existing.id, {
      ...normalized,
      user_id: req.user.userId,
    });

    res.json({ entry });
  } catch (err) { next(err); }
});

// DELETE /api/journal/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!requireDb(res)) return;
    const existing = await assertOwnEntry(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Journal entry not found.' });
    await pb.collection(COLLECTION).delete(existing.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
