-- Run this in Supabase SQL Editor.
-- Safe to run after the original profiles/time_entries setup.

alter table public.profiles
  add column if not exists full_name text;

update public.profiles
set full_name = coalesce(nullif(full_name, ''), email)
where full_name is null or full_name = '';

alter table public.profiles
  alter column full_name set default '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', email)
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);

-- Ensure the admin helper exists.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Admins need to read driver profiles for the dropdown and names.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_admin());

-- Keep/ensure admin access to every time entry.
drop policy if exists "Admins can view all time entries" on public.time_entries;
create policy "Admins can view all time entries"
on public.time_entries for select to authenticated
using (public.is_admin());

-- Promote an account after replacing the UUID below:
-- update public.profiles set is_admin = true where id = 'ADMIN_USER_UUID';
