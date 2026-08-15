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
10. ~~Purchase recommendations, tested (Phase 4)~~ — **done, 2026-08-16 — not yet browser-verified**
11. Recipe publishing + admin unpublishing (Phase 5) — **next**
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 10 — purchase recommendations, implementing the spec's actual ranking rules (§11) for the first time. `HomeScreen`'s previous "Buy Next" was a simplified stand-in (just counted recipes unlocked per missing ingredient, no priority ranking, no suppression) — this replaces it with a proper tested domain function.

**Domain**: `src/domain/recommendations.js` — `rankPurchaseRecommendations({ computed, ingredientTypesById, favoriteIds, wantToMakeIds, limit })`. Candidates are ingredient types that would unlock an `avail === 'almost'` recipe (missing exactly one required ingredient). Ranked in the spec's exact order, as a comparator (not a weighted score, per the spec's explicit "readable rules... only add numeric weighting if real usage shows it's needed"): (1) unlocks a Favorite/Want-to-Make, (2) unlocks a classic, (3) `bar_priority` essential/common *and* `recommend_by_default` true, (4) total recipes unlocked, (5) how many already-`good`-enough recipes it would also push to `perfect`. Niche/specialized ingredients are suppressed from the list entirely unless they satisfy rule 1 — this function only ever produces the *general* suggestion list; a recipe detail page's own missing-ingredient display is a separate, always-unfiltered path (spec: "unless... the user is viewing that specific cocktail").

`computeAvail` gained a `missingOptionalIds` field (parallel to the existing `missingRequiredIds`) — needed to detect rule 5 (which `good`-enough recipes have this exact ingredient as their missing optional/garnish item). Purely additive, nothing else changed shape.

**Tests**: `src/domain/recommendations.test.js` — 12 tests covering suppression (niche/specialized, both the suppressed and favorited-so-shown cases), each ranking tier in order, the essential/common-but-not-recommended edge case, both tiebreak levels, `limit`, and the reason-string wording. Combined with the existing 19, `pnpm test` is 31/31.

**Screen**: `HomeScreen.jsx`'s `buyNext` now calls the domain function directly; the card's subtitle shows the domain-computed plain-language `reason` (e.g. "Unlocks 2 classics") instead of a raw ingredient-name list, and the count badge uses the real `unlockCount`.

## Implemented & verified

- `pnpm test` — 31/31 passing.
- `pnpm build` succeeds — 101 modules, no errors.
- **Not yet browser-verified**: nothing here has a guaranteed-visible UI change unless the current My Bar state actually produces an "almost" recipe with a suppressible or rankable candidate — worth checking Home's Buy Next section shows sensible reasons for whatever's currently almost-available.

## Remaining / not started

Steps 11–13. Plus, carried over: no editor UI for substitution alternatives/hierarchy (step 8), no RLS/integration test harness (step 8), real recipe editing (step 6), `<datalist>` theming (step 6, user-accepted). New from this chunk: no UI anywhere shows *why* an ingredient was suppressed (niche/specialized ingredients just silently don't appear in Buy Next) — matches spec (suppression is meant to be silent, not explained), noting only so it doesn't read as a missing feature later.

## Blockers / open questions

None blocking further work.

**Fixed post-ship (2026-08-16, found by the user's browser pass)**: `Card` (`src/components/primitives.jsx`) accepted a `style`/`className` but never `onClick` — it silently dropped the prop instead of forwarding it to the underlying `<div>`. Every clickable card in the app was affected: `CocktailCard`/`SmallCard` (so no cocktail card anywhere - Home, Library, Lists - actually navigated to its detail page), `HomeScreen`'s "Almost There" cards, and `AdminScreen`'s import-type picker. This meant Favorites/Want to Make were unreachable too, since the only toggle buttons for those live on the detail page (§7.3 of the spec - by design, not a card-level control) - the user couldn't get there to find them. Root cause predates this project entirely: the original Figma Make-generated `App.tsx` had the same `Card` definition without `onClick`, carried forward faithfully during the step-2 TS→JS port (a deliberate line-by-line port preserves behavior, bugs included, unless a bug is actually noticed - this one wasn't, since nothing exercised it in review). Fixed by adding `onClick` to `Card`'s props and forwarding it to the div. One-line fix, `pnpm test`/`pnpm build` both still clean.

## Decisions made & why

- **Ranking implemented as a comparator with sequential tie-breaking, not a weighted score** — directly matches the spec's explicit instruction ("initial ranking should use readable rules... add numeric weighting only after real usage shows it is needed"). Each candidate object exposes the raw booleans/counts (`unlocksFavoriteOrWantToMake`, `unlocksClassic`, `isEssentialOrCommon`, `unlockCount`, `upgradeCount`) rather than a single score, so the ranking reason is always inspectable/explainable, including in the `reason` string shown to the user.
- **Suppression and ranking live in the same function**, rather than filtering separately before/after. Keeps the "niche unless it unlocks a favorite" rule co-located with the favorite-unlock check it depends on, avoiding two places that both need to know what "unlocks a favorite" means.
- **`missingOptionalIds` added to `computeAvail` as a pure addition**, not a breaking change to existing fields — checked before writing any code that nothing consumes the return object by shape-equality, only by destructuring specific fields.

Earlier decisions (still standing, trimmed here — see git history for step 2-9 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (one policy per command, `to authenticated` explicit, `(select auth.uid())` wrapped); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly; `useCatalog`/`useInventory`/`useRecipes`/`useLists` called exactly once in `AppShell` and shared via context.

## Migrations / environment changes

None this chunk — pure domain logic + one screen wiring, no schema changes.

## Tests / build checks last run

2026-08-16: `pnpm test` — 31/31 passing (19 availability + 12 recommendations). `pnpm build` — 101 modules, no errors. No real-browser test yet.

## Exact next recommended action

Get a real-browser pass on steps 7–10 together (unit/theme persistence, availability engine regressions, favorites/want-to-make persistence, and Buy Next's new reasons/ranking — none of the last four chunks have been clicked through yet). Then start step 11: recipe publishing + admin unpublishing. Needs a `publish_recipe(recipe_id)` and `unpublish_recipe(recipe_id)` pair of `SECURITY DEFINER` functions (same reasoning as `redeem_invitation`: owners can't just update `visibility` directly per step 6's column-grant restriction, and unpublishing needs `is_admin()` + must preserve the owner's private access per spec §4/§8.3 — visibility flips back to `'private'`, `moderation_status` becomes `'unpublished_by_admin'`, row is never deleted). `DetailScreen`'s "Publish" button and `AdminScreen`'s moderation tab are still UI-only placeholders from step 6/the original mock — this is where they get wired to real data.

## Files/areas relevant to next action

New migration for `publish_recipe()`/`unpublish_recipe()` functions (remember the `revoke ... from public, anon, authenticated` + `grant ... to authenticated` pattern from the start, verify with `db advisors` immediately). `src/services/recipes.js` (add publish/unpublish calls). `src/screens/DetailScreen.jsx` (wire the existing confirm-dialog UI to a real call). `src/screens/AdminScreen.jsx` (moderation tab still reads `MOCK_COMMUNITY` from `src/data/mockData.js` — needs a real `fetchCommunityRecipes()`-style query for shared+active+pending... though "pending" isn't a real spec concept, see step 6's decision that publish is immediate, not review-gated - the moderation tab's "Approve/Reject" pending flow doesn't map to anything real and will need its own scope decision). `docs/Cocktail_Library_Development_Spec.md` §4 (roles/permissions table) and §8.3 (ownership/visibility) for exact behavior.
