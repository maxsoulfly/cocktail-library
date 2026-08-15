-- Fixes findings from `supabase db advisors --type performance`:
--
-- 1. auth_rls_initplan: bare `auth.uid()` comparisons in a policy get
--    re-evaluated per row instead of once per query. Wrapping as
--    `(select auth.uid())` lets Postgres hoist it into an initplan.
--    (is_admin()/is_member() are unaffected - they're STABLE functions,
--    already evaluated once per statement.)
-- 2. multiple_permissive_policies: having a "members/own read" policy and a
--    separate "admin: for all" policy both apply to SELECT, so Postgres
--    evaluates both per query. Replaced with one combined SELECT policy per
--    table, plus separate insert/update/delete policies for admin writes
--    (no `for all`, so no command has more than one applicable policy).

-- ── profiles ─────────────────────────────────────────────────────────────────

drop policy "profiles: read own" on public.profiles;
drop policy "profiles: admin reads all" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

drop policy "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

-- ── memberships ──────────────────────────────────────────────────────────────

drop policy "memberships: read own" on public.memberships;
drop policy "memberships: admin reads all" on public.memberships;
create policy "memberships: read own or admin" on public.memberships
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- ── taxonomy tables ──────────────────────────────────────────────────────────
-- Same shape repeated for all six: one combined read policy, three
-- single-command admin-write policies.

drop policy "ingredient_categories: members read" on public.ingredient_categories;
drop policy "ingredient_categories: admin writes" on public.ingredient_categories;
create policy "ingredient_categories: read" on public.ingredient_categories
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "ingredient_categories: admin insert" on public.ingredient_categories
  for insert to authenticated with check (public.is_admin());
create policy "ingredient_categories: admin update" on public.ingredient_categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ingredient_categories: admin delete" on public.ingredient_categories
  for delete to authenticated using (public.is_admin());

drop policy "ingredient_types: members read" on public.ingredient_types;
drop policy "ingredient_types: admin writes" on public.ingredient_types;
create policy "ingredient_types: read" on public.ingredient_types
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "ingredient_types: admin insert" on public.ingredient_types
  for insert to authenticated with check (public.is_admin());
create policy "ingredient_types: admin update" on public.ingredient_types
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ingredient_types: admin delete" on public.ingredient_types
  for delete to authenticated using (public.is_admin());

drop policy "ingredient_aliases: members read" on public.ingredient_aliases;
drop policy "ingredient_aliases: admin writes" on public.ingredient_aliases;
create policy "ingredient_aliases: read" on public.ingredient_aliases
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "ingredient_aliases: admin insert" on public.ingredient_aliases
  for insert to authenticated with check (public.is_admin());
create policy "ingredient_aliases: admin update" on public.ingredient_aliases
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ingredient_aliases: admin delete" on public.ingredient_aliases
  for delete to authenticated using (public.is_admin());

drop policy "glasses: members read" on public.glasses;
drop policy "glasses: admin writes" on public.glasses;
create policy "glasses: read" on public.glasses
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "glasses: admin insert" on public.glasses
  for insert to authenticated with check (public.is_admin());
create policy "glasses: admin update" on public.glasses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "glasses: admin delete" on public.glasses
  for delete to authenticated using (public.is_admin());

drop policy "taste_tags: members read" on public.taste_tags;
drop policy "taste_tags: admin writes" on public.taste_tags;
create policy "taste_tags: read" on public.taste_tags
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "taste_tags: admin insert" on public.taste_tags
  for insert to authenticated with check (public.is_admin());
create policy "taste_tags: admin update" on public.taste_tags
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "taste_tags: admin delete" on public.taste_tags
  for delete to authenticated using (public.is_admin());

drop policy "cocktail_families: members read" on public.cocktail_families;
drop policy "cocktail_families: admin writes" on public.cocktail_families;
create policy "cocktail_families: read" on public.cocktail_families
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "cocktail_families: admin insert" on public.cocktail_families
  for insert to authenticated with check (public.is_admin());
create policy "cocktail_families: admin update" on public.cocktail_families
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cocktail_families: admin delete" on public.cocktail_families
  for delete to authenticated using (public.is_admin());
