-- Aperitif and Digestif were modeled as parent ingredient types (Spirit ->
-- Gin -> London Dry Gin style), but unlike a Gin sub-style, their children
-- aren't real substitutes for each other in a recipe (a Negroni needs
-- Campari specifically, not "any Aperitif" the way a generic Rum recipe can
-- take Dark or White Rum). The parent-covers-child availability logic was
-- implying a substitutability that was never true, and nobody actually owns
-- a bottle of generic "Aperitif" or "Digestif". No recipe references either
-- type directly (checked before writing this migration), so flattening is
-- safe. Rum and Whiskey keep their existing hierarchy - Rum is actively used
-- by a real recipe's generic "Rum" component, and Whiskey's grouping is
-- being kept for now per a separate product decision.
update public.ingredient_types
set parent_type_id = null
where parent_type_id in (
  select id from public.ingredient_types where name in ('Aperitif', 'Digestif')
);

delete from public.ingredient_types where name in ('Aperitif', 'Digestif');
