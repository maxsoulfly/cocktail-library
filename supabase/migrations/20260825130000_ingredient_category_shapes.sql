-- Category-level pictograms, on top of the per-type ones from
-- 20260825110000. User request, tied explicitly to mobile ergonomics
-- ("It's going to be a mobile app, we need icons, and place for big
-- fingers.") - the category header labels in My Bar (SPIRIT, WINE, ...) are
-- currently plain text with no visual anchor.
--
-- Reuses the exact same 11-value INGREDIENT_SHAPES enum ingredient_types
-- already uses, via the same ShapePicker (kind="ingredient") - a category
-- icon is just a coarser-grained version of the same pictogram set, not a
-- new icon language. Same not-null-default/backfill/check-constraint-last
-- sequencing as every prior shape column in this codebase.
--
-- Backfilled per the mode of each category's own member types' shapes
-- (queried directly against the live catalog) - a sane starting point, not
-- a final answer; admin/moderator can repoint any category's icon via the
-- same picker afterward, same as every other shape field.
--
-- Deliberately no color field alongside it (unlike ingredient_types.color,
-- which IngredientIcon's fillColor uses for the "real ingredient color"
-- effect) - a category groups many differently-colored types, so there's
-- no single real color to show. Category icons render as flat neutral
-- (IngredientIcon's fillColor defaults to its outline color when omitted).

alter table public.ingredient_categories
  add column shape text not null default 'spirit_bottle';

update public.ingredient_categories set shape = 'spirit_bottle' where name in ('Spirit', 'Liqueur', 'Vermouth');
update public.ingredient_categories set shape = 'wine_bottle' where name = 'Wine';
update public.ingredient_categories set shape = 'beer' where name = 'Beer';
update public.ingredient_categories set shape = 'soda_can' where name = 'Mixer';
update public.ingredient_categories set shape = 'fruit' where name in ('Garnish', 'Juice');
update public.ingredient_categories set shape = 'herb' where name = 'Herb';
update public.ingredient_categories set shape = 'dropper' where name = 'Bitters';
update public.ingredient_categories set shape = 'jar' where name in ('Sweetener', 'Other');
update public.ingredient_categories set shape = 'sauce_bottle' where name = 'Sauce';
update public.ingredient_categories set shape = 'dairy' where name = 'Dairy & Eggs';

alter table public.ingredient_categories
  add constraint ingredient_categories_shape_check
  check (shape in (
    'spirit_bottle', 'wine_bottle', 'beer', 'soda_can', 'fruit', 'herb',
    'dropper', 'jar', 'sauce_bottle', 'dairy', 'ice'
  ));
