-- Yaddii Marketplace — wallet top-up (Paymob)
-- Run in Supabase SQL Editor AFTER wallet.sql

-- ---------------------------------------------------------------------------
-- Top-up payment records (created pending → completed via Paymob webhook)
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_top_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EGP',
  provider text not null default 'paymob',
  provider_order_id text,
  provider_transaction_id text,
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed', 'cancelled')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists wallet_top_ups_user_id_idx
  on public.wallet_top_ups (user_id, created_at desc);

create index if not exists wallet_top_ups_provider_order_idx
  on public.wallet_top_ups (provider_order_id);

alter table public.wallet_top_ups enable row level security;

drop policy if exists "wallet_top_ups_select_own" on public.wallet_top_ups;
create policy "wallet_top_ups_select_own"
  on public.wallet_top_ups for select
  to authenticated
  using (user_id = auth.uid());

-- Inserts/updates only via service role (Next.js API + webhook)

-- ---------------------------------------------------------------------------
-- Credit wallet after verified Paymob payment (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.apply_top_up(
  p_top_up_id uuid,
  p_provider_transaction_id text default null,
  p_balance_valid_days integer default 365
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top_up public.wallet_top_ups%rowtype;
  v_profile public.profiles%rowtype;
  v_new_balance numeric;
  v_new_expires timestamptz;
begin
  select * into v_top_up from public.wallet_top_ups where id = p_top_up_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'top_up_not_found');
  end if;

  if v_top_up.status = 'completed' then
    return jsonb_build_object('ok', true, 'already_completed', true, 'amount', v_top_up.amount);
  end if;

  if v_top_up.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'invalid_top_up_status');
  end if;

  select * into v_profile from public.profiles where id = v_top_up.user_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  v_new_expires := greatest(coalesce(v_profile.balance_expires_at, now()), now())
    + (p_balance_valid_days || ' days')::interval;

  update public.profiles
  set
    balance = balance + v_top_up.amount,
    balance_expires_at = v_new_expires
  where id = v_top_up.user_id
  returning balance into v_new_balance;

  update public.wallet_top_ups
  set
    status = 'completed',
    completed_at = now(),
    provider_transaction_id = coalesce(p_provider_transaction_id, provider_transaction_id)
  where id = p_top_up_id;

  insert into public.wallet_transactions (user_id, amount, type, description)
  values (
    v_top_up.user_id,
    v_top_up.amount,
    'top_up',
    'Wallet top-up via Paymob (' || v_top_up.amount || ' EGP)'
  );

  return jsonb_build_object(
    'ok', true,
    'amount', v_top_up.amount,
    'balance', v_new_balance,
    'balance_expires_at', v_new_expires
  );
end;
$$;

revoke all on function public.apply_top_up(uuid, text, integer) from public;
grant execute on function public.apply_top_up(uuid, text, integer) to service_role;

notify pgrst, 'reload schema';
