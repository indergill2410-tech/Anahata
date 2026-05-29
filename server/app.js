/**
 * Anahata — Express App
 */

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const logger     = require('./utils/logger');
const { captureException, getSentry } = require('./utils/sentry');

const authRoutes       = require('./routes/auth');
const sessionRoutes    = require('./routes/session');
const meditationRoutes = require('./routes/meditation');
const libraryRoutes    = require('./routes/library');
const pb               = require('./services/pbClient');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Sentry request handler (must be first middleware) ──────────────────────
const Sentry = getSentry();
if (Sentry) app.use(Sentry.Handlers.requestHandler());

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      mediaSrc:    ["'self'", 'blob:', 'https:'],
      connectSrc:  ["'self'", 'wss:', 'https:'],
      imgSrc:      ["'self'", 'data:', 'blob:']
    }
  } : false
}));

// ── CORS ───────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = isProd
  ? (process.env.ALLOWED_ORIGINS || 'https://anahata.onrender.com').split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
}));

// ── HTTP request logging ───────────────────────────────────────────────────
if (!isProd) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: msg => logger.info(msg.trim(), { type: 'http' }) }
  }));
}

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Static client (production) ─────────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    setHeaders(res, filePath) {
      // HTML must never be cached — always fresh for SPA routing
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
}

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/sessions',   sessionRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/library',    libraryRoutes);

// ── Health check (deep) ────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const checks = { api: 'ok', db: 'unconfigured', uptime: process.uptime() };
  let status = 200;

  if (pb) {
    try {
      await pb.health.check();
      checks.db = 'ok';
    } catch (e) {
      checks.db = 'error';
      checks.db_error = e.message;
      status = 503;
    }
  }

  res.status(status).json({
    status:  status === 200 ? 'healthy' : 'degraded',
    app:     'Anahata',
    version: '1.0.0',
    ts:      new Date().toISOString(),
    checks
  });
});

// ── SPA fallback (production) ──────────────────────────────────────────────
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── Sentry error handler (must be before generic error handler) ───────────
if (Sentry) app.use(Sentry.Handlers.errorHandler());

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message    = isProd && statusCode === 500
    ? 'Internal server error'
    : err.message;

  logger.error('Unhandled error', {
    message:  err.message,
    url:      req.originalUrl,
    method:   req.method,
    status:   statusCode
  });

  captureException(err, { url: req.originalUrl, method: req.method });

  res.status(statusCode).json({ error: message });
});

module.exports = app;
