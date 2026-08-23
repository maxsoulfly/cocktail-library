-- liquid_colors' two policies (20260823150000_liquid_colors.sql) were
-- written with plain `for select using (...)`/`for all using(...) with
-- check(...)`, which defaults to `to public` - unlike every sibling lookup
-- table (glasses, taste_tags, cocktail_families, ingredient_categories),
-- all of which explicitly scope their policies `to authenticated`, matching
-- this project's established RLS policy shape.
--
-- Found by the new RLS regression suite (supabase/tests/rls_suite.sql): an
-- anon request to liquid_colors evaluates is_member()/is_admin() (since the
-- policy applies to every role, anon included), but anon has no EXECUTE
-- grant on either function - so instead of the clean "empty result" every
-- sibling table gives an unauthenticated caller, liquid_colors throws a raw
-- "permission denied for function is_member" error. Not a real exposure
-- (no page in this invite-only app calls it unauthenticated), but a real
-- inconsistency worth matching to the established pattern.

alter policy "liquid_colors: members read" on public.liquid_colors to authenticated;
alter policy "liquid_colors: admin writes" on public.liquid_colors to authenticated;
