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
8. ~~Availability engine, tested (Phase 3)~~ — **done, 2026-08-16 — not yet browser-verified**
9. Library browsing, filters, Favorites, Want to Make (Phase 4) — **next**
10. Purchase recommendations, tested (Phase 4)
11. Recipe publishing + admin unpublishing (Phase 5)
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 8 — the availability engine now implements all four of the spec's component-satisfaction rules (§10.1), and has real test coverage for the first time in the project.

**What was actually missing before this chunk**: `computeAvail` only ever checked flat `owned.has(id)` membership. "Product satisfies its mapped type" was already handled, but only because `AppShell` happened to pre-expand the owned set that way — it wasn't a named, tested domain rule. Two rules were entirely unimplemented: parent/child hierarchy ("a compatible explicit child type") and substitution groups ("one allowed item from its substitution group", deferred from step 6).

**Database**: `20260815222739_recipe_component_alternatives.sql` — a `recipe_component_alternatives` table (not a separate `substitution_groups` entity; each `recipe_components` row already *is* the slot, so a companion table of additional acceptable `ingredient_type_id`s per component is the whole mechanism). `recipe_id` denormalized onto it for RLS simplicity, matching `recipe_components`/`recipe_taste_tags`. RLS: read/insert/delete via `recipe_is_visible()`/`recipe_is_editable()`, same pattern as every other recipe child table — clean on `db advisors` with no follow-up fix needed.

**Domain (`src/domain/availability.js`)**:
- `computeAvail` now accepts an optional `alternativeIds` array per component; a component is satisfied if the primary id *or any* alternative is in `owned`.
- New `resolveOwnedIngredientTypes({ ownedTypeIds, ownedProductIds, products, ingredientTypes })` — a pure function that expands raw ownership into everything it satisfies: direct ownership, owned-product mapping, and full ancestor-chain walk for hierarchy (owning a child type satisfies every ancestor type, transitively). This used to be inline logic in `AppShell`; moved into the domain layer specifically so it's unit-testable without React/Supabase, per `AGENTS.md`'s own rule for `src/domain/`.
- `AppShell` now calls `resolveOwnedIngredientTypes()` instead of its own inline product-mapping code — same result for existing data, but hierarchy satisfaction now actually works too.

