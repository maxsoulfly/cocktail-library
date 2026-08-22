-- Expands the glass catalog from the original 6 placeholders to a full set
-- of 19 real glasses (user-supplied list), each with its own GlassSvg
-- pictogram (src/components/GlassSvg.jsx) instead of several sharing one
-- shape. The 5 existing glasses that already correspond 1:1 to an item on
-- the new list are renamed in place (not deleted+recreated) so any existing
-- recipe's glass_id keeps pointing at a valid row. The old "wine" glass had
-- no 1:1 match (the new list splits it into red/white) - renamed to "Red
-- Wine Glass" as the closer default of the two, with "White Wine Glass"
-- added as a new row alongside it.

-- Constraint dropped before the renames below, and re-added only after they
-- run - `add constraint check` validates every existing row immediately,
-- and the old "wine" row is still shape='wine' (not in the new allowed set)
-- until its own update statement runs.
alter table public.glasses drop constraint glasses_shape_check;

update public.glasses set name = 'Rocks Glass', shape = 'rocks' where name = 'rocks';
update public.glasses set name = 'Highball Glass', shape = 'highball' where name = 'highball';
update public.glasses set name = 'Collins Glass', shape = 'collins' where name = 'collins';
update public.glasses set name = 'Coupe Glass', shape = 'coupe' where name = 'coupe';
update public.glasses set name = 'Martini Glass', shape = 'martini' where name = 'martini';
update public.glasses set name = 'Red Wine Glass', shape = 'red_wine' where name = 'wine';

alter table public.glasses add constraint glasses_shape_check
  check (shape in (
    'rocks', 'highball', 'collins', 'coupe', 'nick_and_nora', 'martini',
    'copper_mug', 'hurricane', 'tiki_mug', 'margarita',
    'red_wine', 'white_wine', 'champagne_flute', 'champagne_tulip',
    'pint', 'pilsner', 'beer_stein', 'glencairn', 'shot'
  ));

insert into public.glasses (name, shape) values
  ('Nick & Nora Glass', 'nick_and_nora'),
  ('Copper Mug', 'copper_mug'),
  ('Hurricane Glass', 'hurricane'),
  ('Tiki Mug', 'tiki_mug'),
  ('Margarita Glass', 'margarita'),
  ('White Wine Glass', 'white_wine'),
  ('Champagne Flute', 'champagne_flute'),
  ('Champagne Tulip Glass', 'champagne_tulip'),
  ('Pint Glass', 'pint'),
  ('Pilsner Glass', 'pilsner'),
  ('Beer Stein', 'beer_stein'),
  ('Glencairn Glass', 'glencairn'),
  ('Shot Glass', 'shot');
