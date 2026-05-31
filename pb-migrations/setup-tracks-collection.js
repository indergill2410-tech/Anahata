/**
 * PocketBase migration — create `albums` and `tracks` collections for R2-backed audio.
 *
 * Run:  node pb-migrations/setup-tracks-collection.js
 *
 * Requires POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD in .env
 */

require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const pb    = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const pass  = process.env.POCKETBASE_ADMIN_PASSWORD;

async function run() {
  await pb.admins.authWithPassword(email, pass);
  console.log('✓ Authenticated as PocketBase admin');

  // ── albums collection ──────────────────────────────────────────────────
  await ensureCollection('albums', [
    { name: 'title',       type: 'text',   required: true  },
    { name: 'subtitle',    type: 'text',   required: false },
    { name: 'genre',       type: 'text',   required: false },
    { name: 'description', type: 'text',   required: false },
    { name: 'color',       type: 'text',   required: false }, // hex e.g. #D97706
    { name: 'accent',      type: 'text',   required: false },
    { name: 'cover_url',   type: 'url',    required: false }, // optional cover art from R2
    { name: 'track_count', type: 'number', required: false },
  ]);

  // ── tracks collection ──────────────────────────────────────────────────
  await ensureCollection('tracks', [
    { name: 'album_id',  type: 'text',   required: true  }, // album relation (text id)
    { name: 'title',     type: 'text',   required: true  },
    { name: 'artist',    type: 'text',   required: false },
    { name: 'duration',  type: 'text',   required: false }, // e.g. "38 min"
    { name: 'genre',     type: 'text',   required: false },
    { name: 'tags',      type: 'json',   required: false }, // string[]
    { name: 'r2_key',    type: 'text',   required: false }, // e.g. raga-prahar/rp-01.mp3
    { name: 'audio_url', type: 'url',    required: false }, // full public R2 URL
    { name: 'order',     type: 'number', required: false }, // sort order within album
  ]);

  // ── library_favourites (user bookmarks) ───────────────────────────────
  await ensureCollection('library_favourites', [
    { name: 'user_id',  type: 'text', required: true },
    { name: 'track_id', type: 'text', required: true },
  ]);

  console.log('\n✓ All collections ready.');
}

async function ensureCollection(name, fields) {
  try {
    const existing = await pb.collections.getOne(name);
    console.log(`  ~ ${name} already exists (id: ${existing.id})`);
    return existing;
  } catch {
    // Not found — create it
  }

  const schema = fields.map((f, i) => ({
    id:       `field_${name}_${i}`,
    name:     f.name,
    type:     f.type,
    required: f.required ?? false,
    options:  {},
  }));

  const col = await pb.collections.create({ name, type: 'base', schema });
  console.log(`  + created collection: ${name} (id: ${col.id})`);
  return col;
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
