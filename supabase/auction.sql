-- Yaddii Marketplace — optional auction listings (مزاد)
-- Run in Supabase SQL Editor AFTER ad-expiry.sql

-- ---------------------------------------------------------------------------
-- ads: auction columns (fixed-price listings unchanged — listing_type defaults to 'fixed')
-- ---------------------------------------------------------------------------
alter table public.ads
  add column if not exists listing_type text not null default 'fixed'
    check (listing_type in ('fixed', 'auction'));

alter table public.ads
  add column if not exists auction_bid_increment numeric
    check (auction_bid_increment is null or auction_bid_increment > 0);

alter table public.ads
  add column if not exists auction_reserve_price numeric
    check (auction_reserve_price is null or auction_reserve_price >= 0);

alter table public.ads
  add column if not exists auction_duration_hours integer
    check (auction_duration_hours is null or auction_duration_hours in (12, 24, 48, 72));

alter table public.ads
  add column if not exists auction_ends_at timestamptz;

alter table public.ads
  add column if not exists auction_status text
    check (
      auction_status is null
      or auction_status in ('pending', 'live', 'ended', 'no_sale', 'sold')
    );

alter table public.ads
  add column if not exists auction_current_bid numeric
    check (auction_current_bid is null or auction_current_bid >= 0);

alter table public.ads
  add column if not exists auction_winner_id uuid references auth.users (id) on delete set null;

alter table public.ads
  add column if not exists auction_bid_count integer not null default 0;

alter table public.ads
  add column if not exists auction_verification_code text
    check (
      auction_verification_code is null
      or auction_verification_code ~ '^YAD-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$'
    );

comment on column public.ads.auction_verification_code is 'Shared secret shown to seller + winner after a successful auction';

create index if not exists ads_auction_live_idx
  on public.ads (auction_ends_at)
  where listing_type = 'auction' and auction_status = 'live';

comment on column public.ads.listing_type is 'fixed = normal listing; auction = timed bidding (مزاد)';
comment on column public.ads.price is 'Fixed price, or starting bid for auctions';

-- ---------------------------------------------------------------------------
-- Bid history
-- ---------------------------------------------------------------------------
create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists auction_bids_ad_id_idx
  on public.auction_bids (ad_id, created_at desc);

alter table public.auction_bids enable row level security;

drop policy if exists "auction_bids_select_public" on public.auction_bids;
create policy "auction_bids_select_public"
  on public.auction_bids for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.ads a
      where a.id = ad_id
        and a.status = 'active'
        and a.listing_type = 'auction'
    )
  );

-- Inserts only via place_auction_bid RPC

