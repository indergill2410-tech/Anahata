#!/usr/bin/env node
/**
 * PocketBase Collection Setup
 *
 * Run this ONCE after your PocketBase instance is live to create the
 * required collections (meditation_sessions, library_favourites, library_plays).
 * The built-in `users` collection is extended automatically by PocketBase.
 *
 * Usage:
 *   POCKETBASE_URL=http://localhost:8090 \
 *   POCKETBASE_ADMIN_EMAIL=admin@example.com \
 *   POCKETBASE_ADMIN_PASSWORD=yourpassword \
 *   node pb-migrations/setup-collections.js
 */

require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const PB_URL    = process.env.POCKETBASE_URL          || 'http://localhost:8090';
const PB_EMAIL  = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_PASS   = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_EMAIL || !PB_PASS) {
  console.error('❌  POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set.');
  process.exit(1);
}

async function run() {
  const pb = new PocketBase(PB_URL);

  console.log(`Connecting to PocketBase at ${PB_URL} ...`);
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASS);
  console.log('✅  Authenticated as admin.');

  // ── Extend the built-in users collection with extra fields ──────────────
  console.log('\nUpdating users collection ...');
  const usersCol = await pb.collections.getOne('users');
  const existingFieldNames = usersCol.schema.map(f => f.name);

  const userExtraFields = [
    { name: 'name',         type: 'text',   required: false, options: { max: 80 } },
    { name: 'subscription', type: 'select', required: false, options: { maxSelect: 1, values: ['free', 'premium'] } },
    { name: 'avatar_url',   type: 'url',    required: false }
  ].filter(f => !existingFieldNames.includes(f.name));

  if (userExtraFields.length > 0) {
    await pb.collections.update('users', {
      schema: [...usersCol.schema, ...userExtraFields]
    });
    console.log('  Added fields to users:', userExtraFields.map(f => f.name).join(', '));
  } else {
    console.log('  users collection already up to date.');
  }

  // ── Helper: create collection only if it doesn't exist ──────────────────
  async function ensureCollection(def) {
    try {
      await pb.collections.getOne(def.name);
      console.log(`  ℹ️  Collection "${def.name}" already exists — skipping.`);
    } catch {
      await pb.collections.create(def);
      console.log(`  ✅  Created collection "${def.name}".`);
    }
  }

  // ── meditation_sessions ─────────────────────────────────────────────────
  console.log('\nSetting up meditation_sessions ...');
  await ensureCollection({
    name: 'meditation_sessions',
    type: 'base',
    schema: [
      { name: 'user_id',           type: 'relation', required: true,  options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'heart_rate',        type: 'number',   required: true  },
      { name: 'hrv',               type: 'number',   required: false },
      { name: 'spo2',              type: 'number',   required: false },
      { name: 'stress_level',      type: 'text',     required: false },
      { name: 'target_heart_rate', type: 'number',   required: false },
      { name: 'musical_tempo',     type: 'number',   required: false },
      { name: 'brainwave_state',   type: 'text',     required: false },
      { name: 'binaural_hz',       type: 'number',   required: false },
      { name: 'audio_url',         type: 'url',      required: false },
      { name: 'is_fallback',       type: 'bool',     required: false },
      { name: 'prompt_used',       type: 'text',     required: false },
      { name: 'duration_seconds',  type: 'number',   required: false }
    ],
    listRule:   '@request.auth.id = user_id',
    viewRule:   '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id'
  });

  // ── library_favourites ──────────────────────────────────────────────────
  console.log('\nSetting up library_favourites ...');
  await ensureCollection({
    name: 'library_favourites',
    type: 'base',
    schema: [
      { name: 'user_id',  type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true, maxSelect: 1 } },
      { name: 'track_id', type: 'text',     required: true }
    ],
    listRule:   '@request.auth.id = user_id',
    viewRule:   '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id'
  });

  // ── library_plays ───────────────────────────────────────────────────────
  console.log('\nSetting up library_plays ...');
  await ensureCollection({
    name: 'library_plays',
    type: 'base',
    schema: [
      { name: 'user_id',        type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: true, maxSelect: 1 } },
      { name: 'track_id',       type: 'text',     required: true },
      { name: 'duration_played', type: 'number',  required: false }
    ],
    listRule:   '@request.auth.id = user_id',
    viewRule:   '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id'
  });

  console.log('\n✅  All collections ready. PocketBase is configured for Anahata.\n');
  console.log('Next steps:');
  console.log('  1. Set POCKETBASE_URL in your .env (or Render dashboard)');
  console.log('  2. Start the server: npm run dev');
  console.log('  3. Visit http://localhost:8090/_/ to manage data via the PocketBase UI\n');
}

run().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
