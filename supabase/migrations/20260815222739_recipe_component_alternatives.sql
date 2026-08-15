-- Substitution support, deferred from step 6 until the availability engine
-- (this chunk) actually consumes it. Modeled as additional acceptable types
-- per component slot ("gin OR vodka") rather than a separate named
-- substitution_groups entity - recipe_components already IS the slot, so a
-- companion alternatives table is the whole thing. recipe_id is denormalized
-- from the parent component for RLS simplicity, matching recipe_components/
-- recipe_taste_tags.

create table public.recipe_component_alternatives (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  recipe_component_id uuid not null references public.recipe_components (id) on delete cascade,
  ingredient_type_id uuid not null references public.ingredient_types (id),
  unique (recipe_component_id, ingredient_type_id)
);

comment on table public.recipe_component_alternatives is 'Additional ingredient types that also satisfy a recipe_components slot - the "one allowed item from its substitution group" rule from the spec''s availability matching section.';

create index recipe_component_alternatives_recipe_id_idx on public.recipe_component_alternatives (recipe_id);
create index recipe_component_alternatives_component_id_idx on public.recipe_component_alternatives (recipe_component_id);

alter table public.recipe_component_alternatives enable row level security;

create policy "recipe_component_alternatives: read" on public.recipe_component_alternatives
  for select to authenticated using (public.recipe_is_visible(recipe_id));
create policy "recipe_component_alternatives: insert" on public.recipe_component_alternatives
  for insert to authenticated with check (public.recipe_is_editable(recipe_id));
create policy "recipe_component_alternatives: delete" on public.recipe_component_alternatives
  for delete to authenticated using (public.recipe_is_editable(recipe_id));
