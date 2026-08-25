-- New "moderator" tier between member and admin. Scope agreed with the user:
-- full ingredient-catalog authoring (7 lookup tables + ingredient_requests,
-- widened in the next two migrations) and exactly three recipe actions -
-- promote/demote/unpublish (widened in the migration after that). No
-- classic-recipe edit/delete, no Users/Invitations access, no new-classic
-- authoring via batch import - those stay admin-only throughout.
--
-- is_admin_or_moderator() centralizes "what can staff collectively do" in
-- one function instead of repeating `is_admin() or is_moderator()` inline
-- across ~25 policies/functions - if the moderator definition ever grows a
-- second condition, it changes in one place.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'moderator', 'member'));

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator');
$$;

create function public.is_admin_or_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_moderator();
$$;

-- Matches is_admin()/is_member()'s own established grant pattern (see
-- 20260815201523_fix_function_grants.sql) - revoking from `public` alone is
-- a no-op on Supabase, since default privileges grant EXECUTE directly to
-- the anon/authenticated roles by name.
revoke execute on function public.is_moderator() from anon, authenticated;
revoke execute on function public.is_admin_or_moderator() from anon, authenticated;
grant execute on function public.is_moderator() to authenticated;
grant execute on function public.is_admin_or_moderator() to authenticated;

-- Only a real admin may call this (the is_admin() guard below is
-- unchanged) - a moderator can never grant themselves or anyone else
-- further privilege. Widens only the accepted-value check.
create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change a member''s role.';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  if new_role not in ('admin', 'moderator', 'member') then
    raise exception 'Invalid role.';
  end if;

  update public.profiles set role = new_role
  where id = target_user_id
  returning * into v_row;

  if v_row is null then
    raise exception 'No such user.';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
