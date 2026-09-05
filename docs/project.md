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
Serving-size selector + parts ratio view (in progress, 2026-09-05 — Stages 1-4 of 5 done: all browser-verified on a real iPhone, every manual check passed (including Stage 4's post-verification UX follow-up hiding the servings selector and always showing base-recipe amounts while parts mode is active). Next: Stage 5, final integration/regression/docs, awaiting go-ahead. Full stage plan + design rationale in current-context.md.)

# Next
- Improve homepage usefulness for empty My Bar
- Improve mood/taste discovery

# Backlog
1. Serving-size selector
 - Scale recipe ingredient amounts based on number of cocktails being prepared.
 - Extended scope (2026-09-05): a third "parts" display mode alongside ml/oz, showing volume ingredients as a reduced ratio (e.g. 60ml rum + 30ml lime → 2 parts : 1 part). Display-only, no new stored value for "1 part = N ml".

# Follow-ups (low priority, not blocking)
- Countable non-volume units (dash, piece, slice, wedge, splash) aren't pluralized at save time in the manual editor or batch import - e.g. picking "dash" with amount 2 stores "2 dash", not "2 dashes". Pre-existing, unrelated to serving-size scaling; found 2026-09-05 while building Stage 1. Only visible at the base 1-serving view - scaling to 2+ servings already self-corrects it since pluralization there is re-derived from the final count. Worth a small fix (auto-pluralize on save) whenever editor/import work is next touched.

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
