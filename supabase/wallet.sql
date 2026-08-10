-- Yaddii Marketplace — wallet migration
-- Run in Supabase SQL Editor AFTER schema.sql (safe to re-run with IF NOT EXISTS)

-- ---------------------------------------------------------------------------
-- Helper (also in schema.sql — required by wallet RPCs)
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

-- ---------------------------------------------------------------------------
-- Profile wallet columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists free_ads_remaining integer not null default 0,
  add column if not exists balance numeric not null default 0 check (balance >= 0),
  add column if not exists balance_expires_at timestamptz,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists welcome_credits_granted boolean not null default false;

-- ---------------------------------------------------------------------------
-- Wallet transaction log
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  type text not null check (
    type in ('welcome_grant', 'free_ad', 'ad_post', 'admin_credit', 'top_up', 'refund')
  ),
  ad_id uuid references public.ads (id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_id_idx
  on public.wallet_transactions (user_id, created_at desc);

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- Inserts only via security definer functions (no client insert policy)

-- ---------------------------------------------------------------------------
-- Signup: grant 3 free ads to new users (balance comes after phone verify)
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

-- ---------------------------------------------------------------------------
-- Backfill: starter free ads for existing users who have none yet
-- ---------------------------------------------------------------------------
update public.profiles
set free_ads_remaining = 3
where free_ads_remaining = 0
  and not welcome_credits_granted;

-- ---------------------------------------------------------------------------
-- Grant 300 EGP wallet balance after phone verification (90-day expiry)
-- Free ads (3) are granted on signup — see handle_new_user() in schema.sql
-- ---------------------------------------------------------------------------
create or replace function public.grant_welcome_credits(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_profile.welcome_credits_granted then
    update public.profiles
    set phone_verified = true
    where id = p_user_id and not phone_verified;

    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'free_ads_remaining', v_profile.free_ads_remaining,
      'balance', v_profile.balance,
      'balance_expires_at', v_profile.balance_expires_at
    );
  end if;

  update public.profiles
  set
    phone_verified = true,
    welcome_credits_granted = true,
    balance = 300,
    balance_expires_at = now() + interval '90 days'
  where id = p_user_id;

  insert into public.wallet_transactions (user_id, amount, type, description)
  values (p_user_id, 300, 'welcome_grant', 'Welcome bonus: 300 EGP wallet balance (90-day expiry)');

  return jsonb_build_object(
    'ok', true,
    'free_ads_remaining', v_profile.free_ads_remaining,
    'balance', 300,
    'balance_expires_at', (now() + interval '90 days')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Consume one ad credit (free ad first, then 40 EGP from non-expired balance)
-- ---------------------------------------------------------------------------
create or replace function public.consume_ad_credit(
  p_ad_id uuid default null,
  p_price numeric default 40
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_balance_ok boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  -- Admins post for free
  if public.is_admin() then
    return jsonb_build_object('ok', true, 'type', 'admin_waiver');
  end if;

  if v_profile.free_ads_remaining > 0 then
    update public.profiles
    set free_ads_remaining = free_ads_remaining - 1
    where id = v_uid;

    insert into public.wallet_transactions (user_id, amount, type, ad_id, description)
    values (v_uid, 0, 'free_ad', p_ad_id, 'Used 1 free ad credit');

    return jsonb_build_object(
      'ok', true,
      'type', 'free_ad',
      'free_ads_remaining', v_profile.free_ads_remaining - 1
    );
  end if;

  if not v_profile.phone_verified then
    return jsonb_build_object('ok', false, 'error', 'phone_not_verified');
  end if;

  v_balance_ok := v_profile.balance_expires_at is not null
    and v_profile.balance_expires_at >= now()
    and v_profile.balance >= p_price;

  if v_balance_ok then
    update public.profiles
    set balance = balance - p_price
    where id = v_uid;

    insert into public.wallet_transactions (user_id, amount, type, ad_id, description)
    values (v_uid, -p_price, 'ad_post', p_ad_id, 'Standard ad posting fee');

    return jsonb_build_object(
      'ok', true,
      'type', 'balance',
      'balance', v_profile.balance - p_price,
      'charged', p_price
    );
  end if;

  if v_profile.balance_expires_at is not null and v_profile.balance_expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'balance_expired');
  end if;

  return jsonb_build_object('ok', false, 'error', 'insufficient_credits');
end;
$$;

-- ---------------------------------------------------------------------------
-- Check if user can post (read-only helper for UI)
-- ---------------------------------------------------------------------------
create or replace function public.can_post_ad(p_price numeric default 40)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if public.is_admin() then
    return jsonb_build_object('ok', true, 'type', 'admin_waiver');
  end if;

  if v_profile.free_ads_remaining > 0 then
    return jsonb_build_object(
      'ok', true,
      'type', 'free_ad',
      'free_ads_remaining', v_profile.free_ads_remaining,
      'balance', v_profile.balance,
      'phone_verified', v_profile.phone_verified
    );
  end if;

  if not v_profile.phone_verified then
    return jsonb_build_object(
      'ok', false,
      'error', 'phone_not_verified',
      'free_ads_remaining', 0,
      'balance', v_profile.balance
    );
  end if;

  if v_profile.balance_expires_at is not null
    and v_profile.balance_expires_at >= now()
    and v_profile.balance >= p_price then
    return jsonb_build_object(
      'ok', true,
      'type', 'balance',
      'free_ads_remaining', 0,
      'balance', v_profile.balance,
      'ad_price', p_price
    );
  end if;

  if v_profile.balance_expires_at is not null and v_profile.balance_expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'balance_expired', 'balance', v_profile.balance);
  end if;

  return jsonb_build_object(
    'ok', false,
    'error', 'insufficient_credits',
    'free_ads_remaining', v_profile.free_ads_remaining,
    'balance', v_profile.balance
  );
end;
$$;

grant execute on function public.grant_welcome_credits(uuid) to authenticated;
grant execute on function public.consume_ad_credit(uuid, numeric) to authenticated;
grant execute on function public.can_post_ad(numeric) to authenticated;

-- Reload PostgREST schema cache (Supabase API)
notify pgrst, 'reload schema';
