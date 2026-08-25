-- Optional second liquid color, for layered/gradient cocktails (Tequila
-- Sunrise, a B-52-style layered shot, rainbow shots) that a single flat
-- fill color can't represent at all. User request - scoped to a simple
-- 2-color top-to-bottom gradient rather than a full N-layer band system:
-- covers the common 2-tone case well, and a true multi-band rainbow shot
-- simplifies to a 2-tone blend rather than being exactly reproduced -
-- matches this app's existing "flat stylized icon, not a photo" language
-- (GlassSvg's own header comment) rather than chasing full fidelity.
--
-- Nullable, same as liquid_color itself - most recipes only need one
-- color, and GlassSvg falls back to a flat fill when this is unset.

alter table public.recipes add column liquid_color_2 text;

-- Same explicit-column-grant pattern the original liquid_color column
-- already established (20260815214307) - recipes: update grants only the
-- specific member-editable columns to authenticated, not a blanket grant.
revoke update on public.recipes from authenticated;
grant update (name, description, glass_id, family_id, liquid_color, liquid_color_2, steps) on public.recipes to authenticated;
