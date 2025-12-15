-- AWY catch-up: align presence, invites, RPCs, and RLS with frontend expectations
BEGIN;

-- Required for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Presence table (idempotent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.awy_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'online',
  status_message text,
  heartbeat_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='is_available') THEN
    ALTER TABLE public.awy_presence ADD COLUMN is_available boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='last_seen_at') THEN
    ALTER TABLE public.awy_presence ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='updated_at') THEN
    ALTER TABLE public.awy_presence ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='status') THEN
    ALTER TABLE public.awy_presence ADD COLUMN status text DEFAULT 'online';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='status_message') THEN
    ALTER TABLE public.awy_presence ADD COLUMN status_message text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='heartbeat_at') THEN
    ALTER TABLE public.awy_presence ADD COLUMN heartbeat_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='last_seen') THEN
    ALTER TABLE public.awy_presence ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;

  -- Ensure a primary key or unique constraint on user_id without dropping existing keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='awy_presence' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE public.awy_presence ADD PRIMARY KEY (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='awy_presence' AND constraint_name='awy_presence_user_id_key'
  ) THEN
    ALTER TABLE public.awy_presence ADD CONSTRAINT awy_presence_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.awy_presence_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS awy_presence_touch_updated_at ON public.awy_presence;
CREATE TRIGGER awy_presence_touch_updated_at
BEFORE UPDATE ON public.awy_presence
FOR EACH ROW
EXECUTE FUNCTION public.awy_presence_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Connections / invites table (idempotent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.awy_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loved_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  relationship text,
  nickname text,
  status text NOT NULL DEFAULT 'pending',
  invite_token text UNIQUE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Legacy/compat columns retained if the table already exists
  student_id uuid,
  loved_one_id uuid,
  loved_email text,
  relationship_label text
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='student_user_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN student_user_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='student_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN student_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='loved_user_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN loved_user_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='loved_one_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN loved_one_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='email') THEN
    ALTER TABLE public.awy_connections ADD COLUMN email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='loved_email') THEN
    ALTER TABLE public.awy_connections ADD COLUMN loved_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='relationship') THEN
    ALTER TABLE public.awy_connections ADD COLUMN relationship text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='relationship_label') THEN
    ALTER TABLE public.awy_connections ADD COLUMN relationship_label text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='nickname') THEN
    ALTER TABLE public.awy_connections ADD COLUMN nickname text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='status') THEN
    ALTER TABLE public.awy_connections ADD COLUMN status text NOT NULL DEFAULT 'pending';
  ELSE
    ALTER TABLE public.awy_connections ALTER COLUMN status SET DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='invite_token') THEN
    ALTER TABLE public.awy_connections ADD COLUMN invite_token text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='invited_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN invited_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='accepted_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN accepted_at timestamptz NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='created_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='updated_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;

  -- Backfill compatibility columns both ways
  UPDATE public.awy_connections SET student_user_id = student_id WHERE student_user_id IS NULL AND student_id IS NOT NULL;
  UPDATE public.awy_connections SET student_id = student_user_id WHERE student_id IS NULL AND student_user_id IS NOT NULL;

  UPDATE public.awy_connections SET email = loved_email WHERE email IS NULL AND loved_email IS NOT NULL;
  UPDATE public.awy_connections SET loved_email = email WHERE loved_email IS NULL AND email IS NOT NULL;

  UPDATE public.awy_connections SET loved_user_id = loved_one_id WHERE loved_user_id IS NULL AND loved_one_id IS NOT NULL;
  UPDATE public.awy_connections SET loved_one_id = loved_user_id WHERE loved_one_id IS NULL AND loved_user_id IS NOT NULL;

  -- Reinstate NOT NULL + FKs where applicable
  BEGIN
    ALTER TABLE public.awy_connections ALTER COLUMN student_user_id SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.awy_connections ADD CONSTRAINT awy_connections_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.awy_connections ADD CONSTRAINT awy_connections_loved_user_id_fkey FOREIGN KEY (loved_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.awy_connections ADD CONSTRAINT awy_connections_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.awy_connections ADD CONSTRAINT awy_connections_loved_one_id_fkey FOREIGN KEY (loved_one_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_awy_connections_invite_token ON public.awy_connections(invite_token);
CREATE INDEX IF NOT EXISTS idx_awy_connections_student_user_id ON public.awy_connections(student_user_id);
CREATE INDEX IF NOT EXISTS idx_awy_connections_student_id ON public.awy_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_awy_connections_loved_user_id ON public.awy_connections(loved_user_id);
CREATE INDEX IF NOT EXISTS idx_awy_connections_loved_one_id ON public.awy_connections(loved_one_id);

CREATE OR REPLACE FUNCTION public.awy_connections_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS awy_connections_touch_updated_at ON public.awy_connections;
CREATE TRIGGER awy_connections_touch_updated_at
BEFORE UPDATE ON public.awy_connections
FOR EACH ROW
EXECUTE FUNCTION public.awy_connections_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.awy_heartbeat(p_is_available boolean DEFAULT NULL)
RETURNS public.awy_presence
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.awy_presence;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.awy_presence (user_id, is_available, status, last_seen_at, updated_at, heartbeat_at, last_seen)
  VALUES (v_user, COALESCE(p_is_available, false), 'online', now(), now(), now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET is_available = COALESCE(EXCLUDED.is_available, public.awy_presence.is_available),
        status = COALESCE(public.awy_presence.status, 'online'),
        last_seen_at = now(),
        heartbeat_at = now(),
        last_seen = now(),
        updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.awy_accept_invite(p_token text)
RETURNS public.awy_connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.awy_connections;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.awy_connections
  SET loved_user_id = v_user,
      loved_one_id = COALESCE(loved_one_id, v_user),
      status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE invite_token = p_token
    AND status IN ('pending', 'invited', 'active')
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_token';
  END IF;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.awy_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awy_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='awy_presence' AND policyname='awy presence self access'
  ) THEN
    CREATE POLICY "awy presence self access"
      ON public.awy_presence
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='awy_presence' AND policyname='awy presence connected read'
  ) THEN
    CREATE POLICY "awy presence connected read"
      ON public.awy_presence
      FOR SELECT
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.awy_connections c
          WHERE c.status IN ('active', 'accepted')
            AND (
              (
                (c.student_user_id = auth.uid() OR c.student_id = auth.uid())
                AND (c.loved_user_id = public.awy_presence.user_id OR c.loved_one_id = public.awy_presence.user_id)
              )
              OR
              (
                (c.loved_user_id = auth.uid() OR c.loved_one_id = auth.uid())
                AND (c.student_user_id = public.awy_presence.user_id OR c.student_id = public.awy_presence.user_id)
              )
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='awy_connections' AND policyname='awy connections participant select'
  ) THEN
    CREATE POLICY "awy connections participant select"
      ON public.awy_connections
      FOR SELECT
      USING (
        auth.uid() = COALESCE(student_user_id, student_id)
        OR auth.uid() = COALESCE(loved_user_id, loved_one_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='awy_connections' AND policyname='awy connections student insert'
  ) THEN
    CREATE POLICY "awy connections student insert"
      ON public.awy_connections
      FOR INSERT
      WITH CHECK (auth.uid() = COALESCE(student_user_id, student_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='awy_connections' AND policyname='awy connections participant update'
  ) THEN
    CREATE POLICY "awy connections participant update"
      ON public.awy_connections
      FOR UPDATE
      USING (
        auth.uid() = COALESCE(student_user_id, student_id)
        OR auth.uid() = COALESCE(loved_user_id, loved_one_id)
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Ensure realtime is enabled
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'awy_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.awy_presence;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'awy_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.awy_connections;
  END IF;
END $$;

COMMIT;
