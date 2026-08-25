-- Admin-only duplicate-ingredient-type merge tool. Real user report: two
-- rows ("Black Pepper" and "Pepper") ended up referring to the same real
-- ingredient, added independently while testing - the user's own words:
-- "if the app is going to be used and moderated, some things will be
-- double, human mistakes etc." This is expected to recur, so it's a real
-- admin tool, not a one-off manual fix.
--
-- Deliberately admin-only, not is_admin_or_moderator() - unlike ordinary
-- catalog authoring (moderator's existing scope), a merge is a bulk,
-- effectively irreversible operation that silently rewrites every
-- recipe/product/inventory row referencing the deleted type. Scoping
-- confirmed with the user before writing this.
--
-- Six tables reference ingredient_types.id and each needs its own
-- handling, not a single blind UPDATE, because of real constraints:
--   - ingredient_types.parent_type_id: no ON DELETE clause (defaults to
--     RESTRICT) - any child of the loser must be re-pointed at the
--     survivor before the loser can be deleted, or the delete fails.
--   - recipe_components.ingredient_type_id: RESTRICT, no unique
--     constraint on (recipe_id, ingredient_type_id) - plain reassignment
--     is always safe.
--   - recipe_component_alternatives.ingredient_type_id: RESTRICT, real
--     unique(recipe_component_id, ingredient_type_id) - if the same
--     component already has both loser and survivor as alternatives,
--     reassigning would collide. Delete the redundant loser row first.
--   - products.ingredient_type_id: RESTRICT, no relevant unique
--     constraint - plain reassignment is safe.
--   - user_inventory.ingredient_type_id: CASCADE (would silently delete
--     ownership rows on a naive delete-the-loser approach, losing real
--     user data) and real unique(user_id, ingredient_type_id) - if a user
--     already owns the survivor, the loser's row is redundant and
--     dropped; otherwise reassigned.
--   - ingredient_aliases.ingredient_type_id: CASCADE, but existing loser
--     aliases should follow the type to the survivor rather than vanish -
--     already globally unique by alias text (20260822150000), so
--     reassignment can never collide with the survivor's own aliases.
--
-- p_add_alias optionally preserves the loser's own name as a new alias of
-- the survivor, so a future import/search using the old name still
-- resolves instead of silently failing to match (reopening the exact
-- duplicate problem this function exists to fix) - a UI checkbox per
-- merge, not a default baked in here, since the old name might be a
-- genuine typo not worth preserving.

create function public.admin_merge_ingredient_type(
  p_loser_id uuid,
  p_survivor_id uuid,
  p_add_alias boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loser public.ingredient_types;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can merge ingredient types.';
  end if;
  if p_loser_id = p_survivor_id then
    raise exception 'Cannot merge a type into itself.';
  end if;

  select * into v_loser from public.ingredient_types where id = p_loser_id;
  if not found then
    raise exception 'The ingredient type being merged away no longer exists.';
  end if;
  if not exists (select 1 from public.ingredient_types where id = p_survivor_id) then
    raise exception 'The surviving ingredient type does not exist.';
  end if;

  -- Refuse to merge a type into one of its own descendants - would leave
  -- the reassigned children (below) pointed at a parent inside the
  -- subtree being collapsed, an impossible/cyclic hierarchy.
  if exists (
    with recursive descendants as (
      select id from public.ingredient_types where parent_type_id = p_loser_id
      union all
      select t.id from public.ingredient_types t
        join descendants d on t.parent_type_id = d.id
    )
    select 1 from descendants where id = p_survivor_id
  ) then
    raise exception 'Cannot merge a type into one of its own children.';
  end if;

  update public.ingredient_types set parent_type_id = p_survivor_id
  where parent_type_id = p_loser_id;

  update public.recipe_components set ingredient_type_id = p_survivor_id
  where ingredient_type_id = p_loser_id;

  delete from public.recipe_component_alternatives a
  where a.ingredient_type_id = p_loser_id
    and exists (
      select 1 from public.recipe_component_alternatives b
      where b.recipe_component_id = a.recipe_component_id
        and b.ingredient_type_id = p_survivor_id
    );
  update public.recipe_component_alternatives set ingredient_type_id = p_survivor_id
  where ingredient_type_id = p_loser_id;

  update public.products set ingredient_type_id = p_survivor_id
  where ingredient_type_id = p_loser_id;

  delete from public.user_inventory u
  where u.ingredient_type_id = p_loser_id
    and exists (
      select 1 from public.user_inventory v
      where v.user_id = u.user_id and v.ingredient_type_id = p_survivor_id
    );
  update public.user_inventory set ingredient_type_id = p_survivor_id
  where ingredient_type_id = p_loser_id;

  update public.ingredient_aliases set ingredient_type_id = p_survivor_id
  where ingredient_type_id = p_loser_id;

  if p_add_alias then
    insert into public.ingredient_aliases (alias, ingredient_type_id)
    values (v_loser.name, p_survivor_id)
    on conflict (lower(alias)) do nothing;
  end if;

  delete from public.ingredient_types where id = p_loser_id;
end;
$$;

revoke execute on function public.admin_merge_ingredient_type(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_merge_ingredient_type(uuid, uuid, boolean) to authenticated;
