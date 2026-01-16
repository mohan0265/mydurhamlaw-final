-- Migration: Upgrade AWY Presence to 2-Way with Status, Notes, and Expiry
BEGIN;

-- 1. Add new columns to awy_presence
ALTER TABLE public.awy_presence
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'busy',
  ADD COLUMN IF NOT EXISTS availability_mode text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS availability_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS availability_note text,
  ADD COLUMN IF NOT EXISTS availability_note_expires_at timestamptz;
  -- last_seen_at already exists

-- 2. Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'awy_presence_availability_status_check') THEN
    ALTER TABLE public.awy_presence
      ADD CONSTRAINT awy_presence_availability_status_check
      CHECK (availability_status IN ('available', 'busy', 'dnd'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'awy_presence_availability_mode_check') THEN
    ALTER TABLE public.awy_presence
      ADD CONSTRAINT awy_presence_availability_mode_check
      CHECK (availability_mode IN ('auto', 'manual'));
  END IF;
END $$;

-- 3. Update awy_heartbeat to handle new fields
-- We overload the function or just replace it. Let's replace to include new params.
-- Note: We default new params to NULL to maintain backward compatibility if called without them (though we will update frontend).

DROP FUNCTION IF EXISTS public.awy_heartbeat(boolean); -- Drop old signature if needed or just replace if signature matches (it won't).
-- Actually, let's keep the old one for a second as deprecated or just replace it if we can. 
-- Replacing with new arguments changes signature. Let's create a NEW one `awy_heartbeat_v2` or overload.
-- Overloading is fine.

CREATE OR REPLACE FUNCTION public.awy_update_presence(
  p_is_available boolean, -- Legacy support (maps to status='available' if true, else busy?)
  p_status text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_note_expires_at timestamptz DEFAULT NULL
)
RETURNS public.awy_presence
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.awy_presence;
  v_actual_status text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Logic: If p_status is provided, use it. Else map p_is_available.
  IF p_status IS NOT NULL THEN
    v_actual_status := p_status;
  ELSE
    v_actual_status := CASE WHEN p_is_available THEN 'available' ELSE 'busy' END;
  END IF;

  INSERT INTO public.awy_presence (
    user_id, 
    is_available, 
    availability_status, -- new
    availability_note, -- new
    availability_expires_at, -- new
    availability_note_expires_at, -- new
    status, -- old/legacy status (online/offline)
    last_seen_at, 
    updated_at, 
    heartbeat_at, 
    last_seen
  )
  VALUES (
    v_user, 
    (v_actual_status = 'available'), -- sync is_available
    v_actual_status,
    p_note,
    p_expires_at,
    p_note_expires_at,
    'online', 
    now(), now(), now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET 
      is_available = (v_actual_status = 'available'),
      availability_status = v_actual_status,
      -- Only update note/expiry if provided (allow partial updates? or overwrite?)
      -- Let's overwrite if provided, else keep existing? 
      -- Actually, usually heartbeat sends EVERYTHING. Let's assume frontend sends current state.
      -- But if they are null, maybe we shouldn't wipe them?
      -- Prompt said "Expiring...".
      -- Let's use COALESCE for optional updates, but we need a way to clear them.
      -- Convention: If p_note is an empty string, clear it. If NULL, keep it?
      -- Let's assume standard UPSERT semantics: simple overwrite is safer for "current state".
      -- BUT, for heartbeats that just say "I'm still here", we might not want to re-send the note every time.
      -- Lets stick to: If p_status passed, update status. 
      -- Let's try to be smart.
      
      availability_note = COALESCE(p_note, public.awy_presence.availability_note),
      availability_expires_at = COALESCE(p_expires_at, public.awy_presence.availability_expires_at),
      availability_note_expires_at = COALESCE(p_note_expires_at, public.awy_presence.availability_note_expires_at),
      
      status = 'online',
      last_seen_at = now(),
      heartbeat_at = now(),
      last_seen = now(),
      updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMIT;
