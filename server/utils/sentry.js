/**
 * sentry.js — Sentry error tracking initialisation
 *
 * Install: npm install @sentry/node
 * Set SENTRY_DSN in your .env / Render dashboard.
 *
 * If SENTRY_DSN is not set, Sentry is silently disabled.
 */

let Sentry = null;

function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('[Sentry] SENTRY_DSN not set — error tracking disabled.');
    return;
  }
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn:         process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release:     `anahata@${require('../../package.json').version}`,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
    console.log('[Sentry] ✅ Error tracking initialised.');
  } catch (e) {
    console.warn('[Sentry] Failed to initialise:', e.message);
    Sentry = null;
  }
}

function captureException(err, context = {}) {
  if (Sentry) {
    Sentry.withScope(scope => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      Sentry.captureException(err);
    });
  }
}

function getSentry() { return Sentry; }

module.exports = { initSentry, captureException, getSentry };
