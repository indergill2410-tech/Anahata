/**
 * Anahata — Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { signToken } = require('../utils/auth');

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { name },
      email_confirm: true
    });

    if (error) return res.status(400).json({ error: error.message });

    const token = signToken({ userId: data.user.id, email });
    res.status(201).json({ token, user: { id: data.user.id, email, name } });
  } catch (err) { next(err); }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = signToken({ userId: data.user.id, email });
    res.json({ token, user: { id: data.user.id, email } });
  } catch (err) { next(err); }
});

module.exports = router;
