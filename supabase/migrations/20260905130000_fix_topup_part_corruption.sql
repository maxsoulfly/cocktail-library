-- Data-correction migration, not a schema change. EditorScreen.jsx's
-- unitLabelToForm() (fixed in the same commit as this migration - see
-- src/domain/servings.js's new parseUnitLabel()) mis-parsed the bare
-- "top-up" unit label on edit-prefill as amount="top-up" + unit falling
-- back to the first NON_VOLUME_UNITS entry ("part") - a blind re-save (the
-- component's unit field left untouched while something else on the
-- recipe was edited) then wrote the literal string "top-up part" back to
-- storage.
--
-- Found live via a user screenshot ("Ice — top-up part"). A full query
-- across every recipe_components row confirmed exactly 5 rows carry this
-- corruption, all with amount = 0 and the exact literal "top-up part"
-- string - no other variant exists (verified via a broader `unit_label
-- ilike '%part%'` scan, not just an exact match). Repairs each back to the
-- original "top-up" by primary key, for precision - nothing else about
-- these rows (amount, role, sort_order, ingredient_type_id) changed, so
-- nothing else needs correcting.
update public.recipe_components
set unit_label = 'top-up'
where id in (
  '04cc5ff3-43da-41af-a057-1a040d2a2df0', -- Green Bunker: Soda Water
  '567a8f89-973c-4b8b-9131-c59565e1f59b', -- Green Bunker: Ice
  '4c0031a9-268a-4203-8bee-817cb3d2823d', -- Bloody Mary: Ice
  'af069cd7-9e7d-48f7-b216-8604619847af', -- Bloody Mary (Practical Version): Ice
  '28386721-b0bb-467f-ba54-1590615d2417'  -- Between the Sheets: Ice
)
and unit_label = 'top-up part';
