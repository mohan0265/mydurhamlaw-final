-- 2025-12-19: Add trial guard fields to profiles
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ever_used boolean DEFAULT false;

-- If trial_started_at is null but created_at exists and row is recent, keep null (API will compute)
UPDATE public.profiles
  SET trial_ever_used = true
  WHERE trial_started_at IS NOT NULL;

COMMIT;
