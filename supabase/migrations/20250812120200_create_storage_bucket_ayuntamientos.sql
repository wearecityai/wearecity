-- Create storage bucket for ayuntamientos if not exists
insert into storage.buckets (id, name, public)
select 'ayuntamientos', 'ayuntamientos', true
where not exists (
  select 1 from storage.buckets where id = 'ayuntamientos'
);


