-- 2025-12-19: Durmah threads and messages for onboarding + continuity
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.durmah_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_state text NOT NULL DEFAULT 'new', -- new|onboarding|active
  last_seen_at timestamptz,
  last_message_at timestamptz,
  last_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.durmah_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.durmah_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL, -- user | assistant | system
  content text NOT NULL,
  source text NOT NULL -- dashboard|wellbeing|assignments|voice|text
);

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