-- ---------------------------------------------------------------------------
-- Public ad visibility: fixed listings unchanged; live + recently ended auctions
-- Ended auctions stay public for 7 days (sold) or 14 days (no_sale) via expires_at.
-- ---------------------------------------------------------------------------
drop policy if exists "ads_select_active" on public.ads;
create policy "ads_select_active"
  on public.ads for select
  to anon, authenticated
  using (
    status = 'active'
    and (
      (
        coalesce(listing_type, 'fixed') = 'fixed'
        and (expires_at is null or expires_at > now())
      )
      or (
        listing_type = 'auction'
        and auction_status = 'live'
        and auction_ends_at is not null
        and auction_ends_at > now()
      )
      or (
        listing_type = 'auction'
        and auction_status in ('ended', 'no_sale', 'sold')
        and (expires_at is null or expires_at > now())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Close auctions whose timer has passed
-- ---------------------------------------------------------------------------
create or replace function public.generate_auction_verification_code()
returns text
language plpgsql
as $$
declare
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code text := 'YAD-';
  i integer;
begin
  for i in 1..4 loop
    v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  end loop;
  return v_code;
end;
$$;

create or replace function public.ensure_auction_verification_code(p_ad_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ad public.ads%rowtype;
  v_code text;
begin
  select * into v_ad from public.ads where id = p_ad_id;
  if not found then
    return null;
  end if;

  if v_ad.auction_verification_code is not null then
    return v_ad.auction_verification_code;
  end if;

  if v_ad.auction_status not in ('ended', 'sold') or v_ad.auction_winner_id is null then
    return null;
  end if;

  v_code := public.generate_auction_verification_code();
  update public.ads
  set auction_verification_code = v_code
  where id = p_ad_id;

  return v_code;
end;
$$;

create or replace function public.close_expired_auctions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed integer := 0;
  v_ad public.ads%rowtype;
  v_reserve_ok boolean;
  v_winner_id uuid;
begin
  for v_ad in
    select *
    from public.ads
    where listing_type = 'auction'
      and auction_status = 'live'
      and auction_ends_at is not null
      and auction_ends_at <= now()
    for update
  loop
    v_reserve_ok := v_ad.auction_reserve_price is null
      or (
        v_ad.auction_current_bid is not null
        and v_ad.auction_current_bid >= v_ad.auction_reserve_price
      );

    if v_ad.auction_bid_count > 0 and v_reserve_ok then
      v_winner_id := coalesce(
        v_ad.auction_winner_id,
        (
          select ab.user_id
          from public.auction_bids ab
          where ab.ad_id = v_ad.id
          order by ab.amount desc, ab.created_at desc
          limit 1
        )
      );

      update public.ads
      set
        auction_status = 'ended',
        price = coalesce(v_ad.auction_current_bid, v_ad.price),
        auction_winner_id = v_winner_id,
        auction_verification_code = coalesce(
          v_ad.auction_verification_code,
          public.generate_auction_verification_code()
        ),
        expires_at = now() + interval '7 days'
      where id = v_ad.id;
    else
      update public.ads
      set
        auction_status = 'no_sale',
        expires_at = now() + interval '14 days'
      where id = v_ad.id;
    end if;

    v_closed := v_closed + 1;
  end loop;

  return v_closed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Place a bid (phone-verified users only; seller cannot bid on own listing)
-- ---------------------------------------------------------------------------
create or replace function public.place_auction_bid(
  p_ad_id uuid,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ad public.ads%rowtype;
  v_profile public.profiles%rowtype;
  v_min_bid numeric;
  v_ends_at timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found or not v_profile.phone_verified then
    return jsonb_build_object('ok', false, 'error', 'phone_not_verified');
  end if;

  perform public.close_expired_auctions();

  select * into v_ad from public.ads where id = p_ad_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ad_not_found');
  end if;

  if v_ad.listing_type <> 'auction' then
    return jsonb_build_object('ok', false, 'error', 'not_auction');
  end if;

  if v_ad.user_id = v_uid then
    return jsonb_build_object('ok', false, 'error', 'own_auction');
  end if;

  if v_ad.status <> 'active' or v_ad.auction_status <> 'live' then
    return jsonb_build_object('ok', false, 'error', 'auction_not_live');
  end if;

  if v_ad.auction_ends_at is null or v_ad.auction_ends_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'auction_ended');
  end if;

  if v_ad.auction_bid_count = 0 then
    v_min_bid := v_ad.price;
  else
    v_min_bid := coalesce(v_ad.auction_current_bid, v_ad.price)
      + coalesce(v_ad.auction_bid_increment, 50);
  end if;

  if p_amount < v_min_bid then
    return jsonb_build_object('ok', false, 'error', 'bid_too_low', 'min_bid', v_min_bid);
  end if;

  v_ends_at := v_ad.auction_ends_at;
  if v_ad.auction_ends_at - now() <= interval '3 minutes' then
    v_ends_at := v_ad.auction_ends_at + interval '3 minutes';
  end if;

  insert into public.auction_bids (ad_id, user_id, amount)
  values (p_ad_id, v_uid, p_amount);

  update public.ads
  set
    auction_current_bid = p_amount,
    auction_winner_id = v_uid,
    auction_bid_count = auction_bid_count + 1,
    auction_ends_at = v_ends_at,
    expires_at = v_ends_at
  where id = p_ad_id;

  return jsonb_build_object(
    'ok', true,
    'amount', p_amount,
    'auction_ends_at', v_ends_at,
    'bid_count', v_ad.auction_bid_count + 1,
    'min_next_bid', p_amount + coalesce(v_ad.auction_bid_increment, 50)
  );
end;
$$;

grant execute on function public.close_expired_auctions() to anon, authenticated;
grant execute on function public.place_auction_bid(uuid, numeric) to authenticated;

-- Seller-only: winner name + phone after auction ends
create or replace function public.get_auction_winner_contact(p_ad_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ad public.ads%rowtype;
  v_winner_id uuid;
  v_phone text;
  v_name text;
  v_code text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_ad from public.ads where id = p_ad_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ad_not_found');
  end if;

  if v_ad.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;

  if v_ad.auction_status not in ('ended', 'sold') then
    return jsonb_build_object('ok', false, 'error', 'auction_not_finished');
  end if;

  v_winner_id := v_ad.auction_winner_id;
  if v_winner_id is null then
    select ab.user_id into v_winner_id
    from public.auction_bids ab
    where ab.ad_id = p_ad_id
    order by ab.amount desc, ab.created_at desc
    limit 1;
  end if;

  if v_winner_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_winner');
  end if;

  select
    nullif(trim(u.raw_user_meta_data->>'phone_number'), ''),
    coalesce(
      nullif(trim(p.full_name), ''),
      nullif(trim(u.raw_user_meta_data->>'full_name'), '')
    )
  into v_phone, v_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_winner_id;

  v_code := public.ensure_auction_verification_code(p_ad_id);

  return jsonb_build_object(
    'ok', true,
    'winner_id', v_winner_id,
    'full_name', coalesce(v_name, ''),
    'phone', coalesce(v_phone, ''),
    'verification_code', coalesce(v_code, '')
  );
end;
$$;

grant execute on function public.get_auction_winner_contact(uuid) to authenticated;

-- Winner-only: shared verification code after auction ends
create or replace function public.get_auction_winner_verification(p_ad_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ad public.ads%rowtype;
  v_code text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_ad from public.ads where id = p_ad_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ad_not_found');
  end if;

  if v_ad.auction_status not in ('ended', 'sold') then
    return jsonb_build_object('ok', false, 'error', 'auction_not_finished');
  end if;

  if v_ad.auction_winner_id is distinct from v_uid then
    return jsonb_build_object('ok', false, 'error', 'not_winner');
  end if;

  v_code := public.ensure_auction_verification_code(p_ad_id);

  return jsonb_build_object(
    'ok', true,
    'verification_code', coalesce(v_code, '')
  );
end;
$$;

grant execute on function public.get_auction_winner_verification(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Listing credits — keep in sync with wallet.sql (free auctions + paid fallback)
-- ---------------------------------------------------------------------------
-- Re-run wallet.sql for the latest consume_ad_credit / can_post_auction definitions.

-- ---------------------------------------------------------------------------
-- Backfill post-auction visibility for listings closed before expires_at was set
-- ---------------------------------------------------------------------------
update public.ads
set expires_at = coalesce(auction_ends_at, now()) + interval '7 days'
where listing_type = 'auction'
  and auction_status in ('ended', 'sold')
  and (
    expires_at is null
    or expires_at <= coalesce(auction_ends_at, expires_at)
  );

update public.ads
set expires_at = coalesce(auction_ends_at, now()) + interval '14 days'
where listing_type = 'auction'
  and auction_status = 'no_sale'
  and (
    expires_at is null
    or expires_at <= coalesce(auction_ends_at, expires_at)
  );

notify pgrst, 'reload schema';
