-- 20260119_user_access_grants.sql
-- Purpose: Temporary/extra entitlements (e.g., referral trial) that do NOT conflict with Stripe.
-- App logic should treat user as Pro if:
--   - Stripe subscription active OR
--   - EXISTS unexpired grant where grant_type='pro_trial' and revoked_at IS NULL and expires_at > now()

create table if not exists public.user_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- What access is being granted (keep extensible)
  grant_type text not null check (grant_type in ('pro_trial', 'credit', 'extension')),

  -- Where it came from
  source text not null default 'manual'
    check (source in ('referral', 'manual', 'support', 'promo')),

  -- Optional linkage to referral record (if you want to join later)
  referral_id uuid null,

  -- Timing
  starts_at timestamptz not null default now(),
  expires_at timestamptz null,      -- null means non-expiring grant (avoid for trials)
  revoked_at timestamptz null,

  -- Metadata for auditing/debugging
  notes text null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_user_access_grants_user_id
  on public.user_access_grants(user_id);

create index if not exists idx_user_access_grants_active
  on public.user_access_grants(user_id, grant_type, expires_at)
  where revoked_at is null;

-- Optional: prevent multiple simultaneous active pro trials for same user
-- (Allows expired history, blocks duplicates)
create unique index if not exists uq_one_active_pro_trial_per_user
  on public.user_access_grants(user_id, grant_type)
  where grant_type = 'pro_trial' and revoked_at is null;

-- RLS
alter table public.user_access_grants enable row level security;

-- Users can view only their own grants
create policy "user_access_grants_select_own"
  on public.user_access_grants
  for select
  using (auth.uid() = user_id);

-- Do NOT allow client insert/update/delete by default (server-only).
-- If you need to allow inserts from trusted server routes only, use service role key there.
-- (No client policies for insert/update/delete.)
