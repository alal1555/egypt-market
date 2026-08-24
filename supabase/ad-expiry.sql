-- Yaddii Marketplace — ad listing expiry (30 days live)
-- Run in Supabase SQL Editor AFTER schema.sql and wallet.sql

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------
alter table public.ads
  add column if not exists expires_at timestamptz;

comment on column public.ads.expires_at is 'When the listing stops appearing publicly (set on admin approval).';

-- Backfill existing live ads: 30 days from now
update public.ads
set expires_at = now() + interval '30 days'
where status = 'active'
  and expires_at is null;

-- ---------------------------------------------------------------------------
-- Public reads: active AND not expired
-- ---------------------------------------------------------------------------
drop policy if exists "ads_select_active" on public.ads;
create policy "ads_select_active"
  on public.ads for select
  to anon, authenticated
  using (
    status = 'active'
    and (expires_at is null or expires_at > now())
  );

-- ---------------------------------------------------------------------------
-- Extend wallet transaction types
-- ---------------------------------------------------------------------------
alter table public.wallet_transactions drop constraint if exists wallet_transactions_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_type_check
  check (
    type in ('welcome_grant', 'free_ad', 'free_auction', 'ad_post', 'ad_renewal', 'admin_credit', 'top_up', 'refund')
  );

-- ---------------------------------------------------------------------------
-- Renew an expired (or expiring) listing for another 30 days
-- ---------------------------------------------------------------------------
create or replace function public.renew_ad(
  p_ad_id uuid,
  p_price numeric default 40,
  p_live_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ad public.ads%rowtype;
  v_consume jsonb;
  v_new_expires timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_ad from public.ads where id = p_ad_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ad_not_found');
  end if;

  if v_ad.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;

  if v_ad.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'ad_not_active');
  end if;

  v_consume := public.consume_ad_credit(p_ad_id, p_price);
  if not (v_consume->>'ok')::boolean then
    return v_consume;
  end if;

  v_new_expires := greatest(coalesce(v_ad.expires_at, now()), now()) + (p_live_days || ' days')::interval;

  update public.ads
  set expires_at = v_new_expires
  where id = p_ad_id;

  return jsonb_build_object(
    'ok', true,
    'expires_at', v_new_expires,
    'consume', v_consume
  );
end;
$$;

grant execute on function public.renew_ad(uuid, numeric, integer) to authenticated;

notify pgrst, 'reload schema';
