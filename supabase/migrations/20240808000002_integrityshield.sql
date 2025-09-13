-- PROVENANCE LOGS
create table if not exists public.ai_provenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid, -- nullable: can be ad-hoc
  assistance_level text not null check (assistance_level in ('L1_SELF','L2_GUIDED','L3_COACH')),
  sources jsonb not null default '[]'::jsonb,          -- URLs, citations, library refs
  model_used text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  created_at timestamptz not null default now(),
  ai_disclosure_required boolean not null default true, -- if output influences submission
  originality_score numeric(5,2),                       -- % similarity from internal checker
  notes text
);

alter table public.ai_provenance enable row level security;

create policy "own rows" on public.ai_provenance
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- USER PREFERENCES / LOCKS
alter table public.profiles
  add column if not exists ai_help_default text
    check (ai_help_default in ('L1_SELF','L2_GUIDED','L3_COACH')) default 'L1_SELF',
  add column if not exists integrity_acknowledged boolean not null default false,
  add column if not exists ai_disclosure_consent boolean not null default true; -- can show disclosure banner

-- PREVENT SUBMISSION WITHOUT ACK
create or replace function public.block_submit_without_ack()
returns trigger language plpgsql as $
begin
  if (new.submitted = true) then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.user_id and p.integrity_acknowledged = true
    ) then
      raise exception 'Please acknowledge the Academic Integrity Pledge before submitting.';
    end if;
  end if;
  return new;
end; $;

-- Sample hook on an assignments table (if present)
-- drop trigger if exists trg_block_submit_without_ack on public.assignments;
-- create trigger trg_block_submit_without_ack
-- before update on public.assignments
-- for each row execute function public.block_submit_without_ack();

-- Create assignments table if it doesn't exist (for testing the trigger)
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "own assignments" on public.assignments
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Apply the integrity trigger to assignments
drop trigger if exists trg_block_submit_without_ack on public.assignments;
create trigger trg_block_submit_without_ack
before update on public.assignments
for each row execute function public.block_submit_without_ack();