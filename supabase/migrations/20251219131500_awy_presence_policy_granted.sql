-- 2025-12-19: AWY presence policy include granted connections
BEGIN;

-- Presence connected read policy previously only allowed status IN ('active','accepted').
-- Extend to include 'granted' so newly invited loved ones can see each other.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'awy_presence'
      AND policyname = 'awy presence connected read'
  ) THEN
    DROP POLICY "awy presence connected read" ON public.awy_presence;
  END IF;

  CREATE POLICY "awy presence connected read"
    ON public.awy_presence
    FOR SELECT
    USING (
      auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.awy_connections c
        WHERE c.status IN ('active', 'accepted', 'granted')
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
END $$;

COMMIT;
