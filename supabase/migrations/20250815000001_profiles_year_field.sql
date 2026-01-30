-- Ensure profiles table has a year field (1..4)
alter table profiles add column if not exists current_year int check (current_year between 1 and 4);