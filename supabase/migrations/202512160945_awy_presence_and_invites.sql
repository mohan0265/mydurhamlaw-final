-- AWY presence + invites forward-compat schema
BEGIN;

-- Presence table with availability flag
CREATE TABLE IF NOT EXISTS public.awy_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'online'
);

-- Backfill columns if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='id') THEN
    ALTER TABLE public.awy_presence ADD COLUMN id uuid DEFAULT gen_random_uuid();
    UPDATE public.awy_presence SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE public.awy_presence ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.awy_presence ADD PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='is_available') THEN
    ALTER TABLE public.awy_presence ADD COLUMN is_available boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='last_seen_at') THEN
    ALTER TABLE public.awy_presence ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_presence' AND column_name='updated_at') THEN
    ALTER TABLE public.awy_presence ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='awy_presence' AND constraint_type='UNIQUE' AND constraint_name='awy_presence_user_id_key') THEN
    ALTER TABLE public.awy_presence ADD CONSTRAINT awy_presence_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_awy_presence_user_id ON public.awy_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_awy_presence_is_available ON public.awy_presence(is_available);

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

-- Heartbeat RPC
CREATE OR REPLACE FUNCTION public.awy_heartbeat(p_is_available boolean DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.awy_presence (user_id, is_available, last_seen_at, updated_at)
  VALUES (auth.uid(), COALESCE(p_is_available, false), now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    is_available = COALESCE(p_is_available, public.awy_presence.is_available),
    last_seen_at = now(),
    updated_at = now();
$$;

-- Connections / invites table
CREATE TABLE IF NOT EXISTS public.awy_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loved_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  loved_email text NOT NULL,
  relationship_label text,
  invite_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'invited', -- invited|accepted|blocked|revoked|pending
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill/align existing awy_connections if present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='owner_user_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN owner_user_id uuid;
    UPDATE public.awy_connections SET owner_user_id = student_id WHERE owner_user_id IS NULL;
    ALTER TABLE public.awy_connections ALTER COLUMN owner_user_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='loved_user_id') THEN
    ALTER TABLE public.awy_connections ADD COLUMN loved_user_id uuid;
    UPDATE public.awy_connections SET loved_user_id = loved_one_id WHERE loved_user_id IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='relationship_label') THEN
    ALTER TABLE public.awy_connections ADD COLUMN relationship_label text;
    UPDATE public.awy_connections SET relationship_label = relationship WHERE relationship_label IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='invite_token') THEN
    ALTER TABLE public.awy_connections ADD COLUMN invite_token text;
    UPDATE public.awy_connections SET invite_token = gen_random_uuid()::text WHERE invite_token IS NULL;
    ALTER TABLE public.awy_connections ALTER COLUMN invite_token SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='accepted_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN accepted_at timestamptz NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awy_connections' AND column_name='updated_at') THEN
    ALTER TABLE public.awy_connections ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_awy_connections_owner ON public.awy_connections(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_awy_connections_loved ON public.awy_connections(loved_user_id);

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

-- Invite acceptance RPC
CREATE OR REPLACE FUNCTION public.awy_accept_invite(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.awy_connections
  SET loved_user_id = me,
      status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE invite_token = p_token
    AND status IN ('invited','pending')
  RETURNING id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_token';
  END IF;
END;
$$;

-- RLS
ALTER TABLE public.awy_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awy_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='awy_presence' AND policyname='presence self write'
  ) THEN
    CREATE POLICY "presence self write"
      ON public.awy_presence
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='awy_presence' AND policyname='presence connected read'
  ) THEN
    CREATE POLICY "presence connected read"
      ON public.awy_presence
      FOR SELECT
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.awy_connections c
          WHERE c.status = 'accepted'
            AND (
              (c.owner_user_id = auth.uid() AND c.loved_user_id = public.awy_presence.user_id)
              OR (c.loved_user_id = auth.uid() AND c.owner_user_id = public.awy_presence.user_id)
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='awy_connections' AND policyname='connections owner full'
  ) THEN
    CREATE POLICY "connections owner full"
      ON public.awy_connections
      FOR ALL
      USING (auth.uid() = owner_user_id)
      WITH CHECK (auth.uid() = owner_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='awy_connections' AND policyname='connections loved read'
  ) THEN
    CREATE POLICY "connections loved read"
      ON public.awy_connections
      FOR SELECT
      USING (auth.uid() = loved_user_id);
  END IF;
END $$;

-- Ensure Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.awy_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.awy_connections;

COMMIT;
