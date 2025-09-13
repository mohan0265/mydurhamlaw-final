-- Trial Personas Migration
-- Enables 30-day preview of other academic years

-- Create trial personas table
create table if not exists public.trial_personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_group text not null check (year_group in ('foundation','year1','year2','year3')),
  created_at timestamptz not null default now()
);

-- Index for performance
create index on public.trial_personas(user_id);

-- Add trial columns to profiles if not present
alter table public.profiles
  add column if not exists primary_year text
    check (primary_year in ('foundation','year1','year2','year3')),
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_expires_at timestamptz;

-- Enable RLS for trial_personas
alter table public.trial_personas enable row level security;

-- Create policy for trial personas (owner-only)
create policy "trial personas are owner-only"
on public.trial_personas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create AI usage logs table for ethics layer if not exists
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  model_used text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  sources jsonb not null default '[]'::jsonb,
  assistance_level text check (assistance_level in ('L1_SELF','L2_GUIDED','L3_COACH')),
  created_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS for ai_usage_logs
alter table public.ai_usage_logs enable row level security;

-- Create policy for ai_usage_logs (owner-only)
create policy "ai usage logs are owner-only"
on public.ai_usage_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Index for performance on ai_usage_logs
create index on public.ai_usage_logs(user_id);
create index on public.ai_usage_logs(created_at);

-- Function to initialize trial for new users
create or replace function public.initialize_trial_for_user(p_user_id uuid, p_primary_year text)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set 
    primary_year = p_primary_year,
    trial_started_at = now(),
    trial_expires_at = now() + interval '30 days'
  where id = p_user_id
    and primary_year is null; -- Only set if not already set
end;
$$;