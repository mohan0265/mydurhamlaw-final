
-- supabase_migration_premier_lounge.sql
-- Premier Student Lounge: tables, RLS, storage, realtime, RPCs, indexes
-- Safe to run multiple times (CREATE IF NOT EXISTS / ALTER IF NOT EXISTS where possible).

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Profiles hardening: add is_banned / is_admin if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='is_banned'
  ) then
    alter table public.profiles add column is_banned boolean default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='is_admin'
  ) then
    alter table public.profiles add column is_admin boolean default false;
  end if;
end $$;

-- Core tables
create table if not exists public.lounge_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  body text not null check (char_length(body) <= 3000),
  image_url text null,
  audio_url text null,
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  is_shadow_muted boolean not null default false,
  automod_flag boolean not null default false
);

create table if not exists public.lounge_sparks (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  text text not null check (char_length(text) <= 140),
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  is_shadow_muted boolean not null default false,
  automod_flag boolean not null default false
);

create table if not exists public.lounge_reactions (
  post_id uuid not null,
  user_id uuid not null,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table if not exists public.lounge_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post','spark')),
  target_id uuid not null,
  reporter_id uuid not null,
  reason text not null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.lounge_blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists public.lounge_user_settings (
  user_id uuid primary key,
  accepted_rules_at timestamptz null,
  last_seen_at timestamptz not null default now(),
  rate_window_started_at timestamptz null,
  posts_in_window int not null default 0,
  sparks_in_window int not null default 0
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  action text not null check (action in ('hide','ban_user','unban_user','shadow_mute','unshadow_mute')),
  actor_id uuid not null,
  reason text null,
  created_at timestamptz not null default now()
);

create table if not exists public.automod_incidents (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  author_id uuid not null,
  matched_rule text not null,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_lounge_posts_created_at on public.lounge_posts (created_at desc);
create index if not exists idx_lounge_posts_author on public.lounge_posts (author_id);
create index if not exists idx_lounge_sparks_created_at on public.lounge_sparks (created_at desc);
create index if not exists idx_lounge_sparks_author on public.lounge_sparks (author_id);
create index if not exists idx_lounge_reactions_post on public.lounge_reactions (post_id);
create index if not exists idx_lounge_blocks_blocker on public.lounge_blocks (blocker_id);
create index if not exists idx_lounge_blocks_blocked on public.lounge_blocks (blocked_id);

-- RLS enable
alter table public.lounge_posts enable row level security;
alter table public.lounge_sparks enable row level security;
alter table public.lounge_reactions enable row level security;
alter table public.lounge_reports enable row level security;
alter table public.lounge_blocks enable row level security;
alter table public.lounge_user_settings enable row level security;

-- Basic auth helper to detect service role
create or replace function public.is_service_role() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt()->>'role') = 'service_role', false);
$$;

-- Policies: lounge_posts
drop policy if exists "posts_select" on public.lounge_posts;
create policy "posts_select" on public.lounge_posts
for select using (
  auth.uid() is not null
  and is_hidden = false
);

drop policy if exists "posts_insert" on public.lounge_posts;
create policy "posts_insert" on public.lounge_posts
for insert with check (
  auth.uid() is not null and author_id = auth.uid()
);

drop policy if exists "posts_update" on public.lounge_posts;
create policy "posts_update" on public.lounge_posts
for update using (
  auth.uid() is not null and (author_id = auth.uid() or public.is_service_role())
);

drop policy if exists "posts_delete" on public.lounge_posts;
create policy "posts_delete" on public.lounge_posts
for delete using (
  auth.uid() is not null and (author_id = auth.uid() or public.is_service_role())
);

-- Policies: lounge_sparks
drop policy if exists "sparks_select" on public.lounge_sparks;
create policy "sparks_select" on public.lounge_sparks
for select using (
  auth.uid() is not null
  and is_hidden = false
);

