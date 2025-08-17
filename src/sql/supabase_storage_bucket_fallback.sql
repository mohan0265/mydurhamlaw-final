
-- supabase_storage_bucket_fallback.sql
-- Fix for environments where storage.create_bucket() is unavailable or signature differs.
-- Creates the lounge_uploads bucket via direct insert and sets sane policies.

-- 1) Create bucket by insert (id, name, public)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'lounge_uploads') then
    insert into storage.buckets (id, name, public)
    values ('lounge_uploads', 'lounge_uploads', true);
  end if;
end $$;

-- 2) Policies: public read, owner-only write/update/delete
drop policy if exists "lounge_uploads_read" on storage.objects;
create policy "lounge_uploads_read"
on storage.objects for select
using (bucket_id = 'lounge_uploads');

drop policy if exists "lounge_uploads_write_own" on storage.objects;
create policy "lounge_uploads_write_own"
on storage.objects for insert
with check (bucket_id = 'lounge_uploads' and owner = auth.uid());

drop policy if exists "lounge_uploads_update_own" on storage.objects;
create policy "lounge_uploads_update_own"
on storage.objects for update
using (bucket_id = 'lounge_uploads' and owner = auth.uid());

drop policy if exists "lounge_uploads_delete_own" on storage.objects;
create policy "lounge_uploads_delete_own"
on storage.objects for delete
using (bucket_id = 'lounge_uploads' and owner = auth.uid());
