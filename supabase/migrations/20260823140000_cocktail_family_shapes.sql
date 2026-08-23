-- Same fix as glasses.shape (20260822160000): lets an admin pick which
-- existing FamilyIcon pictogram a new/renamed cocktail family uses, instead
-- of the icon always being tied 1:1 to the family's name - that coupling
-- meant every family beyond the original 5 hardcoded names (beer, shot,
-- sours, spritz, stirred) silently fell back to a generic tall-glass icon,
-- including the existing "Highball" family, which never actually had its
-- own icon at all. User request: expand past those original 6 with a
-- curated set of common cocktail families, without repeating the same
-- "needs a code change for anything new" trap glasses already had.

alter table public.cocktail_families
  add column shape text not null default 'highball';

-- Backfill: every existing row's name already matches its rendered icon key
-- 1:1 (FamilyIcon.jsx's old name-based switch), so this preserves exactly
-- what's on screen today for any existing recipe.
update public.cocktail_families
set shape = lower(name);

alter table public.cocktail_families
  add constraint cocktail_families_shape_check
  check (shape in (
    'beer', 'highball', 'shot', 'sours', 'spritz', 'stirred',
    'fizz', 'flip', 'julep', 'martini', 'old_fashioned', 'punch',
    'smash', 'tiki', 'toddy', 'frozen'
  ));

insert into public.cocktail_families (name, shape) values
  ('Fizz', 'fizz'),
  ('Flip', 'flip'),
  ('Julep', 'julep'),
  ('Martini', 'martini'),
  ('Old Fashioned', 'old_fashioned'),
  ('Punch', 'punch'),
  ('Smash', 'smash'),
  ('Tiki', 'tiki'),
  ('Toddy', 'toddy'),
  ('Frozen', 'frozen');
