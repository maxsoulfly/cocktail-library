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
11. ~~Recipe publishing + admin unpublishing (Phase 5)~~ — **done, 2026-08-16 — DB-verified, not yet browser-verified**
12. Admin catalog tools + JSON import preview/validation (Phase 5) — **next**
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 11 — recipe publishing and admin unpublishing, wiring up `DetailScreen`'s previously-inert "Publish" button and rebuilding `AdminScreen`'s moderation tab off real data.

**Database**: `20260815230002_recipe_publishing.sql` — `publish_recipe(p_recipe_id)` and `unpublish_recipe(p_recipe_id)`, both `SECURITY DEFINER` (same reasoning as `redeem_invitation`: the `recipes` UPDATE grant deliberately excludes `visibility`/`moderation_status` since step 6, so no direct client update could do this anyway). `unpublish_recipe` handles two distinct spec-defined actions in one function based on caller identity: the owner can self-unpublish (→ `moderation_status: 'active'`, since it's not a moderation action), or an admin can unpublish someone else's recipe (→ `moderation_status: 'unpublished_by_admin'`). Added a `published_at` timestamp column, set on publish, used by the moderation UI. Also added `recipe_id` column... no wait, added `published_at` only — one column.

**A real bug found and fixed before shipping**: the initial authorization check (`if not (v_recipe.owner_id = auth.uid() or public.is_admin()) then raise ...`) is unsafe for classic recipes, where `owner_id` is `NULL`. `NULL = auth.uid()` evaluates to `NULL`, and PL/pgSQL's `IF` treats a `NULL` condition the same as `false` — skips the branch — meaning the exception would silently *not* fire and a non-admin could slip through. Fixed with `coalesce(v_recipe.owner_id = auth.uid(), false)` to force a real boolean. Caught by reasoning through the SQL before pushing, not by a failing test — then **verified for real**: created a throwaway test recipe, simulated the admin's `auth.uid()` via `set_config('request.jwt.claims', ...)` in a `db query` session (since `db query` runs as postgres directly, with no JWT context otherwise) to confirm publish/unpublish both work correctly for an owner, then simulated a random unrelated user id attempting to unpublish the real Negroni (a classic, `owner_id IS NULL`) — correctly rejected with "Not authorized," and Negroni's row was confirmed untouched afterward. Test recipe cleaned up.

**Client**: `src/services/recipes.js` gained `publishRecipe`/`unpublishRecipe`/`fetchCommunityRecipes`. `DetailScreen.jsx`: the "Publish" confirm dialog now actually calls `publishRecipe` + `refetchRecipes`; added a parallel "Unpublish" action (shown when `c.source === 'community'` and the viewer is the owner or an admin) with a confirm dialog whose wording differs by who's doing it. `AdminScreen.jsx`'s Moderation tab now fetches real published community recipes and unpublishes for real; the mock's invented "pending/approve/reject" pre-publish review workflow was removed entirely rather than preserved, since the spec has no such step (publishing is immediate) — this included dropping the Overview tab's "Pending Review" card, which referenced the same fictional status. Overview's "Community Recipes" stat now reuses the real fetched count; the other three overview stats and the Invitations/Batch Import tabs are still mock, explicitly deferred to step 12 ("admin catalog tools").

**Follow-on, same day**: user reported no visible way to edit a recipe. Spec §4/§7.5 already scope this ("Edit own private recipes: Yes" for both roles, "Manage classic shared recipes: Yes" admin-only, "Edit another user's recipe: No by default" for admin too) so this wasn't a new scope decision, just a real gap (`current-context.md` had been carrying "real recipe editing UI" as a known-missing item since step 6). While building it, found the DB was actually **more permissive than the spec**: the step-6 `recipe_is_editable()` function and the `recipes` UPDATE/DELETE policies read `owner_id = auth.uid() or is_admin()`, which let an admin edit or delete *any* member's private recipe - never exercised by any UI, but a real standing gap between spec and schema. Migration `20260815231800_tighten_recipe_edit_scope.sql` tightens all three to `owner_id = auth.uid() or (owner_id is null and is_admin())`, scoping admin edit/delete rights to the ownerless classic catalog only. `unpublish_recipe()` (a separate function) is unaffected - admin moderation of a *published* community recipe is still spec-correct as "Yes". Verified directly: simulated the admin's auth context and evaluated the exact updated predicate against three owner_id cases (own recipe → true, classic/null → true, a different member's recipe → false) - confirms the fix without needing a second real profile row (only one exists in this dev project).

