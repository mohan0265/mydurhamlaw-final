-- Enable Realtime for awy_presence
-- This allows clients to subscribe to changes

-- 1. Add table to supabase_realtime publication
alter publication supabase_realtime add table public.awy_presence;

-- 2. Ensure RLS allows reading (already done in previous migration, but good to double check)
-- "Loved ones can see student presence" and "Students can see loved ones presence" policies should cover SELECTs.

-- 3. (Optional) If we want to broadcast specific columns only, we could, but default is fine.
