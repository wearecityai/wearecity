-- Update embeddings dimension to match Gemini text-embedding-004 (768)
-- Drop vector index if exists
drop index if exists documents_embedding_idx;

-- Alter column type to vector(768)
alter table public.documents
  alter column embedding type vector(768);

-- Recreate IVFFLAT index for cosine similarity
create index if not exists documents_embedding_idx on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);


