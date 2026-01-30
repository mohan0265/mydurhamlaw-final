-- AWY Connections Data Sync Fix
-- Run this in Supabase SQL Editor to fix column mismatches

-- 1. Sync student columns (student_id <-> student_user_id)
UPDATE public.awy_connections 
SET student_user_id = student_id 
WHERE student_id IS NOT NULL AND (student_user_id IS NULL OR student_user_id != student_id);

UPDATE public.awy_connections 
SET student_id = student_user_id 
WHERE student_user_id IS NOT NULL AND (student_id IS NULL OR student_id != student_user_id);

-- 2. Sync loved one columns (loved_one_id <-> loved_user_id)  
UPDATE public.awy_connections 
SET loved_user_id = loved_one_id 
WHERE loved_one_id IS NOT NULL AND (loved_user_id IS NULL OR loved_user_id != loved_one_id);

UPDATE public.awy_connections 
SET loved_one_id = loved_user_id 
WHERE loved_user_id IS NOT NULL AND (loved_one_id IS NULL OR loved_one_id != loved_user_id);

-- 3. Sync email columns (email <-> loved_email)
UPDATE public.awy_connections 
SET email = loved_email 
WHERE loved_email IS NOT NULL AND (email IS NULL OR email != loved_email);

UPDATE public.awy_connections 
SET loved_email = email 
WHERE email IS NOT NULL AND (loved_email IS NULL OR loved_email != email);

-- 4. Verify the fix - should show all connections with both columns populated
SELECT id, student_id, student_user_id, loved_one_id, loved_user_id, loved_email, email, relationship, status
FROM public.awy_connections 
WHERE student_id = '8b5ceedd-65f3-4c16-a859-c5c6c7bc6bd9'
   OR student_user_id = '8b5ceedd-65f3-4c16-a859-c5c6c7bc6bd9';
