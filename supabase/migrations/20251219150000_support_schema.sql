-- 2025-12-19: Support system schema (tickets, messages, notes, KB, summaries)
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open',            -- open|pending|resolved|closed
  priority text NOT NULL DEFAULT 'normal',        -- low|normal|high|urgent
  source text NOT NULL DEFAULT 'widget',          -- widget|support_page|email_future
  is_visitor boolean NOT NULL DEFAULT false,
  visitor_email text,
  visitor_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  subject text NOT NULL DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  tags text[] NOT NULL DEFAULT '{}',
  page_url text,
  user_agent text,
  client_meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  role text NOT NULL, -- user|assistant|admin|system
  content text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.support_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_user_id uuid NULL,
  note text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.support_user_issue_summaries (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  summary text NOT NULL DEFAULT ''
);

-- ---------------------------------------------------------------------------
-- Triggers for timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.support_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.support_touch_ticket_on_message()
RETURNS trigger AS $$
BEGIN
  UPDATE public.support_tickets
  SET last_message_at = now(),
      updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.support_set_updated_at();

DROP TRIGGER IF EXISTS trg_support_kb_updated_at ON public.support_kb_articles;
CREATE TRIGGER trg_support_kb_updated_at
BEFORE UPDATE ON public.support_kb_articles
FOR EACH ROW
EXECUTE FUNCTION public.support_set_updated_at();

DROP TRIGGER IF EXISTS trg_support_messages_touch_ticket ON public.support_messages;
CREATE TRIGGER trg_support_messages_touch_ticket
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.support_touch_ticket_on_message();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_user_issue_summaries ENABLE ROW LEVEL SECURITY;

-- support_tickets: self access for authenticated users; visitors go through service role only.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='support tickets select self'
  ) THEN
    CREATE POLICY "support tickets select self"
      ON public.support_tickets
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='support tickets insert self'
  ) THEN
    CREATE POLICY "support tickets insert self"
      ON public.support_tickets
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='support tickets update self'
  ) THEN
    CREATE POLICY "support tickets update self"
      ON public.support_tickets
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- support_messages: self access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_messages' AND policyname='support messages select self'
  ) THEN
    CREATE POLICY "support messages select self"
      ON public.support_messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = support_messages.ticket_id
            AND t.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_messages' AND policyname='support messages insert self'
  ) THEN
    CREATE POLICY "support messages insert self"
      ON public.support_messages
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = support_messages.ticket_id
            AND t.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- support_admin_notes: only service_role (no user policy)
-- support_kb_articles: allow published read for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_kb_articles' AND policyname='support kb select published'
  ) THEN
    CREATE POLICY "support kb select published"
      ON public.support_kb_articles
      FOR SELECT
      USING (is_published = true);
  END IF;
END $$;

-- support_user_issue_summaries: allow self read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_user_issue_summaries' AND policyname='support summaries select self'
  ) THEN
    CREATE POLICY "support summaries select self"
      ON public.support_user_issue_summaries
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Seed KB articles (idempotent on slug)
-- ---------------------------------------------------------------------------
INSERT INTO public.support_kb_articles (title, slug, body, tags)
VALUES
('Login issues (Google OAuth)', 'login-issues', 'If Google login loops:\n1) Clear cookies for caseway.ai\n2) Try an incognito window\n3) Ensure the same Google account used for signup\n4) If still blocked, capture the error message and browser version and open a support ticket.', ARRAY['login','auth']),
('Trial activation / access', 'trial-activation', 'If trial does not activate:\n1) Sign out, sign back in\n2) Confirm email verification in Google\n3) If subscription shows Free • Inactive after refresh, open a support ticket.', ARRAY['trial','billing']),
('Billing / subscription / cancel', 'billing-subscription', 'Billing tips:\n1) Plan switches take up to 2 minutes to reflect\n2) To cancel, go to Manage Billing in the top bar\n3) If payment fails, try another card or contact support with last 4 digits (only).', ARRAY['billing']),
('Mic permissions and browser settings', 'mic-permissions', 'For voice features:\n1) In Chrome/Edge, click the mic icon in the address bar and allow mic access\n2) Ensure OS mic permissions are on\n3) If still muted, restart the browser and retry.', ARRAY['voice','mic']),
('YAAG not visible for signed-in users', 'yaag-not-visible', 'If Year-at-a-Glance missing:\n1) Refresh the page after login\n2) Ensure year_group is set in your profile\n3) If still missing, open a support ticket with your user ID.', ARRAY['yaag']),
('Durmah widget “not listening”', 'durmah-not-listening', 'If Durmah is silent:\n1) Check mic permissions\n2) Disable any VPN blocking websockets\n3) Try a hard refresh\n4) If still stuck, open a support ticket with browser/OS.', ARRAY['durmah','voice']),
('Mobile vs desktop tips', 'mobile-desktop-differences', 'On mobile: fewer background tabs; ensure stable network. On desktop: prefer Chrome/Edge. If layouts break, hard refresh or clear cache.', ARRAY['mobile','desktop'])
ON CONFLICT (slug) DO NOTHING;

COMMIT;
