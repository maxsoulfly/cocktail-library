-- Tighten admin edit/delete rights to the classic catalog (owner_id null)
-- only, per spec §4: "Edit another user's recipe: No by default" applies to
-- admins too, not just members. The original recipe_is_editable() and the
-- recipes UPDATE/DELETE policies (20260815214307) let an admin edit or
-- delete ANY user's private or community recipe, which is broader than the
-- spec intends and was never exercised by any UI - real admin recipe
-- management is scoped to the ownerless classic catalog. Moderation of a
-- *published* community recipe (unpublish, not edit/delete) is unaffected -
-- that's the separate unpublish_recipe() function from step 11, which
-- already checks is_admin() independently of recipe_is_editable().

create or replace function public.recipe_is_editable(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id
      and (r.owner_id = auth.uid() or (r.owner_id is null and public.is_admin()))
  );
$$;

drop policy "recipes: update" on public.recipes;
create policy "recipes: update" on public.recipes
  for update to authenticated
  using (owner_id = (select auth.uid()) or (owner_id is null and public.is_admin()))
  with check (owner_id = (select auth.uid()) or (owner_id is null and public.is_admin()));

drop policy "recipes: delete" on public.recipes;
create policy "recipes: delete" on public.recipes
  for delete to authenticated using (owner_id = (select auth.uid()) or (owner_id is null and public.is_admin()));
