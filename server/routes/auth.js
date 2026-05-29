/**
 * Anahata — Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

const express     = require('express');
const rateLimit   = require('express-rate-limit');
const router      = express.Router();
const supabase    = require('../services/supabaseClient');
const { signToken } = require('../utils/jwtHelper');
const { requireAuth } = require('../middleware/auth');

// Stricter rate limit for auth endpoints — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    let { email, password, name } = req.body;

    // Validation
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
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Upsert profile row
    await supabase.from('user_profiles').upsert({ id: data.user.id, name });

    const token = signToken({ userId: data.user.id, email, name });
    res.status(201).json({ token, user: { id: data.user.id, email, name } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    email = String(email).trim().toLowerCase().slice(0, 254);
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: String(password) });
    if (error) return res.status(401).json({ error: 'Invalid email or password.' });

    // Fetch profile name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', data.user.id)
      .single();

    const name = profile?.name || data.user.user_metadata?.name || '';
    const token = signToken({ userId: data.user.id, email, name });
    res.json({ token, user: { id: data.user.id, email, name } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
