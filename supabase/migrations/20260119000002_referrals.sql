-- Migration: Create referral system tables
-- Date: 2026-01-19

-- 1. Create Referrals Table
create table if not exists public.referrals (
    id uuid default gen_random_uuid() primary key,
    referrer_user_id uuid references auth.users(id) on delete cascade not null,
    referred_email text not null,
    referred_email_normalized text not null,
    referred_name text,
    status text not null default 'invited' check (status in ('invited', 'joined', 'subscribed', 'reward_pending', 'reward_granted', 'expired')),
    invite_token text not null unique,
    invited_at timestamptz default now(),
    joined_user_id uuid references auth.users(id) on delete set null,
    joined_at timestamptz,
    subscribed_at timestamptz,
    reward_granted_at timestamptz
);

-- 2. Indexes
create unique index if not exists referrals_referred_email_normalized_idx on public.referrals (referred_email_normalized);
create index if not exists referrals_referrer_user_id_idx on public.referrals (referrer_user_id);
create index if not exists referrals_invite_token_idx on public.referrals (invite_token);

-- 3. RLS
alter table public.referrals enable row level security;

create policy "Users can view own referrals"
    on public.referrals for select
    using (auth.uid() = referrer_user_id);

create policy "Users can insert own referrals"
    on public.referrals for insert
    with check (auth.uid() = referrer_user_id);
    
-- (No update policy for clients; updates done via service role / backend API)

-- 4. Add trial_until to profiles (if not exists)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'trial_until') then
        alter table public.profiles add column trial_until timestamptz;
        -- Also add a stripe_customer_id if missing, just in case
        if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'stripe_customer_id') then
            alter table public.profiles add column stripe_customer_id text;
        end if;
    end if;
end $$;
