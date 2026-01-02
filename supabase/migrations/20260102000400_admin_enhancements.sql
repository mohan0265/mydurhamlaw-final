-- Migration: Admin Dashboard Enhancements
-- Created: 2026-01-02
-- Purpose: Add fields for test account management, subscription control, and admin notes

BEGIN;

-- Add new columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Add constraint for subscription_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_subscription_status_check 
    CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled'));
  END IF;
END $$;

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_test 
  ON profiles(is_test_account);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
  ON profiles(subscription_status);

-- Add trial_ends_at if it doesn't exist (for manual trial extension)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

COMMIT;
