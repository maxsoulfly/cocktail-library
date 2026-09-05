# My Bar UX Plan — Owned-First Default + Add Ingredients Split

Saved 2026-09-06, approved for next session. **Not started** - planning only, no code changes made under this document. Read `current-context.md`'s "Exact next action" for the order this fits into relative to the still-open Cocktail Library/My Bar UX effort (Stage 5 and its pending mobile checks come first - see "Relationship to the Stage 1-5 effort" below).

## Direction

Rusty Pipes is mobile-first. My Bar should prioritize what the member owns, with a separate way to find and add ingredients. This document is the staged plan for that split, audited against the actual current implementation before any design was proposed.

## Audit summary (what's reused vs. new)

Already correctly built, reused as-is:

- `TypeCard.jsx` - separate `onCardClick` (view) vs. `onToggleOwned` (dedicated 44x44px checkmark, `stopPropagation`-safe). Ownership stays separate from viewing, exactly as this plan needs.
- `FamilyCluster.jsx` - groups a parent type with its children (e.g. Whiskey -> Bourbon/Rye/Scotch) into one cluster. Grouping logic reused; visual box treatment is what the shelf reskin (Stage 2) softens.
- `ExpandedProducts.jsx` - per-type product list; product-name tap opens `/bar/product/:id`; admin edit/delete inline; `OwnedToggle` per product. "Expand specific products under their type" is already built.
- `IngredientDetailScreen.jsx` - tap destination showing matching cocktails grouped by availability, with "View all" into Library. This already is "tap a bottle/name to open its matching cocktails."
- `isOwned(typeId)` in `MyBarScreen.jsx` - `ownedTypeIds.has(id) || productsByType.has(id)`, direct ownership only. **This already avoids the inferred-parent bug**: `resolveOwnedIngredientTypes()` (`src/domain/availability.js`) walks ownership *up* the hierarchy, but only for recipe-availability matching (an owned Dark Rum satisfies a recipe needing Rum) - never for My Bar's own "is this owned" display. A parent only shows as owned if directly owned; `coveringChildren` already surfaces "via Dark Rum" as a note on the unowned parent's card, not as false ownership. This plan preserves that distinction exactly, it does not need to be rebuilt.

Not yet built:

- No category-first "browse to add" flow. Today, adding a generic ingredient just is using the unified screen with "Owned only" switched off.
- `AddProductScreen.jsx` (`/bar/add`) is a *different, narrower* flow - registers one specific branded/homemade product under an already-known type, no category browsing. Stays as a sub-flow, not replaced.
- No shelf visual - today's grid is bordered `Card` tiles (`grid-cols-[repeat(auto-fill,minmax(104px,1fr))]`).
- No Speed Rack persistence anywhere - `user_inventory` is presence-only, no ordering/pin column. `ingredient_types`/`ingredient_categories` already have `shape`/`color`/`sort_order`, so the icon system this plan leans on already exists.
- Admin's inline pencil in `TypeCard` duplicates capability that already fully exists in `AdminScreen.jsx`'s "Ingredient Types" tab (`TypesTab.jsx` - search, edit, delete, merge, same `IngredientTypeEditor`). Removing it from the main browsing grid loses no admin capability.

## Approved decisions

1. **My ingredients is the owned-first default** at `/bar` (the mobile "My Bar" tab) - owned items only, grouped by category, empty categories hidden.
2. **A visible "+ Add ingredients" affordance** (always present in My ingredients' header, not a mode toggle) opens category-first catalogue browsing with search that works globally regardless of which category is selected.
3. **Build Your Bar's "Find more ingredients" opens `/bar/add-ingredients?focus=1`** (repointed from today's `/bar?focus=1`) - since My ingredients is now owned-first and would be empty for a first-time member, the onboarding intent ("help a new member start adding") now maps onto the new Add ingredients screen.
4. **`/bar/add` (`AddProductScreen.jsx`) is kept unchanged** for tracking a specific bottle/brand/homemade product under an already-known type, reachable from within the new Add ingredients screen via a "Track a specific bottle instead" link, same as today.
5. **Admin editing moves from shelf tiles to an admin-only detail overflow action** - the inline pencil is removed from `TypeCard`'s main-grid control row entirely (routine editing stays fully available via Admin -> Ingredient Types, unaffected). A lightweight admin-only "Edit type" action is added to `IngredientDetailScreen.jsx` as a convenience, reusing the same `IngredientTypeEditor` inline, same pattern `MyBarScreen.jsx` already uses.
6. **Shelf appearance**: bottle icons (existing per-type `shape`/`color`, already rendered by `IngredientIcon`) sit on a subtle shelf-line per category row, with readable names underneath. Short wrapping rows on mobile - no horizontal scrolling. Family clusters are kept for grouping logic but visually softened (less like a separate bordered card, more like part of the shelf).
7. **Speed Rack is deferred to its own later stage**, not built now. Its persistence design (a new isolated `user_speed_rack` table vs. a `pinned` column added directly to `user_inventory`) is chosen when that stage actually starts, and only after the `db push` migration-history mismatch is resolved (or the direct-`db query` workaround is deliberately re-approved for that specific migration) - not decided speculatively now.

## Two explicit requirements (apply to every stage below)

