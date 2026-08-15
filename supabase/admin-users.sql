-- Yaddii Marketplace — admin user list (email from auth.users)
-- Run in Supabase SQL Editor after schema.sql + rls.sql

-- Optional profile columns (present on some projects from Supabase starter schema)
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;

-- Backfill from auth.users
update public.profiles p
set
  email = coalesce(p.email, u.email),
  full_name = coalesce(nullif(trim(p.full_name), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''))
from auth.users u
where u.id = p.id;

-- Signup: keep profiles.email in sync for admin dashboards
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, free_ads_remaining, email, full_name)
  values (
    new.id,
    'user',
    3,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Super admin: list users with auth email (client cannot read auth.users directly)
create or replace function public.admin_list_users()
returns table (
  id uuid,
  role text,
  email text,
  full_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super() then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    p.role,
    u.email::text,
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(p.full_name), '')
    )::text as full_name
  from public.profiles p
  inner join auth.users u on u.id = p.id
  order by
    case p.role when 'super' then 0 when 'admin' then 1 else 2 end,
    u.email asc nulls last;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

notify pgrst, 'reload schema';
