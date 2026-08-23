-- The original "recipes: read" policy (20260815214307) let an admin read
-- EVERY recipe, including other members' still-private drafts and anything
-- unpublished_by_admin - the migration's own comment cited spec §8.3 for
-- this, but the actual spec text only ever says "A recipe is visible when
-- it is an active shared recipe, or when the current user owns it" - no
-- admin clause at all. Same class of bug as 20260815231800 (which tightened
-- UPDATE/DELETE to match the spec after finding the original policies were
-- wider than intended) - that pass missed SELECT.
--
-- Confirmed no admin feature actually depends on the broader grant before
-- removing it: the Classic Recipes admin tab only reads visibility='shared'
-- rows (classics), and fetchCommunityRecipes() (Moderation tab) only reads
-- moderation_status='active' rows - both already covered by the first
-- clause below, available to any member. recipe_is_editable() (used by the
-- UPDATE/DELETE policies, unaffected by this migration) still lets admin
-- edit/delete the ownerless classic catalog regardless of read visibility.
--
-- User-reported bug this fixes: browsing Library's "Private" filter as
-- admin showed another member's private recipe (one the admin had
-- unpublished during testing, moderation_status='unpublished_by_admin') -
-- correct behavior per spec is that only the recipe's owner sees it once
-- private again, admin's unpublish action already preserves owner access
-- per §8.3's last line without needing continued read access itself.

drop policy "recipes: read" on public.recipes;
create policy "recipes: read" on public.recipes
  for select to authenticated using (
    (visibility = 'shared' and moderation_status = 'active')
    or owner_id = (select auth.uid())
  );
