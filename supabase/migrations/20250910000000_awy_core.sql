-- =========================
-- AWY CORE (connections, presence, waves, call links) + Loved-one role
-- =========================

-- 1) Role on profiles
alter table public.profiles
  add column if not exists role text
  check (role in ('student','loved_one','admin'))
  default 'student';

-- Update handle_new_user to respect metadata.role if provided
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (
      id, year_group, agreed_to_terms, display_name, avatar_url, role
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'year_group','year1'),
      coalesce((new.raw_user_meta_data->>'agreed_to_terms')::boolean, true),
      coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
      coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
      coalesce(new.raw_user_meta_data->>'role','student')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 2) AWY status enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'awy_status') then
    create type public.awy_status as enum ('online','offline','busy');
  end if;
end $$;

-- 3) Connections (student ↔ loved one)
create table if not exists public.awy_connections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  loved_one_id uuid references auth.users(id) on delete set null,
  loved_email text not null,
  loved_is_user boolean generated always as (loved_one_id is not null) stored,
  relationship text not null,
  status text not null default 'pending' check (status in ('pending','active','blocked')),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (student_id, loved_email)
);
alter table public.awy_connections enable row level security;

create policy "own or counterpart can read connections"
  on public.awy_connections for select
  using (
    auth.uid() = student_id or auth.uid() = loved_one_id
  );

create policy "student can insert connection"
  on public.awy_connections for insert
  with check (auth.uid() = student_id);

create policy "participants can update connection"
  on public.awy_connections for update
  using (auth.uid() = student_id or auth.uid() = loved_one_id);

-- 4) Presence
create table if not exists public.awy_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status public.awy_status not null default 'online',
  heartbeat_at timestamptz not null default now()
);
alter table public.awy_presence enable row level security;

-- Only self can write; self or connected users can read
create policy "self can upsert presence"
  on public.awy_presence for insert
  with check (auth.uid() = user_id);
create policy "self can update presence"
  on public.awy_presence for update
  using (auth.uid() = user_id);

create policy "connected users can read presence"
  on public.awy_presence for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.awy_connections c
      where c.status = 'active'
        and (
          (c.student_id = auth.uid() and c.loved_one_id = awy_presence.user_id)
          or
          (c.loved_one_id = auth.uid() and c.student_id = awy_presence.user_id)
        )
    )
  );

-- 5) Waves (gentle pings)
create table if not exists public.awy_waves (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  read boolean not null default false
);
alter table public.awy_waves enable row level security;

create policy "sender can insert wave"
  on public.awy_waves for insert
  with check (auth.uid() = sender_id);

create policy "participants can read waves"
  on public.awy_waves for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "receiver can mark read"
  on public.awy_waves for update
  using (auth.uid() = receiver_id);

-- 6) Per-connection call links (owner controls)
create table if not exists public.awy_call_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  loved_one_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, loved_one_id)
);
alter table public.awy_call_links enable row level security;

create policy "owner can upsert call link"
  on public.awy_call_links for insert
  with check (auth.uid() = owner_id);
create policy "owner can update call link"
  on public.awy_call_links for update
  using (auth.uid() = owner_id);

create policy "participants can read call link"
  on public.awy_call_links for select
  using (
    auth.uid() = owner_id or auth.uid() = loved_one_id
  );

-- 7) RPC: heartbeat
create or replace function public.awy_heartbeat(p_status public.awy_status default 'online')
returns void language sql as $$
  insert into public.awy_presence (user_id, status, heartbeat_at)
  values (auth.uid(), p_status, now())
  on conflict (user_id)
  do update set status = excluded.status, heartbeat_at = now();
$$;

-- 8) RPC: link loved one by email.
-- If the email belongs to an existing user, create/activate connection.
-- If not, create a pending connection and raise 'user_not_found' so client can invite.
create or replace function public.awy_link_loved_one_by_email(p_email text, p_relationship text)
returns void language plpgsql as $$
declare
  me uuid := auth.uid();
  tgt uuid;
  my_email text;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select email into my_email from auth.users where id = me;
  if lower(p_email) = lower(my_email) then
    raise exception 'cannot_link_self';
  end if;

  select id into tgt from auth.users where lower(email) = lower(p_email);

  if tgt is not null then
    insert into public.awy_connections (student_id, loved_one_id, loved_email, relationship, status, is_visible)
    values (me, tgt, p_email, p_relationship, 'active', true)
    on conflict (student_id, loved_email)
    do update set loved_one_id = excluded.loved_one_id, relationship = excluded.relationship, status = 'active';
    return;
  else
    -- create pending record now; client will follow up with /api/awy/invite
    insert into public.awy_connections (student_id, loved_one_id, loved_email, relationship, status, is_visible)
    values (me, null, p_email, p_relationship, 'pending', true)
    on conflict (student_id, loved_email)
    do update set relationship = excluded.relationship, status = 'pending';
    raise exception 'user_not_found';
  end if;
end;
$$;
