# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. ~~DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0)~~ — **done, 2026-08-15**
4. ~~Auth + invitation redemption (Phase 1)~~ — **done and verified, 2026-08-16**
5. ~~Ingredient/product catalog + private My Bar (Phase 2)~~ — **done, 2026-08-16**
6. ~~Recipes, private recipe CRUD, components, substitutions, families, relationships (Phase 3)~~ — **done and verified, 2026-08-16**
7. ~~Unit preference + conversion (Phase 3)~~ — **done, 2026-08-16 — not yet browser-verified**
8. Availability engine, tested (Phase 3) — **next**
9. Library browsing, filters, Favorites, Want to Make (Phase 4)
10. Purchase recommendations, tested (Phase 4)
11. Recipe publishing + admin unpublishing (Phase 5)
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 7 — unit and theme preference now persist to the user's profile instead of resetting to defaults every page load. The conversion math itself (`mlToOz`/`formatAmount` in `src/domain/availability.js`) was already correct and non-destructive since step 2 — this chunk was purely about remembering the user's choice.

`src/services/membership.js` gained `updateProfile(userId, updates)`. `AppShell` (`src/App.jsx`) now initializes `unit`/`theme` local state from `profile.unit_preference`/`profile.theme_preference` on mount, and `setUnit`/`setTheme` (same names/signatures as before, so `MoreScreen`/`DetailScreen` needed no changes) update local state immediately and persist in the background, fire-and-forget with a `console.error` on failure — consistent with the optimistic-update pattern used elsewhere. No migration needed: the `profiles` UPDATE column grant already covered `unit_preference`/`theme_preference` since step 3 (verified directly against `information_schema.column_privileges` before writing any code — `authenticated` has exactly `display_name, theme_preference, unit_preference`, not `role`).

One normalization: `profiles.theme_preference` defaults to `'system'` for new signups, but there's no OS dark/light detection implemented in the UI (`MoreScreen` only offers an explicit dark/light toggle). Initializing straight from `'system'` would leave neither button showing as selected, so local theme state treats anything other than an explicit `'light'` as `'dark'`.

## Implemented & verified

- `pnpm build` succeeds — 98 modules, no errors.
- Grant verified directly via SQL before implementing (see above) rather than assumed from memory of the step-3 migration.
- **Not yet re-tested in the browser** — see Exact next recommended action.

Step 6 (recipes) is now fully verified: the user confirmed My Bar toggles move availability badges without a refresh, and recipe creation/detail/delete all work end to end. Two post-ship UI polish fixes also confirmed necessary by the user and shipped: the ingredient amount field no longer triggers Chrome's credit-card autofill (added `name`/`autoComplete="off"`/`inputMode="decimal"`), and the unit/role dropdowns in the recipe editor are now a themed custom `Select` component (`src/components/primitives.jsx`) instead of unthemeable native `<select>` popups. Known, user-accepted remaining gap: the ingredient-type/product-name `<datalist>` autocomplete suggestions are still native/unthemed (fixing that needs a full custom combobox, not attempted).

## Remaining / not started

Steps 8–13. Plus, carried over from step 6:
- Real recipe *editing* (reopening the editor pre-filled with existing data) isn't built — only create/read/delete.
- `substitution_groups`/`recipe_relationships` — no schema yet, deliberately deferred to step 8 or later.
- No automated tests yet for anything (recipes, catalog, or otherwise) — step 8 ("Availability engine, **tested**") is where a test runner gets introduced, covering `computeAvail`/`mlToOz`/`formatAmount` together as one suite rather than fragmenting test-infrastructure setup across steps.
- The `<datalist>` theming gap noted above.

## Blockers / open questions

None blocking further work.

## Decisions made & why

- **Persisted theme alongside unit in the same chunk**, even though the phase-plan step title only names "unit preference." Both live on the same `profiles` row, use the identical mechanism, and the spec (§13.1) explicitly groups them ("persist theme and unit preference in the profile") — splitting them into two chunks would mean revisiting the exact same code path twice for no benefit.
- **Did not add a third "system" theme option to the UI**, even though `profiles.theme_preference`'s check constraint already allows it and the original Figma brief mentions "system, dark, light." Implementing it means real `prefers-color-scheme` media-query detection, which is new scope beyond "persist the existing two-way toggle" — deferred rather than expanded into now.
- **Preference save failures are silent to the user** (local state already reflects the choice; a failed background persist just means it won't survive a refresh, logged to console for debugging). Consistent with treating this as a low-stakes optimistic update, not worth interrupting the user over.

Earlier decisions (still standing, trimmed here — see git history for step 2-6 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly, verified via `db advisors`; `useCatalog`/`useInventory`/`useRecipes` called exactly once in `AppShell` and shared via context, never independently per-screen.

## Migrations / environment changes

None this chunk — the existing `profiles` UPDATE grant already covered what was needed.

## Tests / build checks last run

2026-08-16: `pnpm build` — 98 modules, no errors. Grant coverage confirmed via `information_schema.column_privileges`. No real-browser test of preference persistence yet.

## Exact next recommended action

Get a real-browser pass on this chunk: change the unit (ml/oz) and theme (dark/light) in More, refresh the page, confirm both stick. Then start step 8: introduce a test runner (Vitest pairs naturally with Vite) and write the spec's required test coverage for `src/domain/availability.js` — all four availability states, product-satisfies-type matching (needs a small extension: `computeAvail` currently only checks direct id membership in the owned set, not product-mapped or parent/child-hierarchy satisfaction, both of which the spec requires), valid substitution groups (needs the deferred `substitution_groups` schema from step 6), required vs. optional/garnish behavior, and ml/oz display conversion without mutating stored data.

## Files/areas relevant to next action

For browser verification: `/more` (unit + theme toggles), refresh to confirm persistence. For step 8: `src/domain/availability.js` (extend `computeAvail`'s matching rules), a new `supabase/migrations/*_substitution_groups.sql`, `docs/Cocktail_Library_Development_Spec.md` §10 (availability matching) and the "Testing requirements" list for the exact test cases required, `package.json` (add a test runner + `test` script).
