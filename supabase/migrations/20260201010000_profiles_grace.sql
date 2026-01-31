-- Add grace_until to profiles for easy entitlement checks
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS grace_until TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;
