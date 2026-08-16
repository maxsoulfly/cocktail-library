# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. ~~DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0)~~ — **done, 2026-08-15**
4. ~~Auth + invitation redemption (Phase 1)~~ — **done and verified, 2026-08-16**
5. ~~Ingredient/product catalog + private My Bar (Phase 2)~~ — **done, 2026-08-16**
6. ~~Recipes, private recipe CRUD, components, substitutions, families, relationships (Phase 3)~~ — **done and verified, 2026-08-16**
7. ~~Unit preference + conversion (Phase 3)~~ — **done, 2026-08-16 — verified**
8. ~~Availability engine, tested (Phase 3)~~ — **done, 2026-08-16 — verified**
9. ~~Library browsing, filters, Favorites, Want to Make (Phase 4)~~ — **done, 2026-08-16 — verified**
10. ~~Purchase recommendations, tested (Phase 4)~~ — **done, 2026-08-16 — verified**
11. ~~Recipe publishing + admin unpublishing (Phase 5)~~ — **done, 2026-08-16 — browser-verified**
12. Admin catalog tools + JSON import preview/validation (Phase 5) — **in progress**: ingredient-type batch import (AI-prompt-assisted) and a member ingredient-request queue are done; recipe/product import, real invitation generation, and glass/taste-tag/family management are not started.
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 12, first slice: real ingredient-type batch import with an AI-formatting-prompt generator, plus a lightweight member-facing ingredient-request queue. Both were user-requested mid-session, growing out of the taxonomy conversation below.

**Ingredient requests** (migration `20260816013526_ingredient_requests.sql`): members can't create ingredient types (spec §4), but had no way to flag a gap. New `ingredient_requests` table (name, note, status pending/fulfilled/dismissed) - members insert/read their own and can delete while still pending, admin reads/resolves all. `RequestIngredientScreen.jsx` (`/request-ingredient`, linked from More → Catalog and from the "doesn't match an existing ingredient type" warnings in `EditorScreen.jsx`/`AddProductScreen.jsx`, pre-filled with whatever name didn't match) is the submission form. `AdminScreen.jsx` gained a "Requests" tab (badge-counted in the tab bar) to fulfill/dismiss.

**Ingredient batch import**: `src/schemas/ingredientImport.js` - pure, framework-free `validateIngredientImport(rawItems, {categories, types})` (rejects missing/duplicate/unknown-category/unknown-or-cross-category-parentType/invalid-barPriority/invalid-color) and `buildIngredientImportPrompt({categories, types})`, which generates the AI-formatting-prompt text *from the same live catalog data the validator checks against* - the two can't drift apart, per the standing rule in this file's history. 14 unit tests. `AdminScreen.jsx`'s Batch Import tab is now real for the "Ingredient Types" option (paste JSON → validate → per-row pass/fail preview → commit only the valid rows via new `createIngredientTypes()` in `src/services/catalog.js`, admin-only via the pre-existing `ingredient_types: admin writes` RLS policy - no new grant needed); "Classic Recipes" and "Products" options are shown but disabled ("Coming soon") rather than left silently mocked, since faking their result next to a real one would be misleading.

