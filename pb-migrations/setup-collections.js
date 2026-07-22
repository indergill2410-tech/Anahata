#!/usr/bin/env node
/**
 * PocketBase Collection Setup
 *
 * Run this once after your PocketBase instance is live to create the
 * required collections for Anahata.
 *
 * Usage:
 *   POCKETBASE_URL=http://localhost:8090 \
 *   POCKETBASE_ADMIN_EMAIL=admin@example.com \
 *   POCKETBASE_ADMIN_PASSWORD=yourpassword \
 *   node pb-migrations/setup-collections.js
 */

require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_EMAIL || !PB_PASS) {
  console.error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set.');
  process.exit(1);
}

const USER_RELATION = { collectionId: '_pb_users_auth_', cascadeDelete: true, maxSelect: 1 };
const USER_RELATION_KEEP_SESSIONS = { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 };

/**
 * Configure PocketBase mail (SMTP) settings so verification / password-reset
 * emails are actually delivered.
 *
 * Without this, PocketBase falls back to a local `sendmail` binary that does
 * not exist in the deployment container, so `requestVerification()` succeeds on
 * the API but the email is never sent — the exact "no verification email on
 * signup" symptom.
 *
 * Driven by env vars so no secrets live in the repo. If SMTP_HOST is unset the
 * step is skipped with a clear warning (useful for pure local dev).
 */
async function configureMail(pb) {
  console.log('\nConfiguring mail (SMTP) settings ...');

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn(
      '  SMTP_HOST not set — skipping mail configuration.\n' +
      '  Verification/password-reset emails will NOT be delivered until you set\n' +
      '  SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD (and optionally\n' +
      '  SMTP_SENDER_ADDRESS / SMTP_SENDER_NAME / APP_URL) and re-run this script.'
    );
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const username = process.env.SMTP_USERNAME || '';
  const password = process.env.SMTP_PASSWORD || '';
  // Port 465 uses implicit TLS; 587/25 use STARTTLS (tls=false lets PocketBase
  // upgrade the connection). Override with SMTP_TLS=true/false if needed.
  const tls = process.env.SMTP_TLS != null
    ? /^true$/i.test(process.env.SMTP_TLS)
    : port === 465;

  const senderAddress =
    process.env.SMTP_SENDER_ADDRESS || username || 'no-reply@anahata.app';
  const senderName = process.env.SMTP_SENDER_NAME || 'Anahata';
  const appUrl =
    process.env.APP_URL || process.env.PUBLIC_APP_URL || PB_URL;

  await pb.settings.update({
    meta: {
      appName: 'Anahata',
      appUrl,
      senderName,
      senderAddress,
    },
    smtp: {
      enabled: true,
      host,
      port,
      username,
      password,
      tls,
      authMethod: process.env.SMTP_AUTH_METHOD || '',
      localName: process.env.SMTP_LOCAL_NAME || '',
    },
  });

  console.log(
    `  SMTP enabled: ${host}:${port} (tls=${tls}), sender "${senderName} <${senderAddress}>".`
  );

  // Best-effort delivery check so misconfiguration surfaces now, not at signup.
  try {
    await pb.settings.testEmail(senderAddress, 'verification');
    console.log(`  Sent a test verification email to ${senderAddress}.`);
  } catch (err) {
    console.warn(
      '  WARNING: SMTP settings saved but the test email failed. ' +
      'Double-check host/port/credentials. Cause:',
      err?.message || err
    );
  }
}

