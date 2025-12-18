BEGIN;

-- 1. Relax the constraint to allow more statuses including 'accepted', 'invited'
-- Use IF EXISTS to avoid error if constraint name differs or doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'awy_connections_status_check') THEN
    ALTER TABLE public.awy_connections DROP CONSTRAINT awy_connections_status_check;
  END IF;
  
  -- Also check for 'awy_connections_status_check1' or similar auto-generated names if any
  -- But for now we assume the standard name.
END $$;

ALTER TABLE public.awy_connections ADD CONSTRAINT awy_connections_status_check 
  CHECK (status IN ('pending', 'invited', 'active', 'accepted', 'blocked', 'revoked'));

-- 2. Update the RPC to use 'active' (standard) matches the policy checks better.
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
      status = 'active',  -- Set to 'active' which is generally universally allowed
      accepted_at = now(),
      updated_at = now()
  WHERE invite_token = p_token
    -- We allow re-accepting if it's already pending/invited/etc.
    AND status IN ('pending', 'invited', 'active', 'accepted') 
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_token';
  END IF;

  RETURN v_row;
END;
$$;

COMMIT;