**Immediate refinement, same session, from user feedback**: (1) the AI prompt was rendered in a small `maxHeight:220` scrollable `Card`, easy to miss/hard to actually read or select - swapped for a proper full-width `readOnly` textarea (select-all-on-focus) so it's genuinely visible and copyable even if the clipboard button is blocked by browser permissions. (2) User wanted to add one ingredient without going through JSON/AI for something trivial. Added a "Single Ingredient" mode (now the default) alongside "Batch Import (AI)" - a plain form (name, category, optional parent type scoped to the chosen category, bar priority, optional color/description) that reuses the exact same `validateIngredientImport()` call (as a one-item array) and `createIngredientTypes()` commit path as batch import, so there's one validation rule set, not two. (3) Wired the Requests tab to the new single-add form: each pending request gets an "Add to catalog" button that jumps to Single Ingredient mode pre-filled with the requested name (doesn't auto-resolve the request - fulfilling and adding are kept as separate admin actions). Also dropped the old always-disabled "Select Import Type" step entirely (classics/products were never selectable) since there was nothing left to pick with only ingredients real.

**Follow-up question → real feature, same session**: user asked where recipe colors/glasses come from. Answer surfaced a real gap: `recipes.liquid_color` was set by hand for the 8 seeded classics (eyeballed hex values matching what each drink actually looks like - e.g. Negroni `#c2410c`) but the recipe editor never exposed a field for it at all - `createRecipe`/`updateRecipe` didn't even accept the parameter, so every user-created recipe silently fell back to a flat cyan default regardless of the actual drink. The DB side needed no migration - `liquid_color` was already in the column-restricted UPDATE grant from step 6 (`20260815214307_recipes_schema.sql`), just never exercised by the client. Asked the user preset-swatches vs. free hex vs. auto-derive-from-ingredient-colors; chose preset swatches. Added `LIQUID_COLORS` (10 curated drink-appropriate hex values) to `src/data/constants.js` and a `ColorSwatchPicker` component in `src/components/primitives.jsx`, used in `EditorScreen.jsx` next to the Family picker; threaded `liquidColor` through `createRecipe`/`updateRecipe` in `src/services/recipes.js`.

**Immediate follow-up, from a screenshot of the single-ingredient form**: two real issues. (1) User asked for the same color-swatch treatment on ingredients, not just recipes - the single-add form's Color field was still a raw hex text `Input`. Swapped it for the same `ColorSwatchPicker` just built for recipes (now a genuinely shared component, not near-duplicate inline JSX in two screens). (2) User pointed out the form always defaulted to "Spirit" (since it sorts first) and asked, in effect, "which spirit is tomato juice" - a real bug: `singleCategoryId` defaulted to `catalog.categories[0]?.id`, so anyone adding a non-spirit ingredient without consciously changing the dropdown would silently file it under Spirit, and the Parent Type list would show irrelevant spirit styles (Bourbon, Rum, etc.) the whole time. Fixed: no default category (starts unselected, with an explicit "Select a category..." placeholder option), and the Parent Type field only renders once a category is actually chosen - both to stop the silent-Spirit trap and because an unfiltered/empty parent list before a category is picked isn't meaningful anyway.

**Two loading-flash bugs found and fixed while wiring this up** (same class as the `useRecipes.js` bug fixed earlier this session): `useCatalog.js`'s `refetch()` was setting `loading:true` on every call, which unmounts the whole `Outlet` behind a bare loading screen - this was already being triggered today by `AddProductScreen` after adding a product, and would have been triggered by every future import commit too. Fixed the same way: don't re-enter the blocking state after the first load.

## Recently completed (this session, already committed and pushed)

- **Step 11**: recipe publishing/unpublishing, with a NULL-safety authorization bug caught and DB-verified before shipping. Browser-confirmed working.
- **Recipe editing**: owners can edit their own recipe, admins can edit the classic catalog only (tightened a pre-existing gap where admins could edit *any* member's recipe - migration `20260815231800_tighten_recipe_edit_scope.sql`).
- **Two real layout/state bugs, browser-confirmed fixed**: `useRecipes.js`'s refetch causing a full-app loading flash on every publish/unpublish/save, and `AppShell`'s root wrapper using `minHeight` instead of `height` (a flex container without a *definite* height can't give its `overflow-y:auto` child a bounded box to scroll within - nothing was scrolling anywhere, for any screen, for any content taller than the viewport).
- **Ingredient taxonomy pass**: `ingredient_types.parent_type_id` existed in the schema since day one but was never populated *or even fetched* (`fetchIngredientTypes()` was missing the column from its select - a second, independent latent bug). Now used for real: "Rum"/"Whiskey" under Spirit (Dark Rum/Bourbon reparented beneath them), "Aperitif"/"Digestif" under Liqueur (Campari/Aperol under Aperitif). Added `ingredient_categories.sort_order` (Spirit leads; Bitters/Herb/Juice/Garnish trail). Folded the sparse "Citrus" category into a broader "Juice" one (matches the spec's own suggested category list). Added a new "Garnish" category (also spec-named, previously missing entirely) with 5 starter types: Orange, Lemon, Lime, Cherry, Berries. `MyBarScreen.jsx` now sub-groups by category order and parent/child, and shows "Covered by \<child\>" under a parent type that isn't directly owned but has an owned child (the availability engine already treated this as satisfied via the parent-walk; the toggle alone didn't communicate that).
- **A pre-existing, untracked "Juice" and "Wine" ingredient category** were found live in the DB with no migration behind them during this work - not investigated further, just worked around (merged into rather than colliding with "Juice"; "Wine" left untouched). Still an open item - see Blockers.

Migrations for all of the above: `20260815230002_recipe_publishing.sql`, `20260815231800_tighten_recipe_edit_scope.sql`, `20260816010047_category_order_and_spirit_hierarchy.sql`, `20260816011432_liqueur_aperitif_hierarchy.sql`, `20260816012630_garnish_category.sql`, `20260816013526_ingredient_requests.sql`.

## Implemented & verified

- `pnpm test` — 45/45 passing (31 domain + 14 new schema tests).
- `pnpm build` succeeds — no errors, checked repeatedly through the session.
- Every migration this session clean on `db advisors --type all`/`--type security` (only the long-familiar accepted WARNs - SECURITY DEFINER functions intentionally callable by `authenticated`, leaked-password-protection disabled).
- Admin ingredient-type insert path verified directly against the live DB (simulated admin auth, real insert/select/cleanup).
- Ingredient request insert/read/update path verified directly against the live DB - including confirming the "owner can delete only while pending" policy correctly blocks a delete after the admin has resolved it (found via a real blocked cleanup attempt, not by reasoning alone).
- Step 11, the loading-flash fix, and the scroll fix are all **browser-confirmed by the user**.
- **Not yet browser-verified**: recipe editing, the taxonomy display changes, and everything in this "last completed chunk" (ingredient requests + batch import + their loading-flash fix).

## Remaining / not started

Rest of step 12: recipe batch import, product batch import, real invitation generation/revocation (a working manual-SQL path exists, documented in earlier git history), glass/taste-tag/family management UI. Step 13 entirely. Plus long-carried items: no editor UI for substitution alternatives/hierarchy, no RLS/integration test harness beyond manual smoke-testing, `<datalist>` ingredient-autocomplete theming (user-accepted deferral). No recipe yet references any of the new Garnish types (cosmetic catalog entries only, until a recipe's components use them).

## Blockers / open questions

An untracked "Juice"/"Wine" ingredient-category pair was found live in the database with no migration behind it (see above) - not blocking, but worth asking the user directly: did something write to the DB outside the migration flow? `AGENTS.md` explicitly calls out avoiding undocumented dashboard-only changes.

## Decisions made & why

- **Ingredient-type hierarchy uses the existing `parent_type_id` column, not new tables or new categories.** Matches the spec's own example (`Spirit → Gin → London Dry Gin`) and required zero schema changes - the column existed, just unused and unfetched.
- **Admin can only edit/delete the classic (ownerless) catalog, never another member's recipe**, tightened from the original broader policy - the spec says "No by default" for admin editing another user's recipe, and the original RLS was wider than that.
- **Batch import commits only the valid rows and reports the rest, rather than an all-or-nothing transaction.** Matches the spec's "atomic-or-clearly-partial commit" wording; simpler than a single multi-row transaction via RPC, and each row is independent (no cross-row foreign keys within one import).
- **The AI-formatting-prompt is generated from the same catalog data the validator checks against**, not hand-written separately - this was flagged as a requirement while planning step 12, specifically to prevent the prompt's instructions and the validator's actual rules from silently drifting apart over time.
- **Classic/product import options are shown but disabled ("Coming soon") rather than left as the old fake-success mock.** Once one import path is real, faking success for the other two would be actively misleading rather than merely incomplete.
- **Ingredient requests don't auto-create anything.** Fulfilling a request is bookkeeping (marks it resolved); the admin still goes through Batch Import to actually add the type, since a request is just a name + optional note, not a validated category/hierarchy/color.

Earlier decisions (still standing, trimmed here - see git history for step 2-10 and earlier step-11 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped, `coalesce(..., false)` around any comparison against a nullable column used in an authorization check); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly; `useCatalog`/`useInventory`/`useRecipes`/`useLists` called exactly once in `AppShell` and shared via context, and none of their `refetch()`s should re-enter a blocking `loading:true` state; `Card` forwards `onClick`; `AppShell`'s root wrapper needs `height`, not `minHeight`.

## Migrations / environment changes

Six new migrations this session (full list under "Recently completed" above), all applied via `supabase db push`. No new environment variables.

## Tests / build checks last run

2026-08-16: `pnpm test` — 45/45 passing. `pnpm build` — no errors (checked after every chunk, including after `pnpm format`). `npx supabase db push` — all six migrations applied (one required a fix-forward after a unique-constraint collision with a pre-existing untracked "Juice" category). `npx supabase db advisors --linked --type all`/`--type security` — clean after every migration. Ingredient-type insert and ingredient-request insert/update/delete paths verified directly against the live DB with simulated auth contexts.

## Exact next recommended action

Browser-verify this chunk: submit an ingredient request from the "doesn't match" warning in New Recipe, check it shows up in Admin → Requests, fulfill it; then in Admin → Batch Import, pick Ingredient Types, copy the AI prompt, hand it to an AI with a couple of real ingredient names, paste the JSON result back in, validate, and commit - confirm the new types show up immediately in My Bar (no refresh needed) in the right category/sub-group. Also worth a pass on everything from the earlier part of this session that's still unverified: recipe editing (owner and admin-on-classic) and the taxonomy display (category order, Rum/Whiskey/Aperitif/Digestif nesting, Garnish section). Once confirmed, continue step 12 with recipe/product batch import and real invitation management, or ask the user about the untracked "Juice"/"Wine" category mystery first if it's bugging them.

## Files/areas relevant to next action

`src/schemas/ingredientImport.js` (extend/generalize for recipe import - likely a similar validate+prompt pair, but recipes need ingredient-type resolution, glass/family lookups, and component/step arrays, so probably not a trivial copy-paste). `src/screens/AdminScreen.jsx` (Invitations tab still fully mock - real generation needs a `SECURITY DEFINER` function following the same pattern as `redeem_invitation`/`publish_recipe`). `docs/Cocktail_Library_Development_Spec.md` §12 for the full batch-import requirements this is progressively fulfilling.
