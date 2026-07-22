-- Anahata — Journal Entries (Supabase)
-- Journalling storage for the rebuilt app. Run in the Supabase SQL Editor
-- (or add to your migrations). Mirrors the previous PocketBase `journal_entries`
-- collection, secured with Row Level Security so each user only sees their own.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type  TEXT NOT NULL CHECK (entry_type IN ('checkin', 'daily', 'dream', 'note', 'plan')),
  entry_date  DATE NOT NULL,
  mood        INT,
  lucidity    INT,
  title       TEXT,
  text        TEXT,
  follow_up   TEXT,
  prompt      TEXT,
  cta         TEXT,
  tags        JSONB DEFAULT '[]'::jsonb,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Keep updated_at fresh on every write
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security: a user can only touch their own entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own journal"   ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal" ON public.journal_entries;

CREATE POLICY "Users can view own journal"
  ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal"
  ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal"
  ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal"
  ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Indexes for the common query patterns (by user, by date, by type)
CREATE INDEX IF NOT EXISTS idx_journal_user_id    ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_date  ON public.journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user_type  ON public.journal_entries(user_id, entry_type);
