-- Franklink Account Section – avatar storage + policies
--
-- Run this in the Supabase SQL editor for the project that owns your `users` table.
-- Prerequisites: public.users table must exist (see dashboard.sql).

-- ------------------------------------------------------------
-- 1. Add agent avatar URL column to users table
-- ------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agent_avatar_url text;

-- Constrain to Supabase Storage URLs only (prevents arbitrary strings / XSS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_avatar_url_valid'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT agent_avatar_url_valid
    CHECK (agent_avatar_url IS NULL OR agent_avatar_url LIKE 'https://%.supabase.co/storage/%');
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. Create storage bucket for agent avatars
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Storage policies (RLS on storage.objects)
-- ------------------------------------------------------------

-- Users can upload avatars to their own folder ({user_id}/*)
DO $$ BEGIN
  CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can overwrite/update their own avatar
DO $$ BEGIN
  CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can delete their own avatar
DO $$ BEGIN
  CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can read avatars (bucket is public)
DO $$ BEGIN
  CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