Client-side: added `updateRecipe()` to `src/services/recipes.js` (update recipe row, then delete-and-reinsert components/tags, same shape as `createRecipe`, no rollback-on-partial-failure since there's nothing sensible to roll back to). Generalized `EditorScreen.jsx` to double as an edit form: new route `/library/:id/edit`, prefills from `computed` + reverses the amount/unitLabel encoding, gates on `isOwner || (isAdmin && source === 'classic')` client-side (the DB policy is the real gate). Added an "Edit Recipe" button to `DetailScreen.jsx` under the same condition. Also fixed stale copy in `EditorScreen.jsx` left over from before step 11 ("Publishing to the community isn't available yet").

## Implemented & verified

- `pnpm test` — 31/31 passing (unchanged, no domain logic touched this chunk).
- `pnpm build` succeeds — no errors.
- New migrations clean on `db advisors --type all`/`--type security` (only the now-familiar accepted WARNs).
- New `recipes` embed for `fetchCommunityRecipes` verified valid via direct REST call (200, not 400).
- **DB logic verified directly** (see above) — publish/unpublish happy path + unauthorized-rejection, and the tightened edit/delete predicate across all three owner_id cases.
- **Not yet browser-verified**: publish/unpublish, recipe editing (as owner and as admin-on-classic), and that an ordinary member genuinely cannot reach another member's recipe's edit form.

## Remaining / not started

Step 12-13. Plus, carried over: no editor UI for substitution alternatives/hierarchy (step 8), no RLS/integration test harness for anything beyond what's been manually smoke-tested (step 8), `<datalist>` theming (step 6, user-accepted). Admin Overview/Invitations/Batch Import tabs still mock (step 12).

## Blockers / open questions

None blocking further work.

## Decisions made & why

- **One `unpublish_recipe` function handles both the owner-self-service and admin-moderation cases**, distinguished internally by whether the caller is the owner, rather than two separate functions. The spec treats them as related but distinct permissions ("unpublish own recipe" vs "unpublish another user's recipe") - one function with an internal branch keeps the "what actually changes in the database" logic in one place instead of duplicated.
- **`moderation_status` only becomes `'unpublished_by_admin'` on the admin path**, staying `'active'` when an owner unpublishes their own work - this preserves the meaning of that field as "was this an admin moderation action," which matters if the UI ever wants to explain *why* something is private (e.g. distinguishing "you took this down" from "an admin removed it").
- **Removed the mock's "pending/approve/reject" workflow entirely rather than adapting it.** It never corresponded to real spec behavior (publishing is immediate, no pre-review queue) - keeping any trace of it would present a false workflow model to whoever uses the admin panel. Same reasoning applied to Overview's "Pending Review" card.
- **Verified the DB-level fix with real simulated identities before considering this chunk done**, rather than relying on code review alone for security-critical authorization logic. Used `set_config('request.jwt.claims', ...)` to fake `auth.uid()` in a `db query` session since that path otherwise has no JWT context at all.
- **Tightened admin edit/delete rights to the classic catalog only**, discovered while wiring up recipe editing. The original policy let an admin edit/delete any member's private recipe, which the spec explicitly says should be "No by default" - fixed rather than left as-is even though the gap predated this chunk and nothing in the UI had exercised it, since building the edit feature was exactly the moment this needed to be gotten right.
- **`updateRecipe()` doesn't roll back a partial failure**, unlike `createRecipe()` which deletes the whole row it just inserted. There's nothing sensible to roll back *to* for an update (the pre-edit state isn't held in memory as a restorable snapshot) - a failure surfaces the error and leaves the DB in whatever partial state the sequential calls reached, same honest limitation already accepted for `createRecipe()`'s components/tags steps.

Earlier decisions (still standing, trimmed here — see git history for step 2-10 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped, `coalesce(..., false)` around any comparison against a nullable column used in an authorization check); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly; `useCatalog`/`useInventory`/`useRecipes`/`useLists` called exactly once in `AppShell` and shared via context; `Card` now correctly forwards `onClick`.

## Migrations / environment changes

Two new migrations this chunk, both applied via `supabase db push`: `20260815230002_recipe_publishing.sql` (publish/unpublish) and `20260815231800_tighten_recipe_edit_scope.sql` (scopes admin recipe edit/delete to the classic catalog only). No new environment variables.

## Tests / build checks last run

2026-08-16: `pnpm test` — 31/31 passing. `pnpm build` — no errors (twice, before and after `pnpm format`). `npx supabase db push` — both migrations applied. `npx supabase db advisors --linked --type all` / `--type security` — clean (familiar accepted WARNs only). REST embed verified via `curl`. Publish/unpublish functions verified directly against the live DB with simulated auth contexts (owner happy path + unauthorized rejection on a classic recipe). Tightened edit/delete predicate verified directly against the live DB across all three owner_id cases (own/classic/another member's).

## Exact next recommended action

Get a real-browser pass on step 11 and the recipe-editing follow-on: publish a private recipe, confirm it shows as "Community" and appears in Admin → Moderation, unpublish it from the detail page, then publish again and unpublish from the Admin panel instead, confirming both paths work and the recipe always survives (never deleted) in the owner's library. Then edit a private recipe (change an ingredient amount/unit, a step, add a taste tag) and confirm it saves and the availability badge reacts if the change affects it; as admin, edit a classic recipe the same way. Then start step 12: admin catalog tools + JSON import. Per spec §12, this needs a copyable formatting prompt (generated from the same schema/constants used by the importer, not hand-written separately, so instructions can't drift from validation), a JSON paste + parse + validate + preview flow (additions/updates/duplicates/errors), and atomic-or-clearly-partial commit. Also folds in the rest of `AdminScreen`'s remaining mock tabs: real invitation generation/revocation (there's already a working manual-SQL path for this, documented in earlier chunks, that becomes real UI here), and real ingredient/product/glass/taste-tag/family management.

## Files/areas relevant to next action

`docs/Cocktail_Library_Development_Spec.md` §12 (batch import - the full validation/preview/duplicate-detection requirements) and §7.7 (admin area scope). `src/screens/AdminScreen.jsx` (Invitations and Batch Import tabs, still fully mock). New `src/schemas/` directory (per `AGENTS.md`'s target structure, not created yet - runtime validation schemas for import payloads). New `src/services/invitations.js` and `src/services/catalogAdmin.js`-style modules. A new migration for an invitation-generation `SECURITY DEFINER` function (same pattern as everything else protected in this project) if generation needs anything beyond a plain authenticated insert under the existing `invitations: admin manages` policy.
