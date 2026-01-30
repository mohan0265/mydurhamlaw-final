-- Create table for storing AI analysis of news articles
create table if not exists public.news_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  article_title text not null,
  article_url text,
  article_source text,
  original_text text, -- The text content analyzed
  ai_analysis jsonb not null default '{}'::jsonb, -- Stores summary, modules, essay_angles, etc.
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table public.news_analyses enable row level security;

create policy "Users can view their own news analyses"
  on public.news_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own news analyses"
  on public.news_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own news analyses"
  on public.news_analyses for delete
  using (auth.uid() = user_id);

-- Add simple index
create index if not exists news_analyses_user_id_idx on public.news_analyses(user_id);
