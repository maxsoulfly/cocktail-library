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
9. ~~Library browsing, filters, Favorites, Want to Make (Phase 4)~~ — **done, 2026-08-16 — not yet browser-verified**
10. Purchase recommendations, tested (Phase 4) — **next**
11. Recipe publishing + admin unpublishing (Phase 5)
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 9 — real Favorites and Want to Make, replacing the last piece of local-only mock state in `AppShell`. Library browsing/filters needed no work — already real since step 6 (`LibraryScreen` already filters real recipes by availability/source/taste).

**Database**: `20260815223400_user_lists.sql` — `user_favorites`/`user_want_to_make`, each just `(user_id, recipe_id)` as a composite primary key (does double duty as the natural key and the "can't favorite twice" constraint — simpler than `user_inventory`'s polymorphic shape since there's only one possible target, a recipe). RLS: read/insert/delete own only, no admin override, matching `user_inventory`'s "strictly private" precedent. Clean on `db advisors`.

**Client**: `src/services/lists.js` (fetch/add/remove for both lists), `src/hooks/useLists.js` — same optimistic-update shape as `useInventory.js` from step 5 (flip local state instantly, write in background, roll back via reload only on failure). Wired into `AppShell` replacing the old `useState(() => new Set())` pair; `favorites`/`wantToMake`/`toggleFav`/`toggleWtm` keep the exact same names and shapes in Outlet context, so **zero screen changes were needed** — `ListsScreen`/`HomeScreen`/`DetailScreen` all just called `.has()`/`.size`/`toggleFav(id)` already, confirmed by grep before considering this done. The now-unused `toggleInSet` helper was removed from `App.jsx` along with the old state.

## Implemented & verified

- `pnpm test` — 19/19 passing (unchanged, this chunk didn't touch `src/domain/`).
- `pnpm build` succeeds — 100 modules, no errors.
- New migration verified clean on `db advisors --type all`.
- Confirmed via `grep` that every screen consuming `favorites`/`wantToMake`/`toggleFav`/`toggleWtm` only used the Set/function interface the new hook already provides — no screen edits required, reducing regression risk for this chunk.
- **Not yet browser-verified**: favoriting/want-to-make toggling on Detail, and that the Lists screen shows the right items after a refresh (the actual persistence test, same as My Bar's in step 5).

## Remaining / not started

Steps 10–13. Plus, carried over: no editor UI for substitution alternatives/hierarchy (step 8 gap), no RLS/integration test harness (step 8 gap), real recipe editing (step 6 gap), `<datalist>` theming (step 6 gap, user-accepted).

## Blockers / open questions

None blocking further work.

## Decisions made & why

- **Composite primary key `(user_id, recipe_id)`, no separate `id` column** — unlike `user_inventory` (which needs to represent "generic type OR product," a real either/or with two possible FK targets), a favorite/want-to-make row only ever points at one thing: a recipe. The natural key already prevents duplicates, so a surrogate id would be pure overhead.
- **Reused `useInventory.js`'s optimistic-update pattern exactly** rather than inventing a new one — same shape of problem (private per-user toggle state), same solution.
- **Verified screen compatibility by grep before writing any screen code**, rather than assuming the old local-state shape and the new hook's shape matched. They did, so no screens changed — but this is exactly the kind of assumption that caused step 6's staleness bug, so checking first rather than after felt worth doing explicitly this time.

Earlier decisions (still standing, trimmed here — see git history for step 2-8 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly; `useCatalog`/`useInventory`/`useRecipes`/`useLists` called exactly once in `AppShell` and shared via context, never independently per-screen.

## Migrations / environment changes

One new migration this chunk (`20260815223400_user_lists.sql`), applied via `supabase db push`. No new environment variables, no `AGENTS.md`/`CLAUDE.md` changes needed (existing hook-sharing and RLS conventions already covered this).

## Tests / build checks last run

2026-08-16: `pnpm test` — 19/19 passing. `pnpm build` — 100 modules, no errors. `npx supabase db push` — migration applied. `npx supabase db advisors --linked --type all` — clean, no new findings. No real-browser test of favorite/want-to-make toggling yet.

## Exact next recommended action

Get a real-browser pass on steps 7–9 together (unit/theme persistence, availability engine regressions, and favorites/want-to-make persistence — none of the last three chunks have been clicked through yet). Then start step 10: purchase recommendations. Per spec §11, candidates come from recipes missing exactly one required ingredient (the existing `avail === 'almost'` recipes already computed by `computeAvail`), ranked by: unlocks a Favorite/Want-to-Make first, then a classic recipe, then essential/common `bar_priority` ingredients (already a column on `ingredient_types` since step 3, unused so far), then count of recipes unlocked, then count of good-enough-to-perfect upgrades. Niche ingredients suppressed from general suggestions unless completing a Favorite/Want-to-Make or the user is viewing that specific cocktail. `HomeScreen`'s existing "Buy Next" section is a simple version of this (just counts recipes unlocked, no priority ranking) — this step properly implements the spec's ranking rules, ideally as a tested `src/domain/` function alongside `computeAvail`.

## Files/areas relevant to next action

For browser verification: `/more` (unit/theme), `/bar` + `/home` + `/library` (My Bar → availability), `/library/:id` + `/lists` (favorite/want-to-make toggle + persistence). For step 10: a new `src/domain/recommendations.js` (pure, tested like `availability.js`), `src/screens/HomeScreen.jsx`'s existing `buyNext` `useMemo` (currently inline, simple unlock-count logic — replace with the real ranked domain function), `ingredient_types.bar_priority`/`recommend_by_default` columns (exist since step 3, first real consumer), `docs/Cocktail_Library_Development_Spec.md` §11 (purchase recommendation logic) for the exact ranking order.
