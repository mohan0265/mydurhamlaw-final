-- AWY push subscriptions and signaling tables
-- Required for AWY widget functionality

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select using (auth.uid() = user_id);

create policy "Users can upsert own push subscriptions"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

-- AWY signaling table for WebRTC peer connections
create table if not exists public.awy_signals (
  id bigserial primary key,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_awy_signals_inbox on public.awy_signals(to_user_id, created_at);

alter table public.awy_signals enable row level security;

create policy "Users can fetch signals sent to them"
  on public.awy_signals for select using (auth.uid() = to_user_id);

create policy "Users can insert signals they send"
  on public.awy_signals for insert with check (auth.uid() = from_user_id);

-- Cleanup function for old signals
create or replace function public.cleanup_old_awy_signals(days_to_keep integer default 7)
returns integer language plpgsql security definer as $$
declare deleted_count integer;
begin
  with deleted as (
    delete from public.awy_signals
    where created_at < now() - (interval '1 day' * days_to_keep)
    returning id
  )
  select count(*) into deleted_count from deleted;
  return deleted_count;
end;
$$;

