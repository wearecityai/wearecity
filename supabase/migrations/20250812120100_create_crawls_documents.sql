-- Create enum for crawl status
do $$ begin
  if not exists (select 1 from pg_type where typname = 'crawl_status') then
    create type crawl_status as enum ('pending','processing','completed','error');
  end if;
end $$;

-- Crawls table
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

create index if not exists crawls_status_idx on public.crawls(status);
create index if not exists crawls_created_at_idx on public.crawls(created_at desc);

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  crawl_id uuid not null references public.crawls(id) on delete cascade,
  url text not null,
  title text,
  doc_type text not null check (doc_type in ('html','pdf')),
  storage_path text not null,
  content text,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_crawl_id_idx on public.documents(crawl_id);
create index if not exists documents_doc_type_idx on public.documents(doc_type);
-- Vector index for similarity search (IVFFLAT). Requires setting lists; default 100 can be tuned later.
create index if not exists documents_embedding_idx on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Trigger to update updated_at
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