async function run() {
  const pb = new PocketBase(PB_URL);

  console.log(`Connecting to PocketBase at ${PB_URL} ...`);
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASS);
  console.log('Authenticated as admin.');

  await configureMail(pb);

  console.log('\nUpdating users collection ...');
  const usersCol = await pb.collections.getOne('users');
  const existingFieldNames = usersCol.schema.map(f => f.name);

  const userExtraFields = [
    { name: 'name', type: 'text', required: false, options: { max: 80 } },
    { name: 'subscription', type: 'select', required: false, options: { maxSelect: 1, values: ['free', 'premium'] } },
    { name: 'avatar_url', type: 'url', required: false },
  ].filter(f => !existingFieldNames.includes(f.name));

  if (userExtraFields.length > 0) {
    await pb.collections.update('users', {
      ...usersCol,
      schema: [...usersCol.schema, ...userExtraFields],
    });
    console.log('  Added fields to users:', userExtraFields.map(f => f.name).join(', '));
  } else {
    console.log('  users collection already up to date.');
  }

  async function ensureCollection(def) {
    try {
      await pb.collections.getOne(def.name);
      console.log(`  Collection "${def.name}" already exists - skipping.`);
    } catch {
      await pb.collections.create(def);
      console.log(`  Created collection "${def.name}".`);
    }
  }

  console.log('\nSetting up meditation_sessions ...');
  await ensureCollection({
    name: 'meditation_sessions',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION_KEEP_SESSIONS },
      { name: 'heart_rate', type: 'number', required: true },
      { name: 'hrv', type: 'number', required: false },
      { name: 'spo2', type: 'number', required: false },
      { name: 'stress_level', type: 'text', required: false },
      { name: 'target_heart_rate', type: 'number', required: false },
      { name: 'musical_tempo', type: 'number', required: false },
      { name: 'brainwave_state', type: 'text', required: false },
      { name: 'binaural_hz', type: 'number', required: false },
      { name: 'audio_url', type: 'url', required: false },
      { name: 'is_fallback', type: 'bool', required: false },
      { name: 'prompt_used', type: 'text', required: false },
      { name: 'duration_seconds', type: 'number', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up library_favourites ...');
  await ensureCollection({
    name: 'library_favourites',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'track_id', type: 'text', required: true },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up library_plays ...');
  await ensureCollection({
    name: 'library_plays',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'track_id', type: 'text', required: true },
      { name: 'duration_played', type: 'number', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up user_mixes ...');
  await ensureCollection({
    name: 'user_mixes',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'name', type: 'text', required: true, options: { max: 80 } },
      { name: 'settings', type: 'text', required: false, options: { max: 20000 } },
      { name: 'volumes', type: 'text', required: false, options: { max: 20000 } },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: '@request.auth.id = user_id',
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up journal_entries ...');
  await ensureCollection({
    name: 'journal_entries',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'entry_type', type: 'select', required: true, options: { maxSelect: 1, values: ['checkin', 'daily', 'dream', 'note', 'plan'] } },
      { name: 'entry_date', type: 'text', required: true, options: { max: 10 } },
      { name: 'mood', type: 'number', required: false },
      { name: 'lucidity', type: 'number', required: false },
      { name: 'title', type: 'text', required: false, options: { max: 160 } },
      { name: 'text', type: 'text', required: false, options: { max: 20000 } },
      { name: 'follow_up', type: 'text', required: false, options: { max: 20000 } },
      { name: 'prompt', type: 'text', required: false, options: { max: 2000 } },
      { name: 'cta', type: 'text', required: false, options: { max: 120 } },
      { name: 'tags', type: 'json', required: false },
      { name: 'metadata', type: 'json', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: '@request.auth.id = user_id',
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up user_preferences ...');
  await ensureCollection({
    name: 'user_preferences',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'settings', type: 'json', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: '@request.auth.id = user_id',
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up biometric_samples ...');
  await ensureCollection({
    name: 'biometric_samples',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'source', type: 'select', required: true, options: { maxSelect: 1, values: ['watch', 'demo', 'websocket', 'manual'] } },
      { name: 'device_name', type: 'text', required: false, options: { max: 120 } },
      { name: 'heart_rate', type: 'number', required: true },
      { name: 'hrv', type: 'number', required: false },
      { name: 'spo2', type: 'number', required: false },
      { name: 'stress_level', type: 'text', required: false, options: { max: 40 } },
      { name: 'battery', type: 'number', required: false },
      { name: 'captured_at', type: 'text', required: true, options: { max: 40 } },
      { name: 'metadata', type: 'json', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nSetting up biometric_recommendations ...');
  await ensureCollection({
    name: 'biometric_recommendations',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'relation', required: true, options: USER_RELATION },
      { name: 'sample_id', type: 'text', required: false, options: { max: 80 } },
      { name: 'heart_rate', type: 'number', required: true },
      { name: 'zone', type: 'text', required: true, options: { max: 40 } },
      { name: 'trend', type: 'text', required: false, options: { max: 40 } },
      { name: 'breathing_id', type: 'text', required: false, options: { max: 80 } },
      { name: 'breathing_label', type: 'text', required: false, options: { max: 120 } },
      { name: 'music_intention', type: 'text', required: false, options: { max: 40 } },
      { name: 'brainwave_state', type: 'text', required: false, options: { max: 40 } },
      { name: 'advice', type: 'json', required: false },
    ],
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: null,
    deleteRule: '@request.auth.id = user_id',
  });

  console.log('\nAll collections ready. PocketBase is configured for Anahata.');
  console.log('Next steps:');
  console.log('  1. Set POCKETBASE_URL in your .env or host dashboard.');
  console.log('  2. Start PocketBase, then run npm run dev.');
  console.log('  3. Visit http://localhost:8090/_/ to manage data in PocketBase.\n');
}

run().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
