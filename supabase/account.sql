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

-- ------------------------------------------------------------
-- 4. Add graduation year column to users table
-- ------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS graduation_year integer;

-- Constrain to reasonable year range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'graduation_year_valid'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT graduation_year_valid
    CHECK (graduation_year IS NULL OR (graduation_year >= 2020 AND graduation_year <= 2040));
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. Fix RLS policies for connection graph
-- ------------------------------------------------------------

-- 5a. Users table: allow authenticated users to read any user's basic profile
--     (needed so the connection graph can fetch names of connected peers)
--     The old "Users can read their profile" policy only allows id = auth.uid().
DROP POLICY IF EXISTS "Users can read their profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.users;
CREATE POLICY "Authenticated users can read profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5b. connection_requests: users can see requests they initiated or received
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their connection requests" ON public.connection_requests;
CREATE POLICY "Users can read their connection requests"
  ON public.connection_requests FOR SELECT
  USING (initiator_user_id = auth.uid() OR target_user_id = auth.uid());

-- ------------------------------------------------------------
-- 6. RLS policies for group chat tables (needed for connection graph)
-- ------------------------------------------------------------

-- 6a. group_chat_participants: users can read rows for chats they participate in
ALTER TABLE public.group_chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their group chat participations" ON public.group_chat_participants;
CREATE POLICY "Users can read their group chat participations"
  ON public.group_chat_participants FOR SELECT
  USING (
    chat_guid IN (
      SELECT gcp.chat_guid FROM public.group_chat_participants gcp
      WHERE gcp.user_id = auth.uid()
    )
  );

-- 6b. group_chats: users can read group chats they participate in
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their group chats" ON public.group_chats;
CREATE POLICY "Users can read their group chats"
  ON public.group_chats FOR SELECT
  USING (
    chat_guid IN (
      SELECT gcp.chat_guid FROM public.group_chat_participants gcp
      WHERE gcp.user_id = auth.uid()
    )
  );
