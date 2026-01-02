-- Complete Account Reset Script
-- Purpose: Delete all data for test accounts to enable re-registration with same emails
-- WARNING: This will permanently delete all data for the specified email addresses
-- Run this in Supabase SQL Editor

-- STEP 1: Find user IDs for your test emails
-- (Run this first to see what will be deleted)
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email IN (
  'mohan0265@gmail.com'
  -- Add more test emails here, comma-separated:
  -- ,'test.student1@test.com',
  -- ,'test.parent1@test.com'
);

-- STEP 2: Delete all related data (UNCOMMENT to run)
-- WARNING: Uncomment the DELETE statements below only when ready!

-- Delete timetable events
/*
DELETE FROM public.timetable_events
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
    -- Add same emails as above
  )
);
*/

-- Delete Durmah user memory (greeting suppression, etc.)
/*
DELETE FROM public.durmah_user_memory
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
  )
);
*/

-- Delete Durmah chat history
/*
DELETE FROM public.durmah_chats
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
  )
);
*/

-- Delete AWY connections (as student)
/*
DELETE FROM public.awy_connections
WHERE student_user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
  )
);
*/

-- Delete AWY connections (as loved one)
/*
DELETE FROM public.awy_connections
WHERE loved_user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
  )
);
*/

-- Delete profiles
/*
DELETE FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'mohan0265@gmail.com'
  )
);
*/

-- STEP 3: Delete auth users (FINAL STEP - run last!)
-- This removes the actual authentication accounts
-- After this, you can re-register with the same email
/*
DELETE FROM auth.users
WHERE email IN (
  'mohan0265@gmail.com'
  -- Add same emails as above
);
*/

-- VERIFICATION: Check that accounts are gone
-- (Run this after deletion to confirm)
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email IN (
  'mohan0265@gmail.com'
);
-- Should return 0 rows if deletion was successful
