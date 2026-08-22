-- ingredient_aliases' original unique constraint was (ingredient_type_id,
-- alias) - unique per type, not globally. That allows the same alias text
-- to point at two different ingredient types simultaneously, which makes
-- resolution during import/matching genuinely ambiguous (which type does
-- "Sec" resolve to?) rather than the deterministic, admin-curated mapping
-- the table's own comment promises ("resolved explicitly ... never guessed
-- from name similarity"). Zero rows exist yet (feature was never wired up
-- until now), so this is a zero-data-risk fix rather than a migration.
--
-- Case-insensitive (matches every other exact-match-but-case-insensitive
-- resolution rule already used throughout the app) and global (one alias
-- string can only ever resolve to one ingredient type).

alter table public.ingredient_aliases drop constraint ingredient_aliases_ingredient_type_id_alias_key;

create unique index ingredient_aliases_alias_lower_idx on public.ingredient_aliases (lower(alias));
