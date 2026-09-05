PROJECT.md

# Vision
Rusty Pipes

Purpose:
Personal cocktail notebook that helps me decide what to drink and easily prepare it.

Success looks like:

I can quickly find something I want.
I can find cocktails matching a request/mood.
Recipes are easy to follow while mixing.
The app remains useful even when My Bar is empty.

Not currently trying to be:
Social network, cocktail school, public community.

You might revisit this every few months, not every day.

# Current Focus
Homepage "Build your bar" for an empty My Bar (in progress, 2026-09-06 - audit + a 4-stage plan agreed, revised once per real UX corrections from the user, see Decisions below). Stage 1 (essentials list + `/bar?focus=1` autofocus) done, committed, mobile-verified 2026-09-06 - confirmed working on a real iPhone, including a real finding (iOS doesn't auto-open the keyboard on a programmatic focus - expected, no workaround needed, now a standing note in `AGENTS.md`). Stage 2 (the actual homepage section: selection UI + stable per-visit-session visibility, landing together) code-complete and tested 2026-09-06, being committed now so the user can sync it to their phone - mobile verification **pending**. Full design + real catalog data behind the six/expanded list in current-context.md.

**Mobile-first is now an explicit standing project requirement (`AGENTS.md`, 2026-09-06)**: comfortable touch targets (44×44px minimum) everywhere, never rely on hover or an automatic keyboard, desktop supplements phone testing rather than substituting for it. Applies to all UI work going forward, not just this feature.

Serving-size selector + parts ratio view is **complete** as of 2026-09-05 - all 5 stages done, browser-verified on a real iPhone across every stage, plus a same-day fix for a real "top-up part" data-corruption bug found live after Stage 5 (170/170 automated tests passing as of the Build Your Bar work above).

# Next
- Improve mood/taste discovery

# Backlog
1. Homepage "Build your bar" - Stages 1-2 done (see Current Focus). Stages 3-4 (availability-sorted "Show my cocktails", final docs/regression) not started.

# Follow-ups (low priority, not blocking)
- Countable non-volume units (dash, piece, slice, wedge, splash) aren't pluralized at save time in the manual editor or batch import - e.g. picking "dash" with amount 2 stores "2 dash", not "2 dashes". Pre-existing, unrelated to serving-size scaling; found 2026-09-05 while building Stage 1. Only visible at the base 1-serving view - scaling to 2+ servings already self-corrects it since pluralization there is re-derived from the final count. Worth a small fix (auto-pluralize on save) whenever editor/import work is next touched.
- ~~`EditorScreen.jsx`'s `unitLabelToForm()` mis-parsed a bare no-count unit label (`"top-up"`, `"to taste"`) on edit-prefill~~ - **fixed 2026-09-05**. Found during Stage 5's integration review, then confirmed live via a real user screenshot ("Ice — top-up part") the same day - a full DB scan turned up **5 already-corrupted `recipe_components` rows** (Green Bunker ×2, Bloody Mary, Bloody Mary (Practical Version), Between the Sheets - all `"top-up"` silently rewritten to the literal `"top-up part"` by a blind re-save through the broken prefill). Root cause: the old parser assumed every non-ml `unit_label` starts with a numeric token; a bare label like `"top-up"` has none, so the whole word was mis-read as an *amount*, and the unit field fell back to `"part"`. Fixed by extracting a shared `parseUnitLabel()` (`src/domain/servings.js`) that correctly recognizes "no leading number = no amount at all," now used by both the scaling logic and `EditorScreen.jsx`'s prefill so the two can't drift apart again. Data repaired via `supabase/migrations/20260905130000_fix_topup_part_corruption.sql`, targeted by row id, verified against the live DB (all 5 rows back to plain `"top-up"`, nothing else on those rows changed). Regression test added (`src/domain/servings.test.js`) simulating the exact parse-then-reconstruct round trip that used to fabricate `"top-up part"`.
- ~~A countable non-volume unit stored in its plural form (e.g. Old Fashioned's real `"2 dashes"`) didn't match any option in the editor's unit `Select`~~ - **fixed 2026-09-05**. `parseUnitLabel()` now normalizes a known plural word to its canonical singular form (`"2 dashes"` → amount `"2"`, unit `"dash"`) before it ever reaches the form, reusing the same singular/plural table `scaleIngredientAmount()` already had for the opposite direction. Expected, acceptable side effect: re-saving that recipe without touching the field now stores the singular word (`"2 dash"`) - the quantity is preserved exactly, only the grammar changes, matching how a brand-new entry already saves (see the pluralize-at-save-time item above, which this doesn't otherwise change).
- ~~`"1 top-up"` (Manhattan Iced Tea) got scaled by servings since it has a leading number~~ - **fixed 2026-09-05**. `scaleIngredientAmount()` now excludes `"top-up"`/`"to taste"` from scaling outright, regardless of whether a legacy numeric prefix is present - not just when the label is fully bare. Regression test covers `"1 top-up"` at 2, 3, and 12 servings.
- **Found 2026-09-05 while fixing the above, not touched (explicitly deferred, not forced)**: `supabase db push --linked` fails with `is_moderator already exists` in a fresh CLI session. `npx supabase migration list --linked` shows why: 14 real, already-applied migrations (`20260825100000` through `20260826120000`) plus this session's own new data-repair migration are all missing from Supabase's migration ledger (`remote: ""`) even though their actual changes are live - most likely because they were applied directly via `db query` in earlier sessions (the same workaround used for the "top-up part" data fix above) rather than through `db push`, which is migration-history-aware. Needs a deliberate session (likely `supabase migration repair` to mark the untracked ones as applied) before `db push` will work again in a fresh CLI session - not attempted, per explicit instruction not to force migrations or alter history without it being asked for directly.
- ~~Two things flagged 2026-09-06 for Build Your Bar Stage 2~~ - **both done 2026-09-06**: "Includes substitutions." is real visible text under the live makeable-count (`BuildYourBar.jsx`), not a tooltip; the per-visit snapshot resets explicitly on a signed-in user id change (`HomeScreen.jsx`, a `useRef`-tracked comparison), documented alongside the honest caveat that a sign-out already fully unmounts the authenticated route tree in this app today, so this is a defensive backstop rather than a fix for an observed leak.

# Scenarios
S01 — Choose a drink
Yana suggests cocktails → I open Rusty Pipes → quickly find something I want.

S02 — Prepare two drinks
Choose cocktail → select 2 servings → quantities update → instructions are clear.

S03 — Sweet tropical request
Yana asks for something sweet and tropical → I can quickly get a few appropriate options.

# Decisions
Important decisions and why we made them

2026-09-05 — Parts ratio is computed by exact integer GCD reduction of stored ml amounts, not a fuzzy/rounded "nice ratio." Honest about awkward recipes rather than inventing tidier numbers.
2026-09-05 — Parts display mode is local to the recipe view, not a persisted preference like ml/oz (that column is DB-constrained to ml/oz only) - avoids a migration for what's meant to be a display-only feature.
2026-09-05 — Public share page (/share/:id) gets no servings control and stays at the base serving; the servings selector is member-facing only.
2026-09-05 — Servings-control touch targets must be ≥44×44px (stricter than this app's earlier 32px precedent elsewhere).
2026-09-05 — Before building the parts-mode UI (Stage 4): a recipe mixing stored-ml components with manually-typed "part" components must never visually imply they share one common part size - needs its own explicit fallback design first.
2026-09-05 — Serving-size selector + parts ratio view marked complete after Stage 5's integration review found no gaps in the feature itself (only one small pre-existing/adjacent editor bug, unrelated to correctness of scaling or ratios - see Follow-ups). No new manual verification was needed since the recorded checks from Stages 1-4 already covered ml/oz scaling, non-volume scaling, descriptive passthrough, parts ratio math, the mixed-recipe fallback, servings-hidden-in-parts-mode, and Copy Recipe/public-share behavior end to end.
2026-09-05 — The "top-up part" data corruption was repaired by a targeted, row-id-scoped `update`, not a broader text-pattern fix, even though a `unit_label ilike '%top-up%'` match would have caught the same 5 rows - precision over convenience for a data-correction migration, and re-verified against the live DB by primary key afterward rather than trusting the row count alone.
2026-09-05 — `parseUnitLabel()` and `scaleIngredientAmount()` were refactored to share one parser (the latter no longer runs its own separate regex match) rather than fixing the plural-normalization and descriptive-unit cases as two more independent implementations - avoids a third opportunity for the scaling logic and the editor's prefill to disagree about the same string.
2026-09-05 — The `db push` migration-history mismatch was diagnosed (`migration list --linked`) but deliberately left untouched - explicit instruction not to force migrations or alter history without being asked directly, and it's a separate, riskier problem from the data-correction task at hand.
2026-09-06 — Build Your Bar's essentials list (the six + the expanded 14) is a plain client-side name list, deliberately separate from `ingredient_types.bar_priority` - curating what appears on the homepage must never touch what actually drives Buy Next's purchase-recommendation ranking. `bar_priority` itself is untouched; Ice is included in the homepage list without becoming `bar_priority = 'essential'` in the database.
2026-09-06 — The homepage section's visibility uses an explicit per-visit snapshot (taken once, after the real inventory fetch resolves), not a live check against current ownership - a live check would hide the section after the very first tap, mid-selection, which is exactly what the user corrected the first draft of this plan for.
2026-09-06 — "Show my cocktails" sorts Library by availability rather than filtering it - nothing is ever hidden, so an almost-match is still visible immediately as a fallback when there aren't many complete matches, and Library's existing "no matches" empty state is never needed for this path.
2026-09-06 — The proposed six are all standalone types with no `parent_type_id` **and no children of their own** (both directions verified live, not assumed) - deliberately avoids the ambiguity found in the existing Whiskey/Rum essentials curation, where owning a generic parent type doesn't satisfy a recipe that needs a specific child subtype.
2026-09-06 — Mobile-first usability is now a standing acceptance criterion recorded in `AGENTS.md`, not just a Build Your Bar-specific concern - a real live-iPhone finding (focusing an input doesn't auto-open the keyboard on iOS) is exactly the kind of thing a desktop-only check would never catch, which is why "desktop supplements phone testing" is stated explicitly rather than assumed.
2026-09-06 — Build Your Bar's per-visit visibility snapshot resets on a signed-in user id change via an explicit ref comparison, even though a sign-out already fully unmounts the authenticated route tree in this app today (which would reset it anyway) - a cheap, explicit backstop is worth keeping in case that assumption ever changes, rather than relying on an architectural fact that isn't this component's own responsibility to guarantee.
