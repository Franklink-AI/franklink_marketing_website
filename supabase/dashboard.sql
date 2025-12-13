-- Franklink Dashboard (franklink.ai/dashboard) – minimal tables + RLS
--
-- Run this in the Supabase SQL editor (project that owns your `group_chats` data).
-- It assumes you are using Supabase Auth (auth.users) for password-based login.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Users (phone-number username + profile)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop policy if exists "Users can read their profile" on public.users;
create policy "Users can read their profile"
on public.users
for select
using (id = auth.uid());

drop policy if exists "Users can insert their profile" on public.users;
create policy "Users can insert their profile"
on public.users
for insert
with check (id = auth.uid());

drop policy if exists "Users can update their profile" on public.users;
create policy "Users can update their profile"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

-- ------------------------------------------------------------
-- Career Notes (one notebook per user)
-- ------------------------------------------------------------
create table if not exists public.career_notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.career_notes enable row level security;

drop trigger if exists career_notes_set_updated_at on public.career_notes;
create trigger career_notes_set_updated_at
before update on public.career_notes
for each row execute function public.set_updated_at();

drop policy if exists "Users can read their notes" on public.career_notes;
create policy "Users can read their notes"
on public.career_notes
for select
using (user_id = auth.uid());

drop policy if exists "Users can upsert their notes" on public.career_notes;
create policy "Users can upsert their notes"
on public.career_notes
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their notes" on public.career_notes;
create policy "Users can update their notes"
on public.career_notes
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- group_chats (expected by the Connection Graph UI)
-- ------------------------------------------------------------
-- The dashboard currently queries:
--   select * from public.group_chats where user_id = auth.uid()
-- and then tries to extract participants from columns like:
--   participants, participant_phone_numbers, members_hint, etc.
--
-- If your `group_chats` table is in `public` and has `user_id`, you likely want:
--   alter table public.group_chats enable row level security;
--   create policy "Users can read their group chats"
--     on public.group_chats for select
--     using (user_id = auth.uid());

