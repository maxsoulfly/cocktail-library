-- Widens exactly the three recipe actions agreed for moderator scope -
-- promote to classic, demote back to community, unpublish/remove from
-- community. Function bodies aren't partially alterable, so full bodies
-- are restated (create or replace) - each swaps its one is_admin() caller
-- check for is_admin_or_moderator(), otherwise byte-for-byte identical to
-- the versions in 20260823130000_classic_promotion.sql /
-- 20260815230002_recipe_publishing.sql.
--
-- Deliberately LEFT admin-only (not touched by this migration or any
-- other in the moderator-role set) - the single place to check "did we
-- forget something":
--   - publish_recipe()'s is_admin() OR-branch (publish on someone else's
--     behalf) - not one of the three granted actions.
--   - admin_set_membership_revoked() - Users-tab block/unblock, out of
--     scope entirely.
--   - recipe_is_visible()/recipe_is_editable(), and everything keyed off
--     them (recipes: update/delete, recipe_components/
--     recipe_component_alternatives/recipe_taste_tags policies) - this is
--     exactly what lets admin edit/delete a classic recipe's content.
--     Widening any of these would silently grant moderator the
--     classic-recipe-editing power the agreed scope explicitly excludes.
--   - "recipes: insert"'s is_admin() OR-branch - blocks batch-imported
--     classic authoring (createClassicRecipes()) at the RLS layer too,
--     defense in depth under the client-side UI hide in ImportTab.jsx.
--   - products' admin-update/admin-delete policies, "invitations: admin
--     manages" - confirmed out of scope.

create or replace function public.admin_promote_recipe_to_classic(p_recipe_id uuid)
returns public.recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
begin
  if not public.is_admin_or_moderator() then
    raise exception 'Only administrators or moderators can promote a recipe to classic.';
  end if;

  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found.';
  end if;

  if v_recipe.source_type <> 'user' then
    raise exception 'Only a community recipe can be promoted to classic.';
  end if;
  if v_recipe.visibility <> 'shared' or v_recipe.moderation_status <> 'active' then
    raise exception 'Only a published, active community recipe can be promoted.';
  end if;

  update public.recipes
  set source_type = 'classic',
      original_owner_id = owner_id,
      owner_id = null
  where id = p_recipe_id
  returning * into v_recipe;

  return v_recipe;
end;
$$;

revoke execute on function public.admin_promote_recipe_to_classic(uuid) from public, anon, authenticated;
grant execute on function public.admin_promote_recipe_to_classic(uuid) to authenticated;

create or replace function public.admin_demote_recipe_to_community(p_recipe_id uuid)
returns public.recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
begin
  if not public.is_admin_or_moderator() then
    raise exception 'Only administrators or moderators can demote a classic back to community.';
  end if;

  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found.';
  end if;

  if v_recipe.source_type <> 'classic' then
    raise exception 'Only a classic recipe can be demoted.';
  end if;
  if v_recipe.original_owner_id is null then
    raise exception 'This classic has no original community author to demote back to.';
  end if;

  update public.recipes
  set source_type = 'user',
      owner_id = original_owner_id,
      original_owner_id = null
  where id = p_recipe_id
  returning * into v_recipe;

  return v_recipe;
end;
$$;

revoke execute on function public.admin_demote_recipe_to_community(uuid) from public, anon, authenticated;
grant execute on function public.admin_demote_recipe_to_community(uuid) to authenticated;

-- unpublish_recipe() serves two callers, owner self-service and staff
-- moderation - only the staff branch widens. moderation_status's
-- 'unpublished_by_admin' literal is left exactly as-is for a
-- moderator-driven unpublish too: it's a two-value check constraint with
-- no UI copy branching on the literal itself (confirmed via grep), so a
-- third enum value would be unnecessary churn.
create or replace function public.unpublish_recipe(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
  v_is_owner boolean;
begin
  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found';
  end if;

  v_is_owner := coalesce(v_recipe.owner_id = auth.uid(), false);

  if not (v_is_owner or public.is_admin_or_moderator()) then
    raise exception 'Not authorized to unpublish this recipe';
  end if;

  update public.recipes
  set visibility = 'private',
      moderation_status = case when v_is_owner then 'active' else 'unpublished_by_admin' end
  where id = p_recipe_id;
end;
$$;

revoke execute on function public.unpublish_recipe(uuid) from public, anon, authenticated;
grant execute on function public.unpublish_recipe(uuid) to authenticated;
