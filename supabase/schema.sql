create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  country text not null,
  note text,
  lat double precision not null,
  lon double precision not null,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Users can view their contacts"
  on public.contacts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their contacts"
  on public.contacts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their contacts"
  on public.contacts
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their contacts"
  on public.contacts
  for delete
  using (auth.uid() = user_id);
