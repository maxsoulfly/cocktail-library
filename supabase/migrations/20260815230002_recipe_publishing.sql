-- Publish/unpublish (spec §3, §4, §8.3). Both go through SECURITY DEFINER
-- functions rather than direct client updates, since step 6 already locked
-- visibility/moderation_status out of the general `recipes` UPDATE grant
-- specifically so this couldn't be bypassed by an owner just writing the
-- column directly.
--
-- Two distinct actions per the spec's permissions table: an owner can
-- unpublish their OWN recipe (self-service, no admin needed), and an admin
-- can additionally unpublish ANY community recipe (moderation) - which must
-- preserve the owner's private access, never delete. unpublish_recipe()
-- handles both paths based on who's calling, distinguishing the two via
-- moderation_status so the UI can tell "you took this private again" apart
-- from "an admin unpublished this".

alter table public.recipes add column published_at timestamptz;

create function public.publish_recipe(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipe public.recipes;
begin
  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found';
  end if;

  -- NULL-safe: v_recipe.owner_id is null for classic recipes, and
  -- `null = auth.uid()` evaluates to null, which a plain `if not (...)`
  -- would silently treat as "don't raise" (PL/pgSQL skips IF branches on
  -- NULL the same as on false) - coalesce forces it to a real false so a
  -- non-admin can never slip through on a classic recipe.
  if not (coalesce(v_recipe.owner_id = auth.uid(), false) or public.is_admin()) then
    raise exception 'Not authorized to publish this recipe';
  end if;

  if v_recipe.source_type <> 'user' then
    raise exception 'Only user recipes can be published';
  end if;

  update public.recipes
  set visibility = 'shared', moderation_status = 'active', published_at = now()
  where id = p_recipe_id;
end;
$$;

revoke execute on function public.publish_recipe(uuid) from public, anon, authenticated;
grant execute on function public.publish_recipe(uuid) to authenticated;

create function public.unpublish_recipe(p_recipe_id uuid)
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

  if not (v_is_owner or public.is_admin()) then
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
