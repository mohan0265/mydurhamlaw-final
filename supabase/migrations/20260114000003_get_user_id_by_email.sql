-- Migration: Add RPC function to look up user ID by email
-- This function is callable only by service_role (admin) to get user ID from auth.users

-- Create a secure function that reads auth.users (only accessible via service_role)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow service_role to call this
  -- (security definer allows the function to access auth.users)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(p_email)
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

-- Grant execute to service_role only
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

COMMENT ON FUNCTION public.get_user_id_by_email IS 
  'Look up a user ID by email address. Only callable by service_role for admin operations.';
