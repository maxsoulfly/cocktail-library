-- Recipes, their components, and taste-tag links. Deliberately NOT in this
-- migration: substitution_groups and recipe_relationships (variations) -
-- schema for those lands when something actually consumes them (the
-- availability engine, or a future editor pass), not speculatively now.
--
-- source_type/visibility/moderation_status model classic vs. community vs.
-- private per the spec's §8.3: a recipe is visible when it's an active
-- shared recipe, or the caller owns it, or the caller is admin. "Community"
-- vs "private" in the UI is derived from visibility+moderation_status, not
-- stored separately.
--
-- This chunk only allows members to INSERT recipes as private
-- (source_type='user', visibility='private') - actually publishing
-- (visibility -> 'shared') is step 11's job, including whatever function/
-- grant change that needs; not opening that door yet.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source_type text not null check (source_type in ('classic', 'user')),
  owner_id uuid references public.profiles (id),
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  moderation_status text not null default 'active' check (moderation_status in ('active', 'unpublished_by_admin')),
  glass_id uuid not null references public.glasses (id),
  family_id uuid references public.cocktail_families (id),
  liquid_color text,
  steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint recipes_user_recipes_have_owner check (source_type <> 'user' or owner_id is not null)
);

comment on table public.recipes is 'Classic (owner_id null or admin), community (user + shared + active), or private (user + private) recipes - see docs/Cocktail_Library_Development_Spec.md §8.3.';

create index recipes_owner_id_idx on public.recipes (owner_id);

create table public.recipe_components (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_type_id uuid not null references public.ingredient_types (id),
  amount numeric not null default 0,
  unit_label text not null default 'ml',
  role text not null check (role in ('required', 'optional', 'garnish')),
  sort_order integer not null default 0
);

comment on column public.recipe_components.amount is 'Canonical ml when unit_label = ''ml''; 0 with unit_label carrying a semantic label (e.g. "2 dashes") for non-volume components - matches src/domain/availability.js formatAmount().';

create index recipe_components_recipe_id_idx on public.recipe_components (recipe_id);
create index recipe_components_ingredient_type_id_idx on public.recipe_components (ingredient_type_id);

create table public.recipe_taste_tags (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  taste_tag_id uuid not null references public.taste_tags (id) on delete cascade,
  primary key (recipe_id, taste_tag_id)
);

-- ── RLS helper functions ────────────────────────────────────────────────────

create function public.recipe_is_visible(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id
      and ( (r.visibility = 'shared' and r.moderation_status = 'active')
            or r.owner_id = auth.uid()
            or public.is_admin() )
  );
$$;

create function public.recipe_is_editable(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id
      and (r.owner_id = auth.uid() or public.is_admin())
  );
$$;

revoke execute on function public.recipe_is_visible(uuid) from public, anon, authenticated;
revoke execute on function public.recipe_is_editable(uuid) from public, anon, authenticated;
grant execute on function public.recipe_is_visible(uuid) to authenticated;
grant execute on function public.recipe_is_editable(uuid) to authenticated;

-- ── RLS: recipes ─────────────────────────────────────────────────────────────

alter table public.recipes enable row level security;

create policy "recipes: read" on public.recipes
  for select to authenticated using (
    (visibility = 'shared' and moderation_status = 'active')
    or owner_id = (select auth.uid())
    or public.is_admin()
  );

create policy "recipes: insert" on public.recipes
  for insert to authenticated with check (
    public.is_admin()
    or (owner_id = (select auth.uid()) and source_type = 'user' and visibility = 'private')
  );

create policy "recipes: update" on public.recipes
  for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "recipes: delete" on public.recipes
  for delete to authenticated using (owner_id = (select auth.uid()) or public.is_admin());

-- Column-restricted: owners (and admin, via this same grant) can edit
-- content, but not source_type/visibility/moderation_status/owner_id -
-- publishing/unpublishing gets its own function in step 11, same pattern as
-- redeem_invitation().
revoke update on public.recipes from authenticated;
grant update (name, description, glass_id, family_id, liquid_color, steps) on public.recipes to authenticated;

-- ── RLS: recipe_components / recipe_taste_tags ──────────────────────────────

alter table public.recipe_components enable row level security;

create policy "recipe_components: read" on public.recipe_components
  for select to authenticated using (public.recipe_is_visible(recipe_id));
create policy "recipe_components: insert" on public.recipe_components
  for insert to authenticated with check (public.recipe_is_editable(recipe_id));
create policy "recipe_components: update" on public.recipe_components
  for update to authenticated using (public.recipe_is_editable(recipe_id)) with check (public.recipe_is_editable(recipe_id));
create policy "recipe_components: delete" on public.recipe_components
  for delete to authenticated using (public.recipe_is_editable(recipe_id));

alter table public.recipe_taste_tags enable row level security;

create policy "recipe_taste_tags: read" on public.recipe_taste_tags
  for select to authenticated using (public.recipe_is_visible(recipe_id));
create policy "recipe_taste_tags: insert" on public.recipe_taste_tags
  for insert to authenticated with check (public.recipe_is_editable(recipe_id));
create policy "recipe_taste_tags: delete" on public.recipe_taste_tags
  for delete to authenticated using (public.recipe_is_editable(recipe_id));
