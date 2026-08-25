-- Glass aliases, same idea as ingredient_aliases (20260815200430,
-- 20260822150000) applied to glasses. User report: recipe JSON (batch
-- import and paste-a-recipe) commonly names the same physical glass
-- differently ("Rocks Glass" / "Lowball Glass" / "Old Fashioned Glass"),
-- and glass resolution has always been an exact case-insensitive name match
-- only - a real, previously-unrejected recipe or a hand-pasted one using a
-- different name than the catalog's canonical one fails with "Unknown
-- glass" even though a matching glass already exists.
--
-- Built to the exact final shape ingredient_aliases has today (not its
-- historical incremental steps) - globally unique alias text
-- (case-insensitive) so resolution is always deterministic, one alias can
-- only ever mean one glass. member read / admin-or-moderator write, same as
-- every other lookup-table alias/catalog-authoring surface (moderator's
-- scope already covers "ingredient-catalog authoring", and glasses are one
-- of the 7 tables in that scope).

create table public.glass_aliases (
  id uuid primary key default gen_random_uuid(),
  glass_id uuid not null references public.glasses (id) on delete cascade,
  alias text not null
);

comment on table public.glass_aliases is 'Controlled search/import aliases for glasses - resolved explicitly during batch import and paste-a-recipe, never guessed from name similarity.';

create index glass_aliases_glass_id_idx on public.glass_aliases (glass_id);
create unique index glass_aliases_alias_lower_idx on public.glass_aliases (lower(alias));

alter table public.glass_aliases enable row level security;

create policy "glass_aliases: read" on public.glass_aliases
  for select to authenticated using (public.is_member() or public.is_admin());
create policy "glass_aliases: admin insert" on public.glass_aliases
  for insert to authenticated with check (public.is_admin_or_moderator());
create policy "glass_aliases: admin update" on public.glass_aliases
  for update to authenticated using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
create policy "glass_aliases: admin delete" on public.glass_aliases
  for delete to authenticated using (public.is_admin_or_moderator());
