-- User-reported: community recipe "by {author}" attribution (DetailScreen.jsx
-- already renders this, guarded by `c.author &&`) was silently broken for
-- every ordinary member - "profiles: read own or admin" only ever let a
-- user read their own row or, if admin, everyone's. A regular member had no
-- RLS path to read another member's display_name at all, so the owner:
-- profiles(display_name) embed on a community recipe always came back null
-- for them. Separately, and the more urgent half of the report: the admin
-- COULD read it, and what they saw was a raw email address - handle_new_user()
-- defaults display_name to the signup email whenever no full_name is
-- present (true for every plain email/password signup, only OAuth
-- providers like Google supply one) - a real PII exposure once display_name
-- becomes member-readable, not just an admin-only concern.
--
-- Two fixes:
-- 1. Broaden profile read to any member (profiles has no email column at
--    all - email lives only in auth.users, never copied here - so this
--    exposes display_name/role/preferences/join date to fellow members,
--    not anything more sensitive; standard for a small invite-only
--    community app). `id = own` is kept as an explicit separate branch
--    (not simplified to just is_member()) because a freshly-signed-up user
--    who hasn't redeemed an invitation yet still needs to read their own
--    profile row - useMembership()'s Promise.all([fetchProfile,
--    fetchMembership]) would otherwise reject entirely for anyone not yet
--    a member, breaking the JoinScreen flow itself.
-- 2. handle_new_user() no longer falls back to the raw email - a bare
--    'New Member' placeholder instead, expected to be rare going forward
--    now that the join form collects a real display name up front (see
--    the app-side change alongside this migration).

drop policy "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or member" on public.profiles
  for select to authenticated using (
    id = (select auth.uid()) or public.is_member()
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'New Member')
  );
  return new;
end;
$$;
