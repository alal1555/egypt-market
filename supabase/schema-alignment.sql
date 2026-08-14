-- Yaddii Marketplace — align live DB with repo schema + tighten RLS
-- Run in Supabase SQL Editor (or: supabase db query --linked -f supabase/schema-alignment.sql)
-- Safe to re-run (uses IF EXISTS / IF NOT EXISTS where possible)

-- ---------------------------------------------------------------------------
-- 1. Remove orphan listings (no owner — blocks NOT NULL on user_id)
-- ---------------------------------------------------------------------------
delete from public.favorites
where ad_id in (select id from public.ads where user_id is null);

delete from public.ads
where user_id is null;

-- ---------------------------------------------------------------------------
-- 2. Drop legacy unused columns on ads
-- ---------------------------------------------------------------------------
alter table public.ads drop column if exists views;
alter table public.ads drop column if exists seller_name;

-- ---------------------------------------------------------------------------
-- 3. Backfill nulls, then enforce NOT NULL + defaults (match schema.sql)
-- ---------------------------------------------------------------------------
update public.ads set images = '{}'::text[] where images is null;
update public.ads set attributes = '{}'::jsonb where attributes is null;
update public.ads set status = 'pending'::text where status is null;

alter table public.ads alter column user_id set not null;
alter table public.ads alter column category_slug set not null;
alter table public.ads alter column images set default '{}'::text[];
alter table public.ads alter column images set not null;
alter table public.ads alter column attributes set default '{}'::jsonb;
alter table public.ads alter column attributes set not null;
alter table public.ads alter column status set default 'pending'::text;
alter table public.ads alter column status set not null;

alter table public.ads drop constraint if exists ads_price_check;
alter table public.ads add constraint ads_price_check check (price >= 0);

-- Recreate user_id FK with ON DELETE CASCADE (repo intent)
alter table public.ads drop constraint if exists ads_user_id_fkey;
alter table public.ads add constraint ads_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 4. profiles.created_at (missing on live; app may use later)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 5. models.make_id NOT NULL
-- ---------------------------------------------------------------------------
alter table public.models alter column make_id set not null;

-- ---------------------------------------------------------------------------
-- 6. Indexes (idempotent)
-- ---------------------------------------------------------------------------
create index if not exists ads_status_created_at_idx on public.ads (status, created_at desc);
create index if not exists ads_user_id_idx on public.ads (user_id);
create index if not exists ads_category_slug_idx on public.ads (category_slug);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists models_make_id_idx on public.models (make_id);

-- ---------------------------------------------------------------------------
-- 7. Drop legacy duplicate / overly permissive RLS policies
--    (keeps policies from rls.sql + wallet.sql + ad-expiry.sql + top-up.sql)
-- ---------------------------------------------------------------------------

-- ads — old policies exposed all rows & allowed loose inserts
drop policy if exists "Admins can delete any ad" on public.ads;
drop policy if exists "Admins can update any ad status" on public.ads;
drop policy if exists "Allow public read access" on public.ads;
drop policy if exists "Allow staff to moderate ad listings" on public.ads;
drop policy if exists "Allow users to delete their own ads" on public.ads;
drop policy if exists "Allow users to update their own ads" on public.ads;
drop policy if exists "Anyone can view ads" on public.ads;
drop policy if exists "Logged in users can post ads" on public.ads;
drop policy if exists "Only users can post" on public.ads;
drop policy if exists "Users can insert their own ads" on public.ads;

-- profiles — old policies exposed all profiles & let users self-update any column
drop policy if exists "Allow ONLY supers to delete" on public.profiles;
drop policy if exists "Allow ONLY supers to insert" on public.profiles;
drop policy if exists "Allow ONLY supers to update" on public.profiles;
drop policy if exists "Allow users to read own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- favorites — duplicate of favorites_* policies
drop policy if exists "Users can delete their own favorites" on public.favorites;
drop policy if exists "Users can insert their own favorites" on public.favorites;
drop policy if exists "Users can view their own favorites" on public.favorites;

-- makes / models — duplicate read policies
drop policy if exists "Allow public read access" on public.makes;
drop policy if exists "Allow public read access" on public.models;

-- ---------------------------------------------------------------------------
-- 8. Re-assert canonical policies (idempotent)
-- ---------------------------------------------------------------------------
drop policy if exists "ads_select_active" on public.ads;
create policy "ads_select_active"
  on public.ads for select
  to anon, authenticated
  using (
    status = 'active'
    and (expires_at is null or expires_at > now())
  );

notify pgrst, 'reload schema';
