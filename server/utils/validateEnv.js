/**
 * validateEnv — fail fast on missing required environment variables
 * Call this at the very top of server/index.js before anything else.
 */

const REQUIRED = [
  'JWT_SECRET',
  'POCKETBASE_URL',
];

const RECOMMENDED = [
  'SENTRY_DSN',
];

function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);

  if (missing.length > 0) {
    console.error('\n[Anahata] ❌ FATAL: Missing required environment variables:');
    missing.forEach(k => console.error(`  • ${k}`));
    console.error('\n  Copy .env.example to .env and fill in the values.');
    console.error('  Docs: https://github.com/indergill2410-tech/Anahata#environment-variables\n');
    process.exit(1);
  }

  const missingRecommended = RECOMMENDED.filter(k => !process.env[k]);
  if (missingRecommended.length > 0) {
    console.warn('[Anahata] ⚠️  Recommended env vars not set (some features may be limited):');
    missingRecommended.forEach(k => console.warn(`  • ${k}`));
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET?.includes('change-me')
  ) {
    console.error('[Anahata] ❌ FATAL: JWT_SECRET is still the default dev value. Set a real secret.');
    process.exit(1);
  }

  console.log('[Anahata] ✅ Environment validated.');
}

module.exports = { validateEnv };
