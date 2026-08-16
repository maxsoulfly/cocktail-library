-- Two taxonomy improvements requested after browsing the catalog:
--
-- 1. Categories had no explicit display order (client sorted alphabetically,
--    which put "Spirit" near the bottom). Adds sort_order so Spirits leads
--    and the long-tail categories (Bitters/Herb/Juice) trail.
--
-- 2. "Spirit" was flat - Gin, Bourbon, Dark Rum, Vodka, and Tequila all sat
--    as siblings, so browsing/adding more rum or whiskey styles would just
--    dump them in one undifferentiated list. ingredient_types.parent_type_id
--    already exists for exactly this (see 20260815200430's comment: "Spirit
--    -> Gin -> London Dry Gin") but was never populated. Adds "Rum" and
--    "Whiskey" as mid-level grouping types under Spirit and reparents the
--    existing styles under them - Dark Rum under Rum, Bourbon under Whiskey.
--    Bonus: resolveOwnedIngredientTypes() (src/domain/availability.js)
--    already walks parent_type_id, so owning "Dark Rum" now also satisfies
--    any future recipe that calls for generic "Rum".
--
-- Also folds "Citrus" into "Juice" - broader and matches the spec's own
-- suggested category list (docs/Cocktail_Library_Development_Spec.md
-- §8.2: "ingredient_categories: Spirit, liqueur, mixer, syrup, juice,
-- garnish, etc."). Future juices (pineapple, orange, cranberry...) become
-- types within Juice, not new categories - same fix as Spirit/Rum, just one
-- level up.
--
-- Note: a "Juice" category (and an unrelated, still-empty "Wine" category)
-- already existed in the live DB with no tracked migration behind them - not
-- something this migration created or explains. Merging into the existing
-- "Juice" row rather than renaming "Citrus" to avoid the resulting unique-
-- name collision; "Wine" is left untouched since it's outside this chunk's
-- scope and has no types to move.

alter table public.ingredient_categories add column sort_order integer not null default 0;

update public.ingredient_categories set sort_order = 0 where name = 'Spirit';
update public.ingredient_categories set sort_order = 10 where name = 'Liqueur';
update public.ingredient_categories set sort_order = 20 where name = 'Vermouth';
update public.ingredient_categories set sort_order = 30 where name = 'Mixer';
update public.ingredient_categories set sort_order = 40 where name = 'Sweetener';
update public.ingredient_categories set sort_order = 50 where name = 'Other';
update public.ingredient_categories set sort_order = 60 where name = 'Bitters';
update public.ingredient_categories set sort_order = 70 where name = 'Herb';
update public.ingredient_categories set sort_order = 80 where name = 'Juice';

update public.ingredient_types
set category_id = (select id from public.ingredient_categories where name = 'Juice')
where category_id = (select id from public.ingredient_categories where name = 'Citrus');

delete from public.ingredient_categories where name = 'Citrus';

insert into public.ingredient_types (category_id, name, color, bar_priority)
values
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Rum', '#92400e', 'common'),
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Whiskey', '#b45309', 'common');

update public.ingredient_types
set parent_type_id = (select id from public.ingredient_types where name = 'Rum')
where name = 'Dark Rum';

update public.ingredient_types
set parent_type_id = (select id from public.ingredient_types where name = 'Whiskey')
where name = 'Bourbon';
