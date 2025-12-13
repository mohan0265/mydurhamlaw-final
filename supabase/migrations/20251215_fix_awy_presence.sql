-- AWY presence schema/backfill to align with frontend expectations
BEGIN;

-- Ensure awy_presence table exists
CREATE TABLE IF NOT EXISTS public.awy_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT false,
  status text DEFAULT 'online',
  status_message text,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill missing columns safely (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN is_available boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN status text DEFAULT 'online';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'status_message'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN status_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'heartbeat_at'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN heartbeat_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN last_seen timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'awy_presence' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.awy_presence ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.awy_presence_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS awy_presence_set_updated_at ON public.awy_presence;
CREATE TRIGGER awy_presence_set_updated_at
BEFORE UPDATE ON public.awy_presence
FOR EACH ROW
EXECUTE FUNCTION public.awy_presence_set_updated_at();

-- Heartbeat RPC: upsert presence with availability flag
CREATE OR REPLACE FUNCTION public.awy_heartbeat(p_is_available boolean DEFAULT false, p_status text DEFAULT 'online', p_status_message text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.awy_presence (user_id, is_available, status, status_message, heartbeat_at, last_seen)
  VALUES (auth.uid(), COALESCE(p_is_available, false), COALESCE(p_status, 'online'), p_status_message, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_available = COALESCE(EXCLUDED.is_available, public.awy_presence.is_available),
    status = COALESCE(EXCLUDED.status, public.awy_presence.status),
    status_message = COALESCE(EXCLUDED.status_message, public.awy_presence.status_message),
    heartbeat_at = now(),
    last_seen = now(),
    updated_at = now();
$$;

-- Reaffirm RLS policies (idempotent)
ALTER TABLE public.awy_presence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'awy_presence' AND policyname = 'Users can manage their own presence'
  ) THEN
    CREATE POLICY "Users can manage their own presence"
      ON public.awy_presence
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'awy_presence' AND policyname = 'Students can see loved ones presence'
  ) THEN
    CREATE POLICY "Students can see loved ones presence"
      ON public.awy_presence
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.awy_connections c
          WHERE c.student_id = auth.uid()
            AND c.loved_one_id = public.awy_presence.user_id
            AND c.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'awy_presence' AND policyname = 'Loved ones can see student presence'
  ) THEN
    CREATE POLICY "Loved ones can see student presence"
      ON public.awy_presence
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.awy_connections c
          WHERE c.loved_one_id = auth.uid()
            AND c.student_id = public.awy_presence.user_id
            AND c.status = 'active'
        )
        AND is_available = true
      );
  END IF;
END $$;

-- Ensure Realtime publication covers presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.awy_presence;

COMMIT;
