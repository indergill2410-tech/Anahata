const { createClient } = require('@supabase/supabase-js');

// Correct env var names — no NEXT_PUBLIC_ prefix in Node.js server
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[Supabase] WARNING: SUPABASE_URL or SUPABASE_KEY not set.\n' +
    '  Set them in your .env file. DB calls will return errors until configured.'
  );
}

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

module.exports = supabase;
