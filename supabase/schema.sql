-- ==========================================================
-- PrepSensei Supabase Database Schema
-- Run this script in your Supabase project's SQL Editor.
-- ==========================================================

-- 1. Enable UUID generator
create extension if not exists "uuid-ossp";

-- 2. Create public.users table (mirrors auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create public.interviews table
create table if not exists public.interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  role text not null,
  type text not null,
  level text not null,
  techstack text[] default '{}',
  questions jsonb default '[]'::jsonb,
  finalized boolean default false,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.interviews enable row level security;

-- Policies for public.users
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Policies for public.interviews
create policy "Users can view their own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interviews"
  on public.interviews for update
  using (auth.uid() = user_id);

-- 5. Auto-sync trigger from auth.users (Google OAuth & Email signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do update
  set
    name = coalesce(excluded.name, public.users.name),
    email = coalesce(excluded.email, public.users.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
