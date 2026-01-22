-- Durmah Voice Persistence Schema for Assignment Hub

-- 1. Assignment Sessions Table
create table if not exists public.assignment_sessions (
    id uuid primary key default gen_random_uuid(),
    assignment_id uuid references public.assignments(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    started_at timestamptz default now(),
    ended_at timestamptz,
    duration_seconds integer default 0,
    title text, -- e.g. "Brainstorming for Stage 1"
    summary text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Session Messages (Transcript Log)
create table if not exists public.assignment_session_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.assignment_sessions(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text check (role in ('user', 'assistant', 'system')) not null,
    content text,
    audio_url text, -- valid if we store audio blobs later
    created_at timestamptz default now(),
    
    -- Metadata for analysis
    sentiment text,
    tokens_used integer
);

-- 3. RLS Policies
alter table public.assignment_sessions enable row level security;
alter table public.assignment_session_messages enable row level security;

-- Users can only see/edit their own sessions
create policy "Users can view own assignment sessions"
    on public.assignment_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert own assignment sessions"
    on public.assignment_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own assignment sessions"
    on public.assignment_sessions for update
    using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view own session messages"
    on public.assignment_session_messages for select
    using (auth.uid() = user_id);

create policy "Users can insert own session messages"
    on public.assignment_session_messages for insert
    with check (auth.uid() = user_id);

-- 4. Indexes
create index if not exists idx_assignment_sessions_user on public.assignment_sessions(user_id);
create index if not exists idx_assignment_sessions_assignment on public.assignment_sessions(assignment_id);
create index if not exists idx_session_msgs_session on public.assignment_session_messages(session_id);