1. **Distinguish generic ownership from ownership through specific products, everywhere.** A type-level control (the shelf tile's checkmark, or any future type-level action) must never silently remove a member's owned products, and must never silently create generic type ownership as a side effect of some other action. The two `user_inventory` row kinds (`ingredient_type_id` rows vs. `product_id` rows) stay independently addressable exactly as `useInventory.js`'s `toggleType`/`toggleProduct`/`ownProduct` already keep them - no new code path may collapse "own the type" and "own a product of that type" into one write.
2. **Scroll position and expanded-state restoration must be verified, not assumed.** `navigate(-1)` (used by `IngredientDetailScreen.jsx`'s back button) returns to the previous history entry, but does not by itself guarantee that My ingredients' scroll offset or which type-tiles were expanded survive the round trip - React Router does not restore either automatically just because the URL matches. Each stage that touches navigation must include an explicit manual check of both, and the plan must not claim this "already works" without that check having actually been run.

## Proposed layout & tap behavior

**My ingredients** (`/bar`, default):
- Owned items only, grouped by category (categories with zero owned items hidden entirely - same "hide empty" pattern Library's grouping already established).
- Each item: bottle icon on a shelf-line row, name underneath, wrapping in short rows.
- Tap the bottle/name -> `IngredientDetailScreen` (matching cocktails). Tap the dedicated checkmark -> un-own (generic ownership only, per Requirement 1). Chevron (if multiple products) -> expand product list; tap a product's name -> its own detail page, with its own separate un-own control (product ownership only, per Requirement 1).
- No admin pencil in this view (see Decision 5).
- Visible "+ Add ingredients" in the header.

**Add ingredients** (new route, `/bar/add-ingredients`):
- Search box up top, works globally regardless of category selection (reuses the same substring+alias matching `MyBarScreen.jsx` already does).
- Lands on category tiles first, not the full catalogue; tapping a category reveals its types.
- Tapping a type toggles generic ownership immediately with visible feedback, without navigating away, so several can be added in one visit - matches how the unified screen behaves today, re-scoped to its own screen.
- "Track a specific bottle instead" links into the existing `/bar/add` (`AddProductScreen.jsx`), unchanged.

**Search, category navigation, empty states, back-navigation:**
- My ingredients: search filters within owned items only ("Search your bar..."); category picker jumps within owned items; a fully-empty bar shows one empty state pointing at "+ Add ingredients" (replacing today's generic `EmptyState`).
- Add ingredients: search is catalogue-wide; category tiles are the default landing state.
- Back-navigation: verify per Requirement 2 above, every stage that touches it.

## Staged plan

| Stage | Scope | Acceptance criteria | Safe stopping point? |
|---|---|---|---|
| **1** | Route split: `/bar` becomes owned-only My ingredients (existing card grid, unchanged visually this stage); new `/bar/add-ingredients` route with category-first browsing; admin pencil removed from the main grid, added to `IngredientDetailScreen` instead; Build Your Bar's "Find more ingredients" repointed | My ingredients shows exactly the owned set, no inferred parents (Requirement 1 holds); Add ingredients lets you find and toggle any type; admin edit still reachable (Admin tab + new detail-page action); scroll/expanded-state checked per Requirement 2; `pnpm test`/`build`/`format` clean | Yes - pure restructuring, no visual risk |
| **2** | Shelf visual reskin of My ingredients only (icons-on-a-line, softened family grouping) | Mobile-verified: short wrapping rows, no horizontal scroll, readable names, touch targets intact, scroll/expanded-state still holds after the visual change | Yes |
| **3** *(separate, later, not started under this plan)* | Speed Rack: schema + pin/unpin UI, persistence design chosen when this stage starts | New table/column live, RLS tested (admin/member/anon), pin persists and displays in a small top strip | N/A |

Stage 1 and 2 are deliberately separated so a shelf-visual iteration never risks the underlying data/routing logic, and vice versa.

## Database dependencies

- **Stages 1-2: none.** No schema change - pure client-side reshaping of existing `user_inventory`/`ingredient_types`/`products` data.
- **Speed Rack (Stage 3): yes**, a new migration is needed - no existing column represents "pinned." Two candidate designs (decided when Stage 3 actually starts, per Decision 7): a new isolated `user_speed_rack` table (`user_id`, `inventory_id` FK on delete cascade into `user_inventory`, `position`), mirroring `user_inventory`'s own RLS shape; or a `pinned boolean not null default false` column added directly to `user_inventory`. Either way, blocked on the unresolved `db push` migration-history mismatch (`supabase migration list --linked` shows 14+ real migrations untracked in the remote ledger) until that's resolved or the direct-`db query` workaround is deliberately re-approved for this specific migration.

## Relationship to the Stage 1-5 Cocktail Library/My Bar UX effort

This plan is new, separate work - it does not replace, complete, or supersede the existing 5-stage Cocktail Library + My Bar UX effort. That effort's Stages 1-4 are done and committed; Stage 5 (final integration review/regression/docs close-out) has not started, and several mobile checks from Stages 2-4 plus the out-of-sequence Sort-control addition are still unreported. See `current-context.md`'s "Exact next action" for the precise order the next session should follow - clearing those outstanding checks and closing Stage 5 comes before Stage 1 of this document.
