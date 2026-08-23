-- Admin promote/demote between community and classic (user request, not
-- from the spec/backlog): a published community recipe can become part of
-- the canonical classic catalog, and a promoted one can be reverted back to
-- an ordinary community recipe under its original author.
--
-- The catalog has always modeled a classic as owner_id null (source_type
-- 'classic') - every existing admin feature this session (the Classic
-- Recipes tab's Edit/Delete, recipe_is_editable()) depends on that
-- invariant to decide what admin can manage. Promotion can't just flip
-- source_type while leaving owner_id pointed at the original author -
-- that would make recipe_is_editable() let the ORIGINAL MEMBER keep
-- editing/deleting what's now supposed to be admin-managed catalog, and
-- block admin from managing it through the Classic Recipes tab at all.
--
-- original_owner_id preserves the "keep the user attached" requirement
-- without disturbing that invariant: it's a separate, purely-informational
-- column, never read by any RLS policy or authorization check. Promotion
-- copies owner_id into it and nulls owner_id; demotion restores owner_id
-- from it and clears it again (once source_type is back to 'user', owner_id
-- alone is authoritative - keeping a stale duplicate afterward would just
-- be confusing). A "true" classic that was never a community recipe (batch
-- imported or admin-authored directly) has original_owner_id null and
-- simply can't be demoted - there's no original author to hand it back to.

alter table public.recipes add column original_owner_id uuid references public.profiles (id);

comment on column public.recipes.original_owner_id is 'Set only by admin_promote_recipe_to_classic() / cleared by admin_demote_recipe_to_community() - the community author a promoted classic is attributed to, kept separate from owner_id so recipe_is_editable() and every admin classic-management feature keep treating this row as ownerless/admin-managed once promoted.';

create function public.admin_promote_recipe_to_classic(p_recipe_id uuid)
returns public.recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can promote a recipe to classic.';
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

create function public.admin_demote_recipe_to_community(p_recipe_id uuid)
returns public.recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can demote a classic back to community.';
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
