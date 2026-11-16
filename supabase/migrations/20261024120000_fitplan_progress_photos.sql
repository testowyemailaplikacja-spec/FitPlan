insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fitplan-progress','fitplan-progress',false,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

do $$
begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='fitplan_progress_owner_select') then
    create policy fitplan_progress_owner_select on storage.objects for select to authenticated
    using(bucket_id='fitplan-progress' and split_part(name,'/',1)=(select auth.uid())::text);
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='fitplan_progress_owner_insert') then
    create policy fitplan_progress_owner_insert on storage.objects for insert to authenticated
    with check(bucket_id='fitplan-progress' and split_part(name,'/',1)=(select auth.uid())::text);
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='fitplan_progress_owner_update') then
    create policy fitplan_progress_owner_update on storage.objects for update to authenticated
    using(bucket_id='fitplan-progress' and split_part(name,'/',1)=(select auth.uid())::text)
    with check(bucket_id='fitplan-progress' and split_part(name,'/',1)=(select auth.uid())::text);
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='fitplan_progress_owner_delete') then
    create policy fitplan_progress_owner_delete on storage.objects for delete to authenticated
    using(bucket_id='fitplan-progress' and split_part(name,'/',1)=(select auth.uid())::text);
  end if;
end $$;
