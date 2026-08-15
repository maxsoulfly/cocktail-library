-- Minimal, clearly-labeled development fixtures for the taxonomy tables only
-- (per docs/Cocktail_Library_Development_Spec.md: no fabricated large catalog -
-- the real catalog enters through admin batch import). Products, recipes, and
-- everything user-owned are seeded by their own migrations/fixtures later.

insert into public.ingredient_categories (name) values
  ('Spirit'), ('Liqueur'), ('Vermouth'), ('Bitters'), ('Mixer'), ('Juice'), ('Citrus'), ('Sweetener'), ('Herb'), ('Wine'), ('Other');

insert into public.ingredient_types (category_id, name, color, bar_priority) values
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Gin', '#bae6fd', 'essential'),
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Bourbon', '#b45309', 'essential'),
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Dark Rum', '#92400e', 'essential'),
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Vodka', '#e0f2fe', 'essential'),
  ((select id from public.ingredient_categories where name = 'Spirit'), 'Tequila', '#e8f4f8', 'common'),
  ((select id from public.ingredient_categories where name = 'Liqueur'), 'Campari', '#dc2626', 'common'),
  ((select id from public.ingredient_categories where name = 'Liqueur'), 'Triple Sec', '#fef9c3', 'common'),
  ((select id from public.ingredient_categories where name = 'Liqueur'), 'Aperol', '#f97316', 'specialized'),
  ((select id from public.ingredient_categories where name = 'Vermouth'), 'Sweet Vermouth', '#92400e', 'common'),
  ((select id from public.ingredient_categories where name = 'Vermouth'), 'Dry Vermouth', '#fef9c3', 'common'),
  ((select id from public.ingredient_categories where name = 'Bitters'), 'Angostura Bitters', '#78350f', 'essential'),
  ((select id from public.ingredient_categories where name = 'Mixer'), 'Tonic Water', '#f0f9ff', 'essential'),
  ((select id from public.ingredient_categories where name = 'Mixer'), 'Soda Water', '#f0f9ff', 'essential'),
  ((select id from public.ingredient_categories where name = 'Mixer'), 'Ginger Beer', '#fef9c3', 'common'),
  ((select id from public.ingredient_categories where name = 'Citrus'), 'Lime Juice', '#86efac', 'essential'),
  ((select id from public.ingredient_categories where name = 'Citrus'), 'Lemon Juice', '#fde68a', 'essential'),
  ((select id from public.ingredient_categories where name = 'Sweetener'), 'Simple Syrup', '#fef3c7', 'essential'),
  ((select id from public.ingredient_categories where name = 'Sweetener'), 'Grenadine', '#dc2626', 'specialized'),
  ((select id from public.ingredient_categories where name = 'Herb'), 'Fresh Mint', '#4ade80', 'specialized');

insert into public.glasses (name) values
  ('martini'), ('rocks'), ('highball'), ('coupe'), ('wine'), ('collins');

insert into public.taste_tags (name) values
  ('Bitter'), ('Citrus'), ('Sweet'), ('Herbal'), ('Spicy'), ('Fruity'), ('Tropical'), ('Refreshing'), ('Whiskey'), ('Tequila');

insert into public.cocktail_families (name) values
  ('Stirred'), ('Sours'), ('Highball'), ('Spritz');
