-- Yaddii Marketplace — database schema
-- Run in Supabase SQL Editor (or via Supabase CLI migrations)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin', 'super')),
  free_ads_remaining integer not null default 0,
  balance numeric not null default 0 check (balance >= 0),
  balance_expires_at timestamptz,
  phone_verified boolean not null default false,
  welcome_credits_granted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'App roles. Name/phone live in auth.users.raw_user_meta_data.';

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  price numeric not null check (price >= 0),
  location text not null,
  description text,
  category_slug text not null,
  attributes jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  seller_phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'banned')),
  created_at timestamptz not null default now()
);

create index if not exists ads_status_created_at_idx on public.ads (status, created_at desc);
create index if not exists ads_user_id_idx on public.ads (user_id);
create index if not exists ads_category_slug_idx on public.ads (category_slug);

comment on column public.ads.attributes is 'Category-specific fields from categoryConfig.ts (make_id, year, etc.)';
comment on column public.ads.status is 'pending = awaiting admin; active = public; banned = rejected/hidden';

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_id uuid not null references public.ads (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, ad_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- Vehicle reference data
-- ---------------------------------------------------------------------------
create table if not exists public.makes (
  id serial primary key,
  name text not null unique
);

create table if not exists public.models (
  id serial primary key,
  name text not null,
  make_id integer not null references public.makes (id) on delete cascade
);

create index if not exists models_make_id_idx on public.models (make_id);

-- ---------------------------------------------------------------------------
-- Auth trigger: create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, free_ads_remaining)
  values (new.id, 'user', 3)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper functions for RLS (see rls.sql)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super')
  );
$$;

create or replace function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super'
  );
$$;

-- ---------------------------------------------------------------------------
-- Optional: cast numeric JSONB attributes for range filters
-- (see src/lib/utils.ts — run per field as needed)
-- ---------------------------------------------------------------------------
-- update public.ads
-- set attributes = jsonb_set(attributes, '{year}', to_jsonb((attributes->>'year')::int))
-- where (attributes->>'year') ~ '^[0-9]+$';
