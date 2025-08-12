-- Storage security: allow admins to upload/read from ayuntamientos bucket

-- Create policy for ayuntamientos bucket if not exists
do $$ begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'ayuntamientos_admin_rw') then
    drop policy "ayuntamientos_admin_rw" on storage.objects;
  end if;
end $$;

create policy "ayuntamientos_admin_rw"
on storage.objects for all
to authenticated
using (
  bucket_id = 'ayuntamientos' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'
  )
)
with check (
  bucket_id = 'ayuntamientos' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'
  )
);


