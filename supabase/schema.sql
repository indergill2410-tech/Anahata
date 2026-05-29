-- Anahata — Supabase Database Schema v2
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  avatar_url    TEXT,
  subscription  TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'premium')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Meditation Sessions
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  heart_rate          INT,
  hrv                 FLOAT,
  spo2                FLOAT,
  stress_level        TEXT,
  target_heart_rate   INT,
  musical_tempo       INT,
  brainwave_state     TEXT,
  binaural_hz         FLOAT,
  audio_url           TEXT,
  is_fallback         BOOLEAN DEFAULT FALSE,
  prompt_used         TEXT,
  duration_seconds    INT DEFAULT 120,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Library Favourites
CREATE TABLE IF NOT EXISTS public.library_favourites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Library Play History
CREATE TABLE IF NOT EXISTS public.library_plays (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id     TEXT NOT NULL,
  played_at    TIMESTAMPTZ DEFAULT NOW(),
  duration_played INT
);

-- RLS Policies
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_favourites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_plays         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"           ON public.user_profiles         FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"         ON public.user_profiles         FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions"          ON public.meditation_sessions   FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"        ON public.meditation_sessions   FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own favourites"      ON public.library_favourites    FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own play history"    ON public.library_plays         FOR ALL    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id      ON public.meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at   ON public.meditation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favs_user_id          ON public.library_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_plays_user_id         ON public.library_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_plays_track_id        ON public.library_plays(track_id);
