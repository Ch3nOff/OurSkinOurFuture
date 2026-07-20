-- OurSkinOurFuture — Supabase schema
-- Run this once in your project's SQL Editor (supabase.com/dashboard/project/_/sql/new)

-- One row per completed scan. concern_scores and zone_scores store the same
-- shape the frontend already works with, so no transformation layer is needed
-- between the database and the UI.
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  concern_scores jsonb not null,
  zone_scores jsonb not null,
  recommendation_text text,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_id_created_at_idx
  on public.scans (user_id, created_at desc);

-- Row Level Security: a user can only ever see or modify their own scans.
-- Without this, anyone with the anon key could read every user's scan history.
alter table public.scans enable row level security;

create policy "Users can view their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- Storage bucket for scan photos. Public read (so <img> tags work without
-- signed URLs), but write access is still gated by the policies below —
-- a user can only upload into a folder matching their own user id.
insert into storage.buckets (id, name, public)
values ('scan-photos', 'scan-photos', true)
on conflict (id) do nothing;

create policy "Users can upload their own scan photos"
  on storage.objects for insert
  with check (
    bucket_id = 'scan-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Scan photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'scan-photos');

create policy "Users can delete their own scan photos"
  on storage.objects for delete
  using (
    bucket_id = 'scan-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
