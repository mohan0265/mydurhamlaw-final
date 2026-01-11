-- Backfill trial_ends_at for existing users
-- This migration sets trial_ends_at for any users who don't have it

-- Set trial_ends_at for existing trial users (14 days from now)
UPDATE public.profiles
SET trial_ends_at = NOW() + INTERVAL '14 days'
WHERE trial_ends_at IS NULL 
  AND subscription_status IS NULL OR subscription_status = 'trial';

-- Also set trial_started_at if missing
UPDATE public.profiles
SET trial_started_at = created_at
WHERE trial_started_at IS NULL
  AND trial_ends_at IS NOT NULL;

-- Set subscription_status to 'trial' for users in trial
UPDATE public.profiles
SET subscription_status = 'trial'
WHERE subscription_status IS NULL
  AND trial_ends_at IS NOT NULL;