drop policy if exists "sparks_insert" on public.lounge_sparks;
create policy "sparks_insert" on public.lounge_sparks
for insert with check (
  auth.uid() is not null and author_id = auth.uid()
);

drop policy if exists "sparks_update" on public.lounge_sparks;
create policy "sparks_update" on public.lounge_sparks
for update using (
  auth.uid() is not null and (author_id = auth.uid() or public.is_service_role())
);

drop policy if exists "sparks_delete" on public.lounge_sparks;
create policy "sparks_delete" on public.lounge_sparks
for delete using (
  auth.uid() is not null and (author_id = auth.uid() or public.is_service_role())
);

-- Policies: reactions
drop policy if exists "reactions_select" on public.lounge_reactions;
create policy "reactions_select" on public.lounge_reactions
for select using (auth.uid() is not null);

drop policy if exists "reactions_insert" on public.lounge_reactions;
create policy "reactions_insert" on public.lounge_reactions
for insert with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "reactions_delete" on public.lounge_reactions;
create policy "reactions_delete" on public.lounge_reactions
for delete using (auth.uid() is not null and user_id = auth.uid());

-- Policies: reports
drop policy if exists "reports_insert" on public.lounge_reports;
create policy "reports_insert" on public.lounge_reports
for insert with check (auth.uid() is not null and reporter_id = auth.uid());

drop policy if exists "reports_select" on public.lounge_reports;
create policy "reports_select" on public.lounge_reports
for select using (public.is_service_role());

-- Policies: blocks
drop policy if exists "blocks_select" on public.lounge_blocks;
create policy "blocks_select" on public.lounge_blocks
for select using (auth.uid() is not null and blocker_id = auth.uid());

drop policy if exists "blocks_insert" on public.lounge_blocks;
create policy "blocks_insert" on public.lounge_blocks
for insert with check (auth.uid() is not null and blocker_id = auth.uid());

drop policy if exists "blocks_delete" on public.lounge_blocks;
create policy "blocks_delete" on public.lounge_blocks
for delete using (auth.uid() is not null and blocker_id = auth.uid());

-- Policies: user settings
drop policy if exists "settings_select" on public.lounge_user_settings;
create policy "settings_select" on public.lounge_user_settings
for select using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "settings_upsert" on public.lounge_user_settings;
create policy "settings_upsert" on public.lounge_user_settings
for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy if not exists "settings_update" on public.lounge_user_settings
for update using (auth.uid() is not null and user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table if not exists public.lounge_posts;
alter publication supabase_realtime add table if not exists public.lounge_sparks;
alter publication supabase_realtime add table if not exists public.lounge_reactions;

-- Storage bucket and policies
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'lounge_uploads') then
    perform storage.create_bucket('lounge_uploads', public => true);
  end if;
end $$;

-- Allow public read in this bucket
create policy if not exists "lounge_uploads_read"
on storage.objects for select
using (bucket_id = 'lounge_uploads');

-- Allow authenticated users to upload to this bucket
create policy if not exists "lounge_uploads_write_own"
on storage.objects for insert
with check (
  bucket_id = 'lounge_uploads' and auth.uid() = owner
);

-- === Helper functions ===

-- Check if a user is banned
create or replace function public.is_user_banned(u uuid)
returns boolean language sql stable as $$
  select coalesce((select is_banned from public.profiles where id = u), false);
$$;

-- Accept lounge rules
create or replace function public.accept_lounge_rules()
returns void
language plpgsql security definer
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.lounge_user_settings (user_id, accepted_rules_at)
  values (uid, now())
  on conflict (user_id) do update set accepted_rules_at = excluded.accepted_rules_at;
end $$;

-- Block / Unblock
create or replace function public.block_user(p_blocked_id uuid)
returns void language plpgsql security definer as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if uid = p_blocked_id then raise exception 'cannot block self'; end if;
  insert into public.lounge_blocks(blocker_id, blocked_id)
  values (uid, p_blocked_id)
  on conflict do nothing;
