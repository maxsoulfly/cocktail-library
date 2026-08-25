-- Allows an optional 8-digit hex (#RRGGBBAA) alongside the existing 6-digit
-- form, so a swatch can carry real transparency - not just a paler shade of
-- the same opaque color. User request: the "Clear" swatch (#dbeafe) reads
-- as flat pale blue/milky rather than looking genuinely clear/transparent
-- like an actual clear spirit - a real alpha channel fixes that in a way a
-- 6-digit hex never could. Modern browsers (this app's whole target, being
-- mobile-first web) support #RRGGBBAA directly in CSS color properties and
-- SVG fill/stop-color, so no rendering-code change is needed anywhere this
-- hex string already flows (ColorSwatchPicker's swatch, GlassSvg's fill and
-- gradient stops, IngredientIcon's fillColor) - just the stored value.

alter table public.liquid_colors drop constraint liquid_colors_hex_check;
alter table public.liquid_colors add constraint liquid_colors_hex_check
  check (hex ~* '^#[0-9a-f]{6}([0-9a-f]{2})?$');

update public.liquid_colors set hex = '#dbeafe80' where name = 'Clear';
