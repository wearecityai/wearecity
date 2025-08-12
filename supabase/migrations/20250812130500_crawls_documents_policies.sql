-- Enable RLS and create policies for admin-only access via profiles.role = 'administrativo'

-- Ensure RLS is enabled
alter table if exists public.crawls enable row level security;
alter table if exists public.documents enable row level security;

-- Drop existing policies if re-running
do $$ begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crawls' and policyname = 'crawls_admin_select') then
    drop policy crawls_admin_select on public.crawls;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crawls' and policyname = 'crawls_admin_insert') then
    drop policy crawls_admin_insert on public.crawls;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crawls' and policyname = 'crawls_admin_update') then
    drop policy crawls_admin_update on public.crawls;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'documents_admin_select') then
    drop policy documents_admin_select on public.documents;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'documents_admin_insert') then
    drop policy documents_admin_insert on public.documents;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'documents_admin_update') then
    drop policy documents_admin_update on public.documents;
  end if;
end $$;

-- Helper condition: is current user administrative?
-- We inline the check in each policy to avoid creating SQL functions.

-- Crawls policies
create policy crawls_admin_select on public.crawls
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );

create policy crawls_admin_insert on public.crawls
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );

create policy crawls_admin_update on public.crawls
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );

-- Documents policies (admin only)
create policy documents_admin_select on public.documents
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );

create policy documents_admin_insert on public.documents
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );

create policy documents_admin_update on public.documents
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrativo'
    )
  );


