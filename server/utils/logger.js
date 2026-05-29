/**
 * logger.js — structured JSON logging for production
 * Uses pino-style log levels with timestamps.
 * Falls back to readable format in development.
 */

const isDev = process.env.NODE_ENV !== 'production';

const LEVELS = { error: 50, warn: 40, info: 30, debug: 20 };

function log(level, message, meta = {}) {
  const entry = {
    ts:      new Date().toISOString(),
    level,
    msg:     message,
    env:     process.env.NODE_ENV || 'development',
    ...meta
  };

  const output = isDev
    ? `[${entry.ts}] ${level.toUpperCase().padEnd(5)} ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
    : JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = logger;
