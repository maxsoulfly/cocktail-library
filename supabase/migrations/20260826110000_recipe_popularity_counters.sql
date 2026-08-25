-- Denormalized cross-user popularity counters on recipes, for ranking
-- Home's "Almost There" list by real popularity/saves (user request) - not
-- just this user's own favorite/want-to-make status, which the existing
-- rankPurchaseRecommendations() already uses for its own "unlocks a recipe
-- you've favorited" boost.
--
-- user_favorites/user_want_to_make are strictly private, no admin-read
-- override (same shape as user_inventory) - a real, deliberate privacy
-- choice, not an oversight. A live aggregate query summing across all
-- users' rows would need to bypass that RLS entirely just to produce a
-- single number, and read access to the boundary is exactly what "strictly
-- private" is supposed to prevent. A denormalized counter, kept in sync by
-- a SECURITY DEFINER trigger, exposes only the total count - never which
-- users contributed to it - while still being a plain, RLS-covered column
-- any member can already read via the recipes table's existing policies.

alter table public.recipes add column favorite_count integer not null default 0;
alter table public.recipes add column want_to_make_count integer not null default 0;

-- Backfill from the real current data, not just zeroed for existing rows.
update public.recipes r set favorite_count = (
  select count(*) from public.user_favorites uf where uf.recipe_id = r.id
);
update public.recipes r set want_to_make_count = (
  select count(*) from public.user_want_to_make uwtm where uwtm.recipe_id = r.id
);

-- SECURITY DEFINER because an ordinary member's own INSERT/DELETE on
-- user_favorites/user_want_to_make only carries their own column-grant
-- privileges on recipes (name/description/glass_id/family_id/liquid_color/
-- liquid_color_2/steps per 20260815214307's explicit grant list) -
-- favorite_count/want_to_make_count are deliberately NOT in that list, so
-- the trigger needs to run with elevated privilege to update them
-- regardless of who fired it. Same discipline as every other SECURITY
-- DEFINER function in this codebase - explicit revoke/grant even though a
-- trigger function isn't exposed as a normal callable RPC.
create function public.sync_recipe_favorite_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update public.recipes set favorite_count = favorite_count + 1 where id = new.recipe_id;
  elsif TG_OP = 'DELETE' then
    update public.recipes set favorite_count = favorite_count - 1 where id = old.recipe_id;
  end if;
  return null;
end;
$$;

create function public.sync_recipe_want_to_make_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update public.recipes set want_to_make_count = want_to_make_count + 1 where id = new.recipe_id;
  elsif TG_OP = 'DELETE' then
    update public.recipes set want_to_make_count = want_to_make_count - 1 where id = old.recipe_id;
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_recipe_favorite_count() from public, anon, authenticated;
revoke execute on function public.sync_recipe_want_to_make_count() from public, anon, authenticated;

create trigger user_favorites_sync_count
  after insert or delete on public.user_favorites
  for each row execute function public.sync_recipe_favorite_count();

create trigger user_want_to_make_sync_count
  after insert or delete on public.user_want_to_make
  for each row execute function public.sync_recipe_want_to_make_count();
