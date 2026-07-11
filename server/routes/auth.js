/**
 * Anahata — Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const pb        = require('../services/pbClient');
const { signToken }   = require('../utils/jwtHelper');
const { requireAuth } = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

function publicUser(record) {
  return {
    id: record.id || record.userId,
    email: record.email,
    name: record.name || '',
    verified: record.verified === true,
  };
}

function sessionFor(record) {
  const user = publicUser(record);
  return {
    token: signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    }),
    user,
  };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    let { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    email = String(email).trim().toLowerCase().slice(0, 254);
    name  = String(name).trim().slice(0, 80);
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });

    const user = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
      emailVisibility: true
    });

    try {
      await pb.collection('users').requestVerification(email);
    } catch {
      // SMTP may not be configured in local/dev environments. Registration should still succeed.
    }

    res.status(201).json(sessionFor(user));
  } catch (err) {
    // PocketBase returns 400 with data.email when email already exists
    if (err.status === 400 && err.data?.data?.email) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    email = String(email).trim().toLowerCase().slice(0, 254);
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });

    let authData;
    try {
      const PocketBase = require('pocketbase/cjs');
      const tempPb = new PocketBase(process.env.POCKETBASE_URL);
      authData = await tempPb.collection('users').authWithPassword(email, String(password));
    } catch {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { record } = authData;
    res.json(sessionFor(record));
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.json(sessionFor({
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      verified: req.user.verified === true,
    }));

    const record = await pb.collection('users').getOne(req.user.userId);
    res.json(sessionFor(record));
  } catch (err) { next(err); }
});

// POST /api/auth/verification/request
router.post('/verification/request', requireAuth, async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const email = req.user.email;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    await pb.collection('users').requestVerification(email);
    res.json({ message: 'Verification email sent.' });
  } catch (err) { next(err); }
});

// POST /api/auth/verification/confirm
router.post('/verification/confirm', async (req, res, next) => {
  try {
    if (!pb) return res.status(503).json({ error: 'Database not configured.' });
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'Verification token is required.' });
    await pb.collection('users').confirmVerification(token);
    res.json({ message: 'Email verified.' });
  } catch (err) {
    if (err.status === 400 || err.status === 404) {
      return res.status(400).json({ error: 'Verification link is invalid or expired.' });
    }
    next(err);
  }
});

// POST /api/auth/logout — client should discard token; this endpoint confirms
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
