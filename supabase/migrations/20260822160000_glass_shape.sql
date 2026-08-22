-- Lets an admin pick which existing GlassSvg pictogram a new/renamed glass
-- uses, instead of the shape always being tied 1:1 to the glass's name (the
-- name/shape coupling meant every genuinely new glass needed a code change
-- to GlassSvg.jsx before it could render as anything but the martini
-- fallback). Existing rows are backfilled to the shape their name already
-- rendered as, so on-screen glass icons don't change for any current recipe.
alter table public.glasses
  add column shape text not null default 'martini';

update public.glasses
set shape = case lower(name)
  when 'collins' then 'highball'
  else lower(name)
end;

alter table public.glasses
  add constraint glasses_shape_check
  check (shape in ('rocks', 'highball', 'coupe', 'wine', 'martini'));
