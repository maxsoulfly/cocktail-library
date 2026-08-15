-- Fixes findings from `supabase db advisors --type security` run against
-- 20260815200430_initial_schema.sql: policies created without an explicit
-- `to authenticated` default to applying to PUBLIC (including anon), which is
-- why is_admin()/is_member()/handle_new_user() were directly callable as
-- public RPC endpoints. Scoping every policy to `authenticated` means anon
-- queries are denied outright (no applicable policy - no function call
-- happens at all), so the helper functions no longer need PUBLIC execute
-- rights.

-- ── profiles ─────────────────────────────────────────────────────────────────

drop policy "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy "profiles: admin reads all" on public.profiles;
create policy "profiles: admin reads all" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- ── invitations ──────────────────────────────────────────────────────────────

drop policy "invitations: admin manages" on public.invitations;
create policy "invitations: admin manages" on public.invitations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── memberships ──────────────────────────────────────────────────────────────

drop policy "memberships: read own" on public.memberships;
create policy "memberships: read own" on public.memberships
  for select to authenticated using (user_id = auth.uid());

drop policy "memberships: admin reads all" on public.memberships;
create policy "memberships: admin reads all" on public.memberships
  for select to authenticated using (public.is_admin());

-- ── taxonomy tables ──────────────────────────────────────────────────────────

drop policy "ingredient_categories: members read" on public.ingredient_categories;
create policy "ingredient_categories: members read" on public.ingredient_categories
  for select to authenticated using (public.is_member());
drop policy "ingredient_categories: admin writes" on public.ingredient_categories;
create policy "ingredient_categories: admin writes" on public.ingredient_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "ingredient_types: members read" on public.ingredient_types;
create policy "ingredient_types: members read" on public.ingredient_types
  for select to authenticated using (public.is_member());
drop policy "ingredient_types: admin writes" on public.ingredient_types;
create policy "ingredient_types: admin writes" on public.ingredient_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "ingredient_aliases: members read" on public.ingredient_aliases;
create policy "ingredient_aliases: members read" on public.ingredient_aliases
  for select to authenticated using (public.is_member());
drop policy "ingredient_aliases: admin writes" on public.ingredient_aliases;
create policy "ingredient_aliases: admin writes" on public.ingredient_aliases
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "glasses: members read" on public.glasses;
create policy "glasses: members read" on public.glasses
  for select to authenticated using (public.is_member());
drop policy "glasses: admin writes" on public.glasses;
create policy "glasses: admin writes" on public.glasses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "taste_tags: members read" on public.taste_tags;
create policy "taste_tags: members read" on public.taste_tags
  for select to authenticated using (public.is_member());
drop policy "taste_tags: admin writes" on public.taste_tags;
create policy "taste_tags: admin writes" on public.taste_tags
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "cocktail_families: members read" on public.cocktail_families;
create policy "cocktail_families: members read" on public.cocktail_families
  for select to authenticated using (public.is_member());
drop policy "cocktail_families: admin writes" on public.cocktail_families;
create policy "cocktail_families: admin writes" on public.cocktail_families
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── lock down direct execution of the helper/trigger functions ─────────────

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_member() from public;

-- Still needed so the `to authenticated` policies above can invoke them
-- during query evaluation for signed-in users.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_member() to authenticated;
