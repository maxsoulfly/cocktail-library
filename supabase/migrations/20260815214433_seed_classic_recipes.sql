-- Minimal, clearly-labeled classic-recipe fixtures (per the spec: no
-- fabricated large catalog - the real catalog enters through admin batch
-- import). Adds two ingredient types and five taste tags these recipes need
-- that weren't already seeded in 20260815200430_initial_schema.sql's seed
-- pass, then eight real classic cocktails with components and taste tags.

insert into public.ingredient_types (category_id, name, color, bar_priority) values
  ((select id from public.ingredient_categories where name = 'Sweetener'), 'White Sugar', '#fefce8', 'common'),
  ((select id from public.ingredient_categories where name = 'Other'), 'Egg White', '#fefce8', 'specialized');

insert into public.taste_tags (name) values
  ('Aromatic'), ('Crisp'), ('Minty'), ('Salty'), ('Frothy');

-- ── Negroni ──────────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Negroni', 'A perfectly balanced Italian aperitivo. Gin, Campari, and sweet vermouth in equal parts - stirred, never shaken.',
   'classic', 'shared',
   (select id from public.glasses where name = 'rocks'),
   (select id from public.cocktail_families where name = 'Stirred'),
   '#c2410c',
   array['Fill a rocks glass with a large ice cube.', 'Combine gin, Campari, and sweet vermouth directly in the glass.', 'Stir gently for 20 seconds.', 'Express a wide orange peel over the drink and use as garnish.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Negroni'), (select id from public.ingredient_types where name = 'Gin'), 30, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Negroni'), (select id from public.ingredient_types where name = 'Campari'), 30, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Negroni'), (select id from public.ingredient_types where name = 'Sweet Vermouth'), 30, 'ml', 'required', 3);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Negroni'), (select id from public.taste_tags where name = 'Bitter')),
  ((select id from public.recipes where name = 'Negroni'), (select id from public.taste_tags where name = 'Herbal')),
  ((select id from public.recipes where name = 'Negroni'), (select id from public.taste_tags where name = 'Citrus'));

-- ── Old Fashioned ────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Old Fashioned', 'The original cocktail. Bourbon sweetened with sugar and seasoned with bitters - simple, timeless.',
   'classic', 'shared',
   (select id from public.glasses where name = 'rocks'),
   (select id from public.cocktail_families where name = 'Stirred'),
   '#b45309',
   array['Place a sugar cube in a rocks glass and saturate with bitters.', 'Add a splash of water and muddle until dissolved.', 'Add a large ice cube and pour bourbon over it.', 'Stir briefly to combine. Garnish with an orange peel.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.ingredient_types where name = 'Bourbon'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.ingredient_types where name = 'Angostura Bitters'), 0, '2 dashes', 'required', 2),
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.ingredient_types where name = 'White Sugar'), 0, '1 cube', 'required', 3);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.taste_tags where name = 'Whiskey')),
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.taste_tags where name = 'Sweet')),
  ((select id from public.recipes where name = 'Old Fashioned'), (select id from public.taste_tags where name = 'Aromatic'));

-- ── Daiquiri ─────────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Daiquiri', 'Rum, lime, sugar - nothing more. The daiquiri is a lesson in restraint and balance that rewards quality ingredients.',
   'classic', 'shared',
   (select id from public.glasses where name = 'coupe'),
   (select id from public.cocktail_families where name = 'Sours'),
   '#bef264',
   array['Combine all ingredients in a cocktail shaker with ice.', 'Shake vigorously for 12-15 seconds.', 'Double-strain into a chilled coupe glass.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.ingredient_types where name = 'Dark Rum'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.ingredient_types where name = 'Lime Juice'), 30, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.ingredient_types where name = 'Simple Syrup'), 15, 'ml', 'required', 3);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.taste_tags where name = 'Citrus')),
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.taste_tags where name = 'Sweet')),
  ((select id from public.recipes where name = 'Daiquiri'), (select id from public.taste_tags where name = 'Crisp'));

-- ── Mojito ───────────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Mojito', 'Cuba''s most famous cocktail. Rum, lime, and mint - long, cool, and essential for any warm evening.',
   'classic', 'shared',
   (select id from public.glasses where name = 'highball'),
   (select id from public.cocktail_families where name = 'Highball'),
   '#86efac',
   array['Lightly muddle mint leaves with sugar and lime juice.', 'Fill a highball glass with crushed ice.', 'Pour rum over the ice and top with soda water.', 'Stir gently. Garnish with a mint sprig and lime wheel.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Mojito'), (select id from public.ingredient_types where name = 'Dark Rum'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.ingredient_types where name = 'Lime Juice'), 30, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.ingredient_types where name = 'White Sugar'), 0, '2 tsp', 'required', 3),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.ingredient_types where name = 'Fresh Mint'), 0, '8 leaves', 'required', 4),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.ingredient_types where name = 'Soda Water'), 60, 'ml', 'required', 5);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Mojito'), (select id from public.taste_tags where name = 'Refreshing')),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.taste_tags where name = 'Minty')),
  ((select id from public.recipes where name = 'Mojito'), (select id from public.taste_tags where name = 'Citrus'));

