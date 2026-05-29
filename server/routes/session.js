/**
 * Anahata — Session Routes
 * GET /api/sessions        → List user's past sessions
 * GET /api/sessions/:id    → Get single session
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { createClient } = require('@supabase/supabase-js');

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

router.use(authenticate);

// Get all sessions for user
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await db()
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ sessions: data });
  } catch (err) { next(err); }
});

// Get single session
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await db()
      .from('meditation_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Session not found.' });
    res.json({ session: data });
  } catch (err) { next(err); }
});

module.exports = router;
