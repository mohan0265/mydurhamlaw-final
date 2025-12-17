-- 2025-12-19: Patch durmah_threads/messages to add missing columns safely
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure durmah_threads exists with required columns
CREATE TABLE IF NOT EXISTS public.durmah_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_state text NOT NULL DEFAULT 'new',
  last_seen_at timestamptz,
  last_message_at timestamptz,
  last_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure durmah_messages exists
CREATE TABLE IF NOT EXISTS public.durmah_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add missing columns to durmah_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='thread_id'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN thread_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN user_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='role'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN role text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='content'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN content text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='source'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN source text;
  END IF;
END $$;

-- Ensure FK constraints
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.durmah_messages
      ADD CONSTRAINT durmah_messages_thread_fkey FOREIGN KEY (thread_id) REFERENCES public.durmah_threads(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER TABLE public.durmah_messages
      ADD CONSTRAINT durmah_messages_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_durmah_threads_user ON public.durmah_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_durmah_threads_updated ON public.durmah_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_thread ON public.durmah_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_user_created ON public.durmah_messages(user_id, created_at DESC);

-- RLS
ALTER TABLE public.durmah_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.durmah_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='durmah_threads' AND policyname='durmah threads self'
  ) THEN
    CREATE POLICY "durmah threads self" ON public.durmah_threads
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='durmah_messages' AND policyname='durmah messages self'
  ) THEN
    CREATE POLICY "durmah messages self" ON public.durmah_messages
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
