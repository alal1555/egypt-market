-- Ad view counter (public read; increment via RPC only)
-- Run in Supabase SQL Editor after schema.sql / on live project once.

alter table public.ads
  add column if not exists view_count bigint not null default 0;

comment on column public.ads.view_count is 'Times the listing detail page was opened (deduped client-side per session).';

create or replace function public.increment_ad_view(p_ad_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  update public.ads
  set view_count = view_count + 1
  where id = p_ad_id
    and status = 'active'
    and (expires_at is null or expires_at > now())
  returning view_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.increment_ad_view(uuid) from public;
grant execute on function public.increment_ad_view(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
