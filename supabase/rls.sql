-- Yaddii Marketplace — Row Level Security policies
-- Run AFTER schema.sql

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.ads enable row level security;
alter table public.favorites enable row level security;
alter table public.makes enable row level security;
alter table public.models enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Users read own role; admins read all (for dashboard user list)
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Super admin promotes/demotes roles (admin dashboard)
create policy "profiles_upsert_super"
  on public.profiles for insert
  to authenticated
  with check (public.is_super());

create policy "profiles_update_super"
  on public.profiles for update
  to authenticated
  using (public.is_super())
  with check (public.is_super());

-- Signup trigger inserts profile (security definer — bypasses RLS)

-- ---------------------------------------------------------------------------
-- ads
-- ---------------------------------------------------------------------------
-- Public marketplace: active, non-expired ads visible to everyone (including anon)
create policy "ads_select_active"
  on public.ads for select
  to anon, authenticated
  using (
    status = 'active'
    and (expires_at is null or expires_at > now())
  );

-- Sellers see all their own ads (pending, active, banned)
create policy "ads_select_own"
  on public.ads for select
  to authenticated
  using (user_id = auth.uid());

-- Admins see all ads (moderation dashboard)
create policy "ads_select_admin"
  on public.ads for select
  to authenticated
  using (public.is_admin());

-- Logged-in users create ads assigned to themselves
create policy "ads_insert_own"
  on public.ads for insert
  to authenticated
  with check (user_id = auth.uid());

-- Sellers update own ads (edit → pending re-approval in app)
create policy "ads_update_own"
  on public.ads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins approve / ban / restore
create policy "ads_update_admin"
  on public.ads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sellers delete own ads
create policy "ads_delete_own"
  on public.ads for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- makes / models (read-only reference data for everyone)
-- ---------------------------------------------------------------------------
create policy "makes_select_all"
  on public.makes for select
  to anon, authenticated
  using (true);

create policy "models_select_all"
  on public.models for select
  to anon, authenticated
  using (true);

-- Insert/update makes/models via SQL Editor or service role only (no client policies)

-- ---------------------------------------------------------------------------
-- Storage: ad-images bucket
-- Apply in Dashboard → Storage → ad-images → Policies, or run storage policies:
-- ---------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values ('ad-images', 'ad-images', true)
-- on conflict (id) do update set public = excluded.public;

-- Allow public read of listing images
-- create policy "ad_images_public_read"
--   on storage.objects for select
--   to anon, authenticated
--   using (bucket_id = 'ad-images');

-- Authenticated users upload into their own folder: ad-photos/{user_id}/...
-- create policy "ad_images_upload_own"
--   on storage.objects for insert
--   to authenticated
--   with check (
--     bucket_id = 'ad-images'
--     and (storage.foldername(name))[1] = 'ad-photos'
--     and (storage.foldername(name))[2] = auth.uid()::text
--   );
