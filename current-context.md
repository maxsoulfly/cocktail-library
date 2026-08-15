# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. ~~DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0)~~ — **done, 2026-08-15**
4. ~~Auth + invitation redemption (Phase 1)~~ — **done and verified, 2026-08-16**
5. ~~Ingredient/product catalog + private My Bar (Phase 2)~~ — **done, 2026-08-16 — not yet browser-verified**
6. Recipes, private recipe CRUD, components, substitutions, families, relationships (Phase 3) — **next**
7. Unit preference + conversion (Phase 3)
8. Availability engine, tested (Phase 3)
9. Library browsing, filters, Favorites, Want to Make (Phase 4)
10. Purchase recommendations, tested (Phase 4)
11. Recipe publishing + admin unpublishing (Phase 5)
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 5 — real ingredient/product catalog and private My Bar, replacing `src/data/mockData.js` for this one screen pair.

**Database**: `20260815212530_products_and_inventory.sql` adds `products` (branded/homemade items, each `ingredient_type_id` required and FK'd — members can add products but never new types) and `user_inventory` (private ownership rows; exactly one of `ingredient_type_id` or `product_id` set per row via a check constraint, enforced-unique per user via two partial-effective unique constraints). RLS: `products` is member-read/member-insert/admin-update/admin-delete (shared catalog); `user_inventory` is read/insert/delete-own-only with **no admin override at all** — inventories are strictly private per the spec, unlike profiles/memberships. `db advisors --type all` stayed clean (only the four already-accepted WARNs).

**Client**: `src/services/catalog.js` (fetch categories/types/products, createProduct), `src/services/inventory.js` (fetchInventory, add/remove generic ownership, add product ownership), `src/hooks/useCatalog.js` + `src/hooks/useInventory.js`. `MyBarScreen.jsx` and `AddProductScreen.jsx` rewritten to use these instead of `INGS`/`ING_CATEGORIES` from mock data.

**Important sequencing note, not a bug**: Home/Library/Detail's availability badges (Perfect/Good Enough/Almost/Unavailable) still run entirely on `COCKTAILS` mock data and a separate, still-mock `owned` Set in `AppShell` — they are **not** connected to the real My Bar data added this chunk. Real recipes referencing real `ingredient_type` ids don't exist until step 6; wiring My Bar's real ownership into availability before then would have meant either faking recipe data against real ids (premature, throwaway work) or leaving availability broken. `src/App.jsx` has a comment marking this explicitly. Toggling ownership in the real My Bar screen right now has no visible effect anywhere else in the app — expected, until step 6.

## Implemented & verified

- `pnpm build` succeeds — 96 modules, no errors.
- `npx supabase db advisors --linked --type all` clean except the four expected WARNs (the three from step 4, plus one project-level "leaked password protection disabled" Auth setting unrelated to any migration — a Dashboard toggle under Authentication → Sign In / Providers → Email the user can enable whenever, not blocking anything).
- RLS policies spot-checked directly against `pg_policies`: exactly one policy per command per table, all scoped to `authenticated` (never `anon`/`public`), matching every other table so far.
- **Not yet verified in a real browser** — My Bar toggles, Add Product flow. Code-reviewed and build-verified only, same caveat as usual (no browser automation available here).

## Remaining / not started

Steps 6–13. Plus, from step 5 specifically: no automated tests for the `user_inventory_exactly_one_target` check constraint or the two partial-unique constraints (candidate for step 8's test setup). The "combined owned = generic OR product" display logic in `MyBarScreen.jsx` is a deliberate MVP simplification — there's no "unown a product" UI yet (only adding is wired up), which is fine since the spec doesn't require it, but worth remembering if it comes up.

## Blockers / open questions

None blocking further work. Still open, not urgent: the user hasn't done a real-browser pass on My Bar/Add Product yet (see Implemented & verified).

## Decisions made & why

- **`created_by` on `products` defaults to `auth.uid()` at the column level** (`default auth.uid()`), not just enforced via `WITH CHECK` — so the client never needs to send it explicitly, and a malicious override attempt is still caught by the check (`created_by = (select auth.uid())`). Standard defense-in-depth: default handles the common case cleanly, check closes the abuse case.
- **`products` UPDATE/DELETE is admin-only, not owner-or-admin.** The spec's permissions table only says members can *add* products, not edit/delete their own afterward. Didn't add member self-edit since it isn't required — recorded here rather than silently expanding scope; easy to add later if it turns out to matter.
- **The My Bar toggle only ever writes the generic `ingredient_type_id` ownership row**, even for a type that's *displayed* as owned because of a product. Removing product-based ownership isn't a flow the spec requires yet, so the toggle deliberately doesn't attempt it — documented inline in `useInventory.js` so it doesn't read as a bug later.
- **`AddProductScreen` now hard-blocks submission unless the typed ingredient name matches an existing type exactly** (button stays disabled), where the old mock version let any typed string through silently. This is the actually-correct behavior per the spec ("a member cannot create a new ingredient type," and there's no admin-approval queue built yet for the not-matched case) — recorded as a deliberate tightening, not a regression.
- **Deliberately did not bridge mock recipes to real ingredient ids this chunk** — see "Important sequencing note" above. Considered and rejected as premature/throwaway work given step 6 replaces the mock recipes wholesale anyway.

Earlier decisions (still standing, trimmed here — see git history for step 2-4 notes): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase; repo at `github.com/maxsoulfly/cocktail-library`; RLS policy shape (combined/single-purpose policies, one per command); every `SECURITY DEFINER` function needs `revoke ... from public, anon, authenticated` explicitly.

## Migrations / environment changes

One new migration this chunk (`20260815212530_products_and_inventory.sql`), applied via `supabase db push`. No new environment variables, no `AGENTS.md` changes needed (existing structure/RLS conventions already covered this).

## Tests / build checks last run

2026-08-16: `pnpm build` — 96 modules, no errors. `npx supabase db push` — migration applied. `npx supabase db advisors --linked --type all` — clean except the four expected WARNs. `pg_policies` spot-checked for correct per-command/role scoping. No real-browser test of My Bar/Add Product yet.

## Exact next recommended action

Start step 6: recipes, private recipe CRUD, components, substitution groups, families, relationships. This is the chunk that finally replaces `COCKTAILS` in `src/data/mockData.js` with real data and connects the real My Bar inventory (step 5) to real availability computation — `src/domain/availability.js`'s `computeAvail()` already takes a generic `owned: Set<string>` + a name-resolver, so it shouldn't need changes, just real inputs instead of mock ones feeding it from `AppShell`.

## Files/areas relevant to next action

New migration(s) for `recipes`, `recipe_components`, `substitution_groups`, `recipe_relationships`, `recipe_taste_tags` (per dev spec §8.2/§8.3 - note `source_type`/`visibility`/`moderation_status` on `recipes` for the classic/community/private + publish/unpublish model, though publish/unpublish UI itself is step 11/Phase 5, not this chunk). `src/data/mockData.js`'s `COCKTAILS` array is the shape reference for what a migrated-away-from recipe looked like. `src/App.jsx`'s `AppShell` (replace the mock `owned`/`COCKTAILS`/`computed` block with real queries, reusing `useInventory`/`useCatalog` from step 5 for the ownership side). `docs/Cocktail_Library_Development_Spec.md` §8.2-8.3 (domain model), §10 (availability matching rules) for exact behavior.
