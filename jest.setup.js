process.env.NODE_ENV    = 'test';
process.env.JWT_SECRET  = 'test-secret-anahata-jest';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_KEY;
