-- Quick Fix: Update Display Name for Existing Account
-- Run this in Supabase SQL Editor

-- Update the specific account
UPDATE public.profiles
SET display_name = 'Bhavani',
    year_of_study = 'year2',  -- You selected Year 2
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'ttboss65@gmail.com');

-- Verify the update
SELECT 
  id,
  display_name,
  year_of_study,
  user_role,
  created_at
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'ttboss65@gmail.com');
