-- Adds the "Garnish" category the spec's own suggested category list names
-- (docs/Cocktail_Library_Development_Spec.md §8.2: "Spirit, liqueur, mixer,
-- syrup, juice, garnish, etc.") but that never existed - raw fruit used for
-- garnish (an orange twist, a lemon wheel, muddled berries) had no
-- ingredient type to point to at all, only the juiced form (Lemon Juice,
-- Lime Juice under Juice). Distinct from Juice: these are whole/garnish
-- items, not liquid recipe components. Placed last alongside
-- Bitters/Herb/Juice, matching the "long-tail categories trail" ordering
-- from the previous migration.
--
-- Starter set only (Orange, Lemon, Lime, Cherry, Berries) - a deliberately
-- small, user-requested set, not an attempt to fabricate a full garnish
-- catalog; further growth belongs to batch import (step 12) once it exists.

insert into public.ingredient_categories (name, sort_order) values ('Garnish', 90);

insert into public.ingredient_types (category_id, name, color, bar_priority)
values
  ((select id from public.ingredient_categories where name = 'Garnish'), 'Orange', '#fb923c', 'common'),
  ((select id from public.ingredient_categories where name = 'Garnish'), 'Lemon', '#fde047', 'common'),
  ((select id from public.ingredient_categories where name = 'Garnish'), 'Lime', '#84cc16', 'common'),
  ((select id from public.ingredient_categories where name = 'Garnish'), 'Cherry', '#dc2626', 'common'),
  ((select id from public.ingredient_categories where name = 'Garnish'), 'Berries', '#831843', 'common');
