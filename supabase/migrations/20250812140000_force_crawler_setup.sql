-- Idempotent setup for crawler module (tables, storage, policies, pgvector)

-- 1) Ensure pgvector
create extension if not exists vector;

-- 2) Enum for status
do $$ begin
  if not exists (select 1 from pg_type where typname = 'crawl_status') then
    create type crawl_status as enum ('pending','processing','completed','error');
  end if;
end $$;

-- 3) Tables
create table if not exists public.crawls (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  start_url text not null,
  mode text not null check (mode in ('local','apify')),
  status crawl_status not null default 'pending',
  apify_run_id text,
  stats jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_crawls_updated_at on public.crawls;
create trigger set_crawls_updated_at
before update on public.crawls
for each row execute function public.set_updated_at();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  crawl_id uuid not null references public.crawls(id) on delete cascade,
  url text not null,
  title text,
  doc_type text not null check (doc_type in ('html','pdf')),
  storage_path text not null,
  content text,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_crawl_id_idx on public.documents(crawl_id);
create index if not exists documents_doc_type_idx on public.documents(doc_type);

-- If embedding column exists with wrong type, coerce to 768
do $$ begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'documents' and column_name = 'embedding'
  ) then
    begin
      drop index if exists documents_embedding_idx;
      alter table public.documents alter column embedding type vector(768);
    exception when others then
      -- if alter fails due to data, ensure column exists
      alter table public.documents alter column embedding type vector(768);
    end;
  else
    alter table public.documents add column embedding vector(768);
  end if;
end $$;

-- Recreate vector index
create index if not exists documents_embedding_idx on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4) Storage bucket
insert into storage.buckets (id, name, public)
select 'ayuntamientos', 'ayuntamientos', true
where not exists (select 1 from storage.buckets where id = 'ayuntamientos');

-- 5) RLS policies
alter table if exists public.crawls enable row level security;
alter table if exists public.documents enable row level security;

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

create policy crawls_admin_select on public.crawls
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'));

create policy crawls_admin_insert on public.crawls
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'));

create policy crawls_admin_update on public.crawls
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'));

do $$ begin
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'ayuntamientos_admin_rw') then
    drop policy "ayuntamientos_admin_rw" on storage.objects;
  end if;
end $$;

create policy "ayuntamientos_admin_rw" on storage.objects for all to authenticated
  using (bucket_id = 'ayuntamientos' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'))
  with check (bucket_id = 'ayuntamientos' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrativo'));


