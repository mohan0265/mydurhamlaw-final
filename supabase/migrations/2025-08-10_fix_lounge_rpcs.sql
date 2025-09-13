-- Migration: Fix Lounge RPC Functions
-- Date: 2025-08-10
-- Purpose: Create/replace get_lounge_posts_page and get_lounge_sparks_recent RPCs with proper signatures

-- Drop existing functions if they exist (to handle signature changes)
DROP FUNCTION IF EXISTS public.get_lounge_posts_page(int, timestamptz);
DROP FUNCTION IF EXISTS public.get_lounge_posts_page(timestamptz, int);
DROP FUNCTION IF EXISTS public.get_lounge_sparks_recent(int);

-- Create get_lounge_posts_page function
CREATE OR REPLACE FUNCTION public.get_lounge_posts_page(
  p_limit int,
  p_cursor timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  author_display_name text,
  body text,
  image_url text,
  audio_url text,
  created_at timestamptz,
  is_shadow_muted boolean,
  automod_flag boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH me AS (
    SELECT auth.uid() as uid
  )
  SELECT 
    p.id,
    p.author_id,
    COALESCE(prof.display_name, 'Student') as author_display_name,
    p.body,
    p.image_url,
    p.audio_url,
    p.created_at,
    p.is_shadow_muted,
    p.automod_flag
  FROM lounge_posts p
  CROSS JOIN me
  LEFT JOIN profiles prof ON prof.id = p.author_id
  WHERE 
    p.created_at < COALESCE(p_cursor, now())
    AND p.is_hidden = false
    -- Exclude posts from blocked users (both directions)
    AND NOT EXISTS (
      SELECT 1 FROM lounge_blocks lb 
      WHERE (lb.blocker_id = me.uid AND lb.blocked_id = p.author_id)
         OR (lb.blocker_id = p.author_id AND lb.blocked_id = me.uid)
    )
  ORDER BY p.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- Create get_lounge_sparks_recent function  
CREATE OR REPLACE FUNCTION public.get_lounge_sparks_recent(
  p_limit int
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  author_display_name text,
  text text,
  created_at timestamptz,
  is_shadow_muted boolean,
  automod_flag boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH me AS (
    SELECT auth.uid() as uid
  )
  SELECT 
    s.id,
    s.author_id,
    COALESCE(prof.display_name, 'Student') as author_display_name,
    s.text,
    s.created_at,
    s.is_shadow_muted,
    s.automod_flag
  FROM lounge_sparks s
  CROSS JOIN me
  LEFT JOIN profiles prof ON prof.id = s.author_id
  WHERE 
    s.is_hidden = false
    -- Exclude sparks from blocked users (both directions)
    AND NOT EXISTS (
      SELECT 1 FROM lounge_blocks lb 
      WHERE (lb.blocker_id = me.uid AND lb.blocked_id = s.author_id)
         OR (lb.blocker_id = s.author_id AND lb.blocked_id = me.uid)
    )
  ORDER BY s.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_lounge_posts_page(int, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lounge_sparks_recent(int) TO authenticated;

-- Add realtime publications (wrapped in exception handling)
DO $$ 
BEGIN 
  -- Add lounge_posts to realtime if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lounge_posts;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;

  -- Add lounge_reactions to realtime if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lounge_reactions;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;

  -- Add lounge_sparks to realtime if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lounge_sparks;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;

  -- Add lounge_blocks to realtime if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lounge_blocks;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Schema cache refresh nudge (safe no-op)
SELECT now() as schema_cache_refresh;

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify functions are created correctly:
-- =============================================================================

/*
-- 1. Verify functions exist with correct signatures
SELECT routine_name, specific_schema 
FROM information_schema.routines
WHERE specific_schema = 'public'
  AND routine_name IN ('get_lounge_posts_page', 'get_lounge_sparks_recent');

-- 2. Test get_lounge_posts_page function
SELECT * FROM public.get_lounge_posts_page(5, NULL);

-- 3. Test get_lounge_sparks_recent function  
SELECT * FROM public.get_lounge_sparks_recent(5);
*/