end $$;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void language plpgsql security definer as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  delete from public.lounge_blocks where blocker_id = uid and blocked_id = p_blocked_id;
end $$;

-- Automod (simple keyword list, extend later)
create or replace function public.automod_scan_text(p_text text)
returns text language plpgsql stable as $$
declare
  bad text[] := array[
    'idiot','stupid','hate you','kill yourself','suicide','racist','sexist',
    'homophobic','bully','slur','harass','doxx','dox','threat'
  ];
  k text;
begin
  if p_text is null then return null; end if;
  for k in select unnest(bad) loop
    if position(lower(k) in lower(p_text)) > 0 then
      return k;
    end if;
  end loop;
  return null;
end $$;

-- Rate limit helpers inside post creation
create or replace function public.create_lounge_post(
  p_body text,
  p_image_url text,
  p_audio_url text
) returns uuid
language plpgsql security definer
as $$
declare
  uid uuid := auth.uid();
  matched text;
  window_start timestamptz;
  posts_hour int;
  posts_day int;
  new_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if public.is_user_banned(uid) then raise exception 'user is banned'; end if;

  -- Must accept rules first
  if not exists (select 1 from public.lounge_user_settings where user_id=uid and accepted_rules_at is not null) then
    raise exception 'rules not accepted';
  end if;

  -- Rate limits: hour and day
  select count(*) into posts_hour from public.lounge_posts
   where author_id = uid and created_at > now() - interval '1 hour';
  if posts_hour >= 6 then raise exception 'rate limit: too many posts this hour'; end if;

  select count(*) into posts_day from public.lounge_posts
   where author_id = uid and created_at > now() - interval '1 day';
  if posts_day >= 40 then raise exception 'rate limit: too many posts today'; end if;

  matched := public.automod_scan_text(p_body);

  insert into public.lounge_posts(author_id, body, image_url, audio_url, automod_flag, is_shadow_muted)
  values (
    uid, p_body, p_image_url, p_audio_url,
    (matched is not null),
    (matched is not null)
  )
  returning id into new_id;

  if matched is not null then
    insert into public.automod_incidents(target_type, target_id, author_id, matched_rule)
    values ('post', new_id, uid, matched);
  end if;

  return new_id;
end $$;

create or replace function public.create_lounge_spark(p_text text)
returns uuid language plpgsql security definer
as $$
declare
  uid uuid := auth.uid();
  matched text;
  sparks_hour int;
  sparks_day int;
  new_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if public.is_user_banned(uid) then raise exception 'user is banned'; end if;

  if not exists (select 1 from public.lounge_user_settings where user_id=uid and accepted_rules_at is not null) then
    raise exception 'rules not accepted';
  end if;

  select count(*) into sparks_hour from public.lounge_sparks
   where author_id = uid and created_at > now() - interval '1 hour';
  if sparks_hour >= 10 then raise exception 'rate limit: too many sparks this hour'; end if;

  select count(*) into sparks_day from public.lounge_sparks
   where author_id = uid and created_at > now() - interval '1 day';
  if sparks_day >= 80 then raise exception 'rate limit: too many sparks today'; end if;

  matched := public.automod_scan_text(p_text);

  insert into public.lounge_sparks(author_id, text, automod_flag, is_shadow_muted)
  values (uid, p_text, (matched is not null), (matched is not null))
  returning id into new_id;

  if matched is not null then
    insert into public.automod_incidents(target_type, target_id, author_id, matched_rule)
    values ('spark', new_id, uid, matched);
  end if;

  return new_id;
end $$;

-- Hide items (author or service role only enforced by policies)
create or replace function public.hide_lounge_post(p_id uuid)
returns void language plpgsql security definer as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  update public.lounge_posts set is_hidden = true where id = p_id;
end $$;

