-- supabase/migrations/20260124190000_create_user_voice_settings.sql

-- Drop existing table if it exists to ensure clean state
drop table if exists public.user_voice_settings;

create table public.user_voice_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  voice_id text not null default 'shimmer',
  delivery_style text not null default 'friendly_buddy',
  speed numeric not null default 1.0,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_voice_settings enable row level security;

-- Policies
create policy "Users can view their own voice settings" on public.user_voice_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert/update their own voice settings" on public.user_voice_settings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.user_voice_settings
for each row execute procedure public.handle_updated_at();

-- Comment for PostGraphile/API documentation
comment on table public.user_voice_settings is 'User preferences for Durmah voice, delivery style, and speech speed.';
