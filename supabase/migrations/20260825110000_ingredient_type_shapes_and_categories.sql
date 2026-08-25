-- Adds pictograms for My Bar (currently just a flat color swatch per type,
-- user feedback: "looks messy and incomplete") and cleans up two real data
-- gaps found while designing them, per direct user request:
--
-- 1. "Sauce" and "Dairy & Eggs" are new categories, split out of the
--    "Other" catch-all (Tabasco/Soy Sauce/Worcestershire Sauce;
--    Egg White/Fresh Cream/Aquafaba). Both start small (3 items each) but
--    are expected to grow. Neither gets parent_type_id relationships
--    between its members - unlike Rum's Spiced/White Rum, these items
--    aren't substitutes for each other, so this is purely a display/
--    organization grouping, not a substitution family.
-- 2. Wine's sort_order (0, colliding with Spirit) was never set by any
--    tracked migration - confirmed live-DB drift from UI-driven testing,
--    not something this migration created. Given a proper value here.
--
-- shape follows the same pattern glasses.shape/cocktail_families.shape
-- already established (20260822160000_glass_shape.sql /
-- 20260823140000_cocktail_family_shapes.sql): not null with a fallback
-- default, backfilled, check constraint added last. Unlike those two,
-- shape lives per ingredient TYPE rather than being derivable from one
-- name-like column, because a handful of items (Salt, sugars, seasonings)
-- don't share their category's obvious pictogram - see
-- src/data/constants.js's INGREDIENT_SHAPES comment.

alter table public.ingredient_types
  add column shape text not null default 'spirit_bottle';

-- Fix Wine's untracked sort_order before adding the two new categories,
-- so all category ordering is deliberate going forward.
update public.ingredient_categories set sort_order = 5 where name = 'Wine';

insert into public.ingredient_categories (name, sort_order) values
  ('Dairy & Eggs', 45),
  ('Sauce', 55);

update public.ingredient_types
set category_id = (select id from public.ingredient_categories where name = 'Sauce')
where name in ('Tabasco', 'Soy sauce', 'Worcestershire Sauce');

update public.ingredient_types
set category_id = (select id from public.ingredient_categories where name = 'Dairy & Eggs')
where name in ('Egg White', 'Fresh Cream', 'Aquafaba');

-- Backfill by category first (the common case for every category)...
update public.ingredient_types t set shape = 'spirit_bottle'
from public.ingredient_categories c
where t.category_id = c.id and c.name in ('Spirit', 'Liqueur', 'Vermouth');

update public.ingredient_types t set shape = 'wine_bottle'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Wine';

update public.ingredient_types t set shape = 'beer'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Beer';

update public.ingredient_types t set shape = 'soda_can'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Mixer';

update public.ingredient_types t set shape = 'fruit'
from public.ingredient_categories c
where t.category_id = c.id and c.name in ('Garnish', 'Juice');

update public.ingredient_types t set shape = 'herb'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Herb';

update public.ingredient_types t set shape = 'dropper'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Bitters';

update public.ingredient_types t set shape = 'jar'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Sweetener';

update public.ingredient_types t set shape = 'sauce_bottle'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Sauce';

update public.ingredient_types t set shape = 'dairy'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Dairy & Eggs';

-- "Other" is a genuine grab-bag with no single fitting pictogram - jar
-- (pantry/seasoning) is the closest default, overridden per-row below for
-- the couple of items that don't fit even that.
update public.ingredient_types t set shape = 'jar'
from public.ingredient_categories c
where t.category_id = c.id and c.name = 'Other';

-- ...then per-type overrides for items whose category default doesn't fit.
update public.ingredient_types set shape = 'jar' where name in ('Salt', 'Nutmeg', 'Olives');
update public.ingredient_types set shape = 'ice' where name = 'Ice';
update public.ingredient_types set shape = 'fruit' where name = 'White Peach Purée';

alter table public.ingredient_types
  add constraint ingredient_types_shape_check
  check (shape in (
    'spirit_bottle', 'wine_bottle', 'beer', 'soda_can', 'fruit', 'herb',
    'dropper', 'jar', 'sauce_bottle', 'dairy', 'ice'
  ));
