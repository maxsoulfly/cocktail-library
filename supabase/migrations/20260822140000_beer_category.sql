-- Beer cocktails are real (Michelada, Black Velvet, shandy, snakebite) and
-- there was no ingredient category for beer at all - user-reported gap.
-- Same pattern as the Garnish category addition: a small starter set, not
-- an attempt to fabricate a full beer catalog. "Beer" is the generic type
-- (works for a shandy/Michelada, where any light beer will do); "Stout" is
-- the one specific style classic cocktails actually call out by name (Black
-- Velvet, a stout-and-champagne cocktail, genuinely needs a stout, not just
-- "a beer") - same generic-parent + specific-child shape already used for
-- Rum/Dark Rum and Whiskey/Bourbon-Scotch-Rye-Irish Whiskey.

insert into public.ingredient_categories (name, sort_order) values ('Beer', 100);

insert into public.ingredient_types (category_id, name, color, bar_priority)
values
  ((select id from public.ingredient_categories where name = 'Beer'), 'Beer', '#d97706', 'niche'),
  ((select id from public.ingredient_categories where name = 'Beer'), 'Stout', '#292524', 'niche');

update public.ingredient_types
set parent_type_id = (select id from public.ingredient_types where name = 'Beer' and category_id = (select id from public.ingredient_categories where name = 'Beer'))
where name = 'Stout' and category_id = (select id from public.ingredient_categories where name = 'Beer');
