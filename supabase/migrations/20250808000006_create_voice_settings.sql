create table if not exists public.voice_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_voice_id text,
  auto_relisten boolean default true,
  mic_autorestart boolean default true
);

alter table public.voice_settings enable row level security;

create policy "Allow user to access their own voice settings" on public.voice_settings
  for all using (auth.uid() = user_id);