**Testing**: Vitest introduced (`vitest.config.js`, deliberately separate from `vite.config.ts` — that file carries Figma Make's dev-server plugins, irrelevant overhead for a test run). `pnpm test` script added. `src/domain/availability.test.js` — 19 tests covering all four availability states, required-vs-optional/garnish behavior, substitution-alternative satisfaction, name resolution, `mlToOz` conversions, `formatAmount`'s non-mutation of stored data (the spec's explicit "without stored-data mutation" requirement), and `resolveOwnedIngredientTypes`'s three rules individually plus combined. All passing.

**Scope boundary**: this chunk is unit-level only, `src/domain/` pure functions. The spec's RLS-flavored testing requirements (owner/non-owner recipe access, admin-only catalog mutation, invitation lifecycle, private inventory separation between two users, etc.) need a real or local Supabase instance to exercise multiple identities against — not started, not part of `pnpm test`, and not this chunk's job. Purchase-recommendation suppression/priority tests are step 10's job (the logic doesn't exist yet either).

## Implemented & verified

- `pnpm test` — 19/19 passing.
- `pnpm build` succeeds — 98 modules, no errors.
- New migration verified clean on `db advisors --type all` (no new findings).
- The extended `recipes` PostgREST select (added a third level of embedding: `recipe_components(...recipe_component_alternatives(ingredient_type_id))`) verified valid via the same direct-REST-call technique as step 6 (200, not 400).
- **Not yet browser-verified**: nothing in this chunk has an immediately-visible UI surface (no seeded recipe currently uses substitution alternatives or ingredient hierarchy, so there's nothing new to click through yet) — verification here *is* the test suite. Worth confirming existing recipes/availability still display correctly after the `resolveOwnedIngredientTypes` swap in `AppShell`, though the logic is equivalent for data that doesn't use the new rules.

## Remaining / not started

Steps 9–13. Plus, carried over:
- No editor UI for authoring substitution alternatives or setting `parent_type_id` on an ingredient type — the engine supports both, but nothing currently produces that data except direct SQL/tests. Real authoring UI is a separable follow-up (editor UI, not engine).
- No seed data demonstrates hierarchy or substitution in the real app yet (deliberately not fabricated — see Decisions).
- RLS/integration test coverage (see Scope boundary above) — still a gap, needs a dedicated future effort with a way to run tests against multiple identities.
- Real recipe editing (step 6 gap), `<datalist>` theming (step 6 gap, user-accepted) — unchanged, still open.

## Blockers / open questions

None blocking further work.

## Decisions made & why

- **Substitution modeled as a companion table per component slot, not a separate `substitution_groups` entity** — see "Database" above. The spec's suggested entity list names `substitution_groups`, but explicitly allows table names to differ as long as the concept holds ("exact table names may change, but the conceptual separation must be preserved"). One row per component already represents a slot; a group table would just be an extra layer of indirection with nothing to normalize (each slot only ever needs its own alternatives, never shared across slots).
- **Hierarchy and product-mapping expansion moved from `AppShell` into `src/domain/availability.js`** as `resolveOwnedIngredientTypes()`, rather than adding hierarchy-walking logic directly inside the React component. This is what actually made it possible to unit-test — `AppShell` can't be pure-function-tested the way a `src/domain/` module can.
- **Didn't fabricate seed data to demonstrate substitution/hierarchy in the running app.** Same reasoning as step 6's "no fabricated large catalog": real substitution/hierarchy data has genuine bartending logic behind it (what actually substitutes for what, which gins are subtypes of which) that shouldn't be invented just to have something to click. Verified via tests with deliberately clear, labeled mock data instead. Real data enters via admin catalog tools (step 12) or ad hoc SQL later.
- **`vitest.config.js` kept separate from `vite.config.ts`**, matching the existing precedent of keeping Figma Make's platform-specific tooling isolated from things that don't need it.
- **Test scope is `src/domain/` only, not RLS/integration** — named explicitly as a boundary rather than left ambiguous, since the spec's testing requirements list mixes pure-logic tests with identity-dependent RLS tests that need fundamentally different infrastructure. Recorded so it doesn't read as an oversight later.

Earlier decisions (still standing, trimmed here — see git history for step 2-7 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly, verified via `db advisors`; `useCatalog`/`useInventory`/`useRecipes` called exactly once in `AppShell` and shared via context.

## Migrations / environment changes

One new migration this chunk (`20260815222739_recipe_component_alternatives.sql`), applied via `supabase db push`. `vitest` added as a dev dependency; `vitest.config.js` new; `pnpm test` script added. `AGENTS.md`/`CLAUDE.md` updated to point at the new test command and note the unit-vs-RLS test scope boundary.

## Tests / build checks last run

2026-08-16: `pnpm test` — 19/19 passing. `pnpm build` — 98 modules, no errors. `npx supabase db push` — migration applied. `npx supabase db advisors --linked --type all` — clean, no new findings. REST embed query verified via direct `curl` (200, not 400).

## Exact next recommended action

Start step 9: library browsing/filters (mostly already real since step 6 — `LibraryScreen` already filters real recipes by availability/source/taste), and real Favorites/Want to Make (currently local-only `Set` state in `AppShell`, resetting every page load — same shape of gap as unit/theme preference was before step 7). Needs `user_favorites`/`user_want_to_make` tables (simple: `user_id` + `recipe_id`, private-only RLS matching `user_inventory`'s shape from step 5 — read/insert/delete own rows, no admin override).

## Files/areas relevant to next action

New migration for `user_favorites`/`user_want_to_make` (small, same RLS shape as `supabase/migrations/20260815212530_products_and_inventory.sql`'s `user_inventory` table — read/insert/delete own only). `src/App.jsx`'s `AppShell` (`favorites`/`wantToMake` local `Set` state and `toggleFav`/`toggleWtm` — same replace-local-state-with-real-persistence pattern as step 7, likely wanting the same "call once in AppShell, share via context" discipline from step 6's bug). `src/screens/ListsScreen.jsx`, `HomeScreen.jsx` (favorites/want-to-make counts), `DetailScreen.jsx` (toggle buttons) — none of these should need shape changes if the new hook matches `favorites`/`toggleFav`'s existing signature. `docs/Cocktail_Library_Development_Spec.md` §7.6 (personal lists).