-- ── Gin & Tonic ──────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Gin & Tonic', 'Deceptively simple, infinitely variable. Good gin and quality tonic water are all this needs.',
   'classic', 'shared',
   (select id from public.glasses where name = 'highball'),
   (select id from public.cocktail_families where name = 'Highball'),
   '#bae6fd',
   array['Fill a large highball glass with ice cubes.', 'Add gin.', 'Gently pour tonic water over the back of a bar spoon to preserve carbonation.', 'Garnish with a lime wedge or cucumber slice.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Gin & Tonic'), (select id from public.ingredient_types where name = 'Gin'), 50, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Gin & Tonic'), (select id from public.ingredient_types where name = 'Tonic Water'), 150, 'ml', 'required', 2);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Gin & Tonic'), (select id from public.taste_tags where name = 'Refreshing')),
  ((select id from public.recipes where name = 'Gin & Tonic'), (select id from public.taste_tags where name = 'Herbal')),
  ((select id from public.recipes where name = 'Gin & Tonic'), (select id from public.taste_tags where name = 'Bitter'));

-- ── Margarita ────────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Margarita', 'Mexico''s most beloved cocktail export. Bright, sharp, and endlessly refreshing with a salted rim.',
   'classic', 'shared',
   (select id from public.glasses where name = 'coupe'),
   (select id from public.cocktail_families where name = 'Sours'),
   '#d9f99d',
   array['Salt the rim of a coupe glass.', 'Combine tequila, triple sec, and lime juice in a shaker with ice.', 'Shake vigorously for 12 seconds.', 'Strain into the prepared glass.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Margarita'), (select id from public.ingredient_types where name = 'Tequila'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Margarita'), (select id from public.ingredient_types where name = 'Triple Sec'), 30, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Margarita'), (select id from public.ingredient_types where name = 'Lime Juice'), 30, 'ml', 'required', 3);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Margarita'), (select id from public.taste_tags where name = 'Citrus')),
  ((select id from public.recipes where name = 'Margarita'), (select id from public.taste_tags where name = 'Tequila')),
  ((select id from public.recipes where name = 'Margarita'), (select id from public.taste_tags where name = 'Salty'));

-- ── Moscow Mule ──────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Moscow Mule', 'Vodka sharpened by ginger beer and lime. Traditionally served in a copper mug for extra chill.',
   'classic', 'shared',
   (select id from public.glasses where name = 'highball'),
   (select id from public.cocktail_families where name = 'Highball'),
   '#fef9c3',
   array['Fill a highball glass or copper mug with ice.', 'Add vodka and lime juice.', 'Top with ginger beer and stir gently.', 'Garnish with a lime wheel.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.ingredient_types where name = 'Vodka'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.ingredient_types where name = 'Ginger Beer'), 120, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.ingredient_types where name = 'Lime Juice'), 15, 'ml', 'required', 3);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.taste_tags where name = 'Spicy')),
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.taste_tags where name = 'Refreshing')),
  ((select id from public.recipes where name = 'Moscow Mule'), (select id from public.taste_tags where name = 'Citrus'));

-- ── Whiskey Sour ─────────────────────────────────────────────────────────────
insert into public.recipes (name, description, source_type, visibility, glass_id, family_id, liquid_color, steps) values
  ('Whiskey Sour', 'The sour template at its most approachable. Egg white is optional but gives a gorgeous foam.',
   'classic', 'shared',
   (select id from public.glasses where name = 'rocks'),
   (select id from public.cocktail_families where name = 'Sours'),
   '#fcd34d',
   array['Dry shake all ingredients (no ice) for 10 seconds if using egg white.', 'Add ice and shake vigorously for 15 seconds.', 'Strain over fresh ice into a rocks glass.', 'Garnish with a few drops of Angostura on the foam.']);

insert into public.recipe_components (recipe_id, ingredient_type_id, amount, unit_label, role, sort_order) values
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.ingredient_types where name = 'Bourbon'), 60, 'ml', 'required', 1),
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.ingredient_types where name = 'Lemon Juice'), 30, 'ml', 'required', 2),
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.ingredient_types where name = 'Simple Syrup'), 20, 'ml', 'required', 3),
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.ingredient_types where name = 'Egg White'), 0, '1 egg white', 'optional', 4);

insert into public.recipe_taste_tags (recipe_id, taste_tag_id) values
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.taste_tags where name = 'Citrus')),
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.taste_tags where name = 'Whiskey')),
  ((select id from public.recipes where name = 'Whiskey Sour'), (select id from public.taste_tags where name = 'Frothy'));
