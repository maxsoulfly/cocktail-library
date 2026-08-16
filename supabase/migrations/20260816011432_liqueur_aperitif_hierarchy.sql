-- Same technique as the previous migration's Spirit/Rum/Whiskey grouping,
-- applied to Liqueur: Campari and Aperol are both bitter aperitif-style
-- liqueurs, so they get an "Aperitif" parent type. Also adds an empty
-- "Digestif" parent now, matching the precedent set by Rum/Whiskey (both
-- created with a single child at the time) - ready to receive
-- Amaretto/Kahlua/Chartreuse/etc. via later batch import without needing a
-- restructuring migration then. Triple Sec is neither an aperitif nor a
-- digestif (it's a mixing/orange liqueur) and is left unparented under
-- Liqueur directly, same as any other type with no natural sibling group
-- yet.

insert into public.ingredient_types (category_id, name, color, bar_priority)
values
  ((select id from public.ingredient_categories where name = 'Liqueur'), 'Aperitif', '#dc2626', 'common'),
  ((select id from public.ingredient_categories where name = 'Liqueur'), 'Digestif', '#78350f', 'common');

update public.ingredient_types
set parent_type_id = (select id from public.ingredient_types where name = 'Aperitif')
where name in ('Campari', 'Aperol');
