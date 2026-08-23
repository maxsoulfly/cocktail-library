-- Turns the recipe/ingredient-type liquid-color swatch picker from a fixed
-- 10-value hardcoded list (LIQUID_COLORS in src/data/constants.js) into a
-- real admin-manageable catalog table, same shape and RLS as glasses/
-- taste_tags/cocktail_families. User request: "we need more colors" - hit
-- while trying to add Creme de Violette, which the existing palette (no
-- true violet, no blue at all) had no good match for. Recipes and
-- ingredient_types keep storing a plain hex string exactly as they already
-- do - this table is purely the curated list of options the picker offers
-- as swatches, not a foreign key target, so nothing about how a color is
-- stored changes, only where the picker's suggestions come from.

create table public.liquid_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text not null unique check (hex ~* '^#[0-9a-f]{6}$')
);

comment on table public.liquid_colors is 'Curated color-swatch options for the recipe/ingredient-type liquid-color picker. Not a foreign key target - recipes.liquid_color and ingredient_types.color both stay plain hex strings, free to be any value (including one not in this list, e.g. typed directly) - this table only supplies the picker''s suggested swatches.';

alter table public.liquid_colors enable row level security;
create policy "liquid_colors: members read" on public.liquid_colors for select using (public.is_member());
create policy "liquid_colors: admin writes" on public.liquid_colors for all using (public.is_admin()) with check (public.is_admin());

-- Seed with the exact 10 values LIQUID_COLORS already had, so nothing
-- visually changes for existing recipes/ingredient types by default.
insert into public.liquid_colors (name, hex) values
  ('Clear', '#dbeafe'),
  ('Pale Gold', '#fef3c7'),
  ('Amber', '#d97706'),
  ('Brown', '#78350f'),
  ('Red', '#dc2626'),
  ('Orange', '#f97316'),
  ('Pink', '#f472b6'),
  ('Green', '#65a30d'),
  ('Purple', '#a78bfa'),
  ('Cyan', '#22d3ee'),
  ('Deep Violet', '#6b21a8'),
  ('Blue', '#2563eb');