create or replace function public.hide_lounge_spark(p_id uuid)
returns void language plpgsql security definer as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  update public.lounge_sparks set is_hidden = true where id = p_id;
end $$;

-- Admin: ban / unban / shadow mute
create or replace function public.admin_ban_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_service_role() then
    raise exception 'admin only';
  end if;
  update public.profiles set is_banned = true where id = p_user_id;
  insert into public.moderation_actions(target_type, target_id, action, actor_id, reason)
  values ('user', p_user_id, 'ban_user', '00000000-0000-0000-0000-000000000000', 'service');
end $$;

create or replace function public.admin_unban_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_service_role() then
    raise exception 'admin only';
  end if;
  update public.profiles set is_banned = false where id = p_user_id;
  insert into public.moderation_actions(target_type, target_id, action, actor_id, reason)
  values ('user', p_user_id, 'unban_user', '00000000-0000-0000-0000-000000000000', 'service');
end $$;

create or replace function public.shadow_mute_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_service_role() then
    raise exception 'admin only';
  end if;
  update public.lounge_posts set is_shadow_muted = true where author_id = p_user_id;
  update public.lounge_sparks set is_shadow_muted = true where author_id = p_user_id;
  insert into public.moderation_actions(target_type, target_id, action, actor_id, reason)
  values ('user', p_user_id, 'shadow_mute', '00000000-0000-0000-0000-000000000000', 'service');
end $$;

create or replace function public.unshadow_mute_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_service_role() then
    raise exception 'admin only';
  end if;
  update public.lounge_posts set is_shadow_muted = false where author_id = p_user_id;
  update public.lounge_sparks set is_shadow_muted = false where author_id = p_user_id;
  insert into public.moderation_actions(target_type, target_id, action, actor_id, reason)
  values ('user', p_user_id, 'unshadow_mute', '00000000-0000-0000-0000-000000000000', 'service');
end $$;

-- Pagination RPCs that apply block logic and hidden flags
create or replace function public.get_lounge_posts_page(p_limit int, p_cursor timestamptz)
returns table (
  id uuid,
  author_id uuid,
  author_display_name text,
  body text,
  image_url text,
  audio_url text,
  created_at timestamptz,
  is_shadow_muted boolean,
  automod_flag boolean
) language sql stable security definer as $$
  with me as (select auth.uid() as uid)
  select p.id,
         p.author_id,
         pr.display_name as author_display_name,
         p.body,
         p.image_url,
         p.audio_url,
         p.created_at,
         p.is_shadow_muted,
         p.automod_flag
  from public.lounge_posts p
  join public.profiles pr on pr.id = p.author_id
  cross join me
  where (p.created_at < coalesce(p_cursor, now()) )
    and p.is_hidden = false
    and not exists (
      select 1 from public.lounge_blocks b
      where (b.blocker_id = me.uid and b.blocked_id = p.author_id)
         or (b.blocker_id = p.author_id and b.blocked_id = me.uid)
    )
  order by p.created_at desc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_lounge_sparks_recent(p_limit int)
returns table (
  id uuid,
  author_id uuid,
  author_display_name text,
  text text,
  created_at timestamptz,
  is_shadow_muted boolean,
  automod_flag boolean
) language sql stable security definer as $$
  with me as (select auth.uid() as uid)
  select s.id,
         s.author_id,
         pr.display_name as author_display_name,
         s.text,
         s.created_at,
         s.is_shadow_muted,
         s.automod_flag
  from public.lounge_sparks s
  join public.profiles pr on pr.id = s.author_id
  cross join me
  where s.is_hidden = false
    and not exists (
      select 1 from public.lounge_blocks b
      where (b.blocker_id = me.uid and b.blocked_id = s.author_id)
         or (b.blocker_id = s.author_id and b.blocked_id = me.uid)
    )
  order by s.created_at desc
  limit greatest(p_limit, 1);
$$;
