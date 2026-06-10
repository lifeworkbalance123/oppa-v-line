-- Oppa V-Line: Bonus PDF guides (Supabase Storage + pdf_library table)
-- Run in Supabase Dashboard → SQL Editor

-- 1) Table metadata
create table if not exists public.pdf_library (
  id text primary key,
  title text not null,
  storage_path text not null,
  is_active boolean not null default false,
  uploaded_at timestamptz not null default now(),
  file_size bigint
);

-- 2) Row Level Security
alter table public.pdf_library enable row level security;

drop policy if exists "Public read active PDF metadata" on public.pdf_library;
create policy "Public read active PDF metadata"
  on public.pdf_library
  for select
  using (is_active = true);

drop policy if exists "Authenticated manage PDF metadata" on public.pdf_library;
create policy "Authenticated manage PDF metadata"
  on public.pdf_library
  for all
  to authenticated
  using (true)
  with check (true);

-- 3) Storage bucket (create in Dashboard if this insert fails)
-- Storage → New bucket → name: bonus_guides → Public bucket: ON
insert into storage.buckets (id, name, public)
values ('bonus_guides', 'bonus_guides', true)
on conflict (id) do update set public = true;

-- 4) Storage policies
drop policy if exists "Public read bonus guides" on storage.objects;
create policy "Public read bonus guides"
  on storage.objects
  for select
  using (bucket_id = 'bonus_guides');

drop policy if exists "Authenticated upload bonus guides" on storage.objects;
create policy "Authenticated upload bonus guides"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'bonus_guides');

drop policy if exists "Authenticated update bonus guides" on storage.objects;
create policy "Authenticated update bonus guides"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'bonus_guides')
  with check (bucket_id = 'bonus_guides');

drop policy if exists "Authenticated delete bonus guides" on storage.objects;
create policy "Authenticated delete bonus guides"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'bonus_guides');
