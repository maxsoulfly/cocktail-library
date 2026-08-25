-- Widens the 7 "member read, admin write" lookup tables' write policies to
-- admit moderator, via public.is_admin_or_moderator() (20260825100000).
-- ALTER POLICY in place, same technique 20260823160000_liquid_colors_
-- policy_role_scope.sql already used for a one-qualifier change - preserves
-- policy identity, less boilerplate than drop+recreate.
--
-- The read policies are deliberately untouched - already `is_member() or
-- is_admin()`, and profiles.role = 'moderator' doesn't by itself satisfy
-- is_member(). Moderator is layered on top of an ordinary membership, not a
-- replacement for one - a revoked moderator loses read/write here exactly
-- like a revoked ordinary member would.

alter policy "ingredient_categories: admin insert" on public.ingredient_categories
  with check (public.is_admin_or_moderator());
alter policy "ingredient_categories: admin update" on public.ingredient_categories
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "ingredient_categories: admin delete" on public.ingredient_categories
  using (public.is_admin_or_moderator());

alter policy "ingredient_types: admin insert" on public.ingredient_types
  with check (public.is_admin_or_moderator());
alter policy "ingredient_types: admin update" on public.ingredient_types
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "ingredient_types: admin delete" on public.ingredient_types
  using (public.is_admin_or_moderator());

alter policy "ingredient_aliases: admin insert" on public.ingredient_aliases
  with check (public.is_admin_or_moderator());
alter policy "ingredient_aliases: admin update" on public.ingredient_aliases
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "ingredient_aliases: admin delete" on public.ingredient_aliases
  using (public.is_admin_or_moderator());

alter policy "glasses: admin insert" on public.glasses
  with check (public.is_admin_or_moderator());
alter policy "glasses: admin update" on public.glasses
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "glasses: admin delete" on public.glasses
  using (public.is_admin_or_moderator());

alter policy "taste_tags: admin insert" on public.taste_tags
  with check (public.is_admin_or_moderator());
alter policy "taste_tags: admin update" on public.taste_tags
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "taste_tags: admin delete" on public.taste_tags
  using (public.is_admin_or_moderator());

alter policy "cocktail_families: admin insert" on public.cocktail_families
  with check (public.is_admin_or_moderator());
alter policy "cocktail_families: admin update" on public.cocktail_families
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
alter policy "cocktail_families: admin delete" on public.cocktail_families
  using (public.is_admin_or_moderator());

-- liquid_colors never got split into insert/update/delete by
-- 20260815201731_optimize_rls_policies.sql (created afterward, in
-- 20260823150000_liquid_colors.sql) - still one combined `for all` policy.
-- No need to restructure it to match the other six; widen in place.
alter policy "liquid_colors: admin writes" on public.liquid_colors
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
