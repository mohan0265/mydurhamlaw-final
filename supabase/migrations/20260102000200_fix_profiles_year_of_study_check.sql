-- Migration: Fix profiles year_of_study constraint to use canonical values
-- Created: 2026-01-02
-- Strategy: Drop old constraint first, normalize data, then add new canonical constraint

BEGIN;

-- Step 1: Drop existing constraint first (allows us to update to any value)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_year_of_study_check;

-- Step 2: Normalize data to canonical values (now that no constraint blocks it)
UPDATE public.profiles
SET year_of_study = CASE 
  WHEN year_of_study IS NULL THEN NULL
  WHEN LOWER(TRIM(year_of_study)) IN ('foundation', 'foundation year') THEN 'foundation'
  WHEN LOWER(TRIM(year_of_study)) IN ('year 1', 'year1', '1', 'first year') THEN 'year1'
  WHEN LOWER(TRIM(year_of_study)) IN ('year 2', 'year2', '2', 'second year') THEN 'year2'
  WHEN LOWER(TRIM(year_of_study)) IN ('year 3', 'year3', '3', 'third year') THEN 'year3'
  ELSE NULL
END;

-- Step 3: Recreate constraint with canonical set
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_year_of_study_check
  CHECK (year_of_study IN ('foundation', 'year1', 'year2', 'year3') OR year_of_study IS NULL);

COMMIT;
