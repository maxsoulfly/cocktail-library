# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0) — **next**
4. Auth + invitation redemption (Phase 1)
5. Ingredient/product catalog + private My Bar (Phase 2)
6. Recipes, private recipe CRUD, components, substitutions, families, relationships (Phase 3)
7. Unit preference + conversion (Phase 3)
8. Availability engine, tested (Phase 3)
9. Library browsing, filters, Favorites, Want to Make (Phase 4)
10. Purchase recommendations, tested (Phase 4)
11. Recipe publishing + admin unpublishing (Phase 5)
12. Admin catalog tools + JSON import preview/validation (Phase 5)
13. Responsive/accessibility/security/deployment QA (Phase 6)

Each numbered step is a development chunk boundary for this file.

## Last completed chunk

Step 2 — TypeScript → JavaScript conversion, app shell, routing, design tokens. The former monolithic `src/App.tsx` (1837 lines) is now decomposed and JS-only:

- `src/main.jsx`, `src/App.jsx` (routes + `AppShell` layout)
- `src/screens/` — one file per screen (Welcome, SignIn, Home, Library, Detail, MyBar, AddProduct, Editor, Lists, More, Admin)
- `src/components/` — `Nav.jsx` (BottomNav/SideNav/TopBar), `CocktailCard.jsx`, `GlassSvg.jsx`, `icons.jsx`, `primitives.jsx` (Btn/Card/Input/Badge/etc.)
- `src/domain/availability.js` — `computeAvail`/`mlToOz`/`formatAmount`, pure and framework-free
- `src/data/mockData.js` and `src/data/constants.js` — the same dev fixtures as before, clearly labeled as fixtures to be replaced by Supabase data

No screen or behavior was dropped; all screens still work off local component state with the same mock data as before. `react-router-dom` replaced the old manual `Screen`-state switch (real URLs now, e.g. `/library/negroni`; browser back button works via `navigate(-1)`).

## Implemented & verified

- Full JS/JSX rewrite builds cleanly: `pnpm build` → 43 modules, no errors, `dist/` output produced.
- `pnpm dev` serves correctly on port 8443 (verified via `curl`; `<title>` and meta tags render from the new `.figma/make/site.json`, confirming the Figma Make plugin pipeline still works with JS source).
- Still nothing backed by Supabase — no real auth, no persistence, no RLS. All app state (inventory, favorites, want-to-make, unit/theme prefs) is local `useState` in `AppShell`, shared to routed screens via router `Outlet` context. `isAdmin` is hardcoded `true` until Phase 1 brings real roles.

## Remaining / not started

Steps 3–13 per the phase plan above: Supabase project setup, migrations/seed/RLS, auth + invitation redemption, ingredient/product catalog + My Bar persistence, recipes/components/substitution groups/families, unit preference persistence, the availability engine as a *tested* module (logic exists in `src/domain/availability.js` but has no test suite yet — no test runner is installed), library browsing backed by real data, purchase recommendations, recipe publish/admin unpublish, admin catalog tools + JSON import, and the final QA pass.

## Blockers / open questions

None currently blocking.

## Decisions made & why

- **`computeAvail` takes a `resolveIngredientName` callback instead of importing the mock ingredient catalog directly** (`src/domain/availability.js`). Keeps the availability engine genuinely framework/data-source-free per AGENTS.md, so it doesn't need rework when ingredient data moves from `src/data/mockData.js` to Supabase in a later chunk.
- **Added `react-router-dom`** rather than keeping the old manual screen-state switch. The phase text explicitly named "routing" as a Phase 0 deliverable; router `Outlet` context turned out to also be a clean way to share app state with routed screens without prop-drilling or introducing a separate Context provider, and it gave real back-button/deep-link behavior for free (e.g. `/library/negroni`).
- **Created `.figma/make/site.json`** (title/description/language). `vite.config.ts` statically imports this file and `pnpm build`/`pnpm dev` both failed without it — it isn't gitignored and every field in the plugin's `FigmaSiteConfiguration` type is optional, so this reads as a normal project file that was simply missing from this checkout rather than something the platform injects at runtime. Filled in with real product copy instead of stubbing it empty.
- **Dropped dead code found during conversion**: an unused `cn()` classnames helper, and unused `isDesktop`/`isTablet` variables in the old `App()` that were computed but never read (layout is handled entirely by CSS media queries).
- Renamed `package.json` `name` from `figma-make-app` to `cocktail-library`.
- Narrowed `tsconfig.json` to just `vite.config.ts` (the one file that stays TypeScript) and added `jsconfig.json` for editor support of the `@/*` import alias across the new `src/` JS files.

Earlier decisions (still standing): JS-only in `src/**` with `vite.config.ts` exempted as platform tooling; building the real Supabase backend directly in this sandbox (`npx supabase` v2.114.0, `git`, `node` v22 all confirmed reachable; bare `pnpm` isn't on PATH, use `corepack pnpm`/`npx pnpm`).

## Migrations / environment changes

No Supabase migrations yet — no `supabase/` directory exists, no `.env` handling exists yet (that starts in step 3/4). Non-Supabase environment change this chunk: added `.figma/make/site.json` (see above).

## Tests / build checks last run

2026-08-15: `corepack pnpm install` succeeded (added `react-router-dom`, removed `@types/react`/`@types/react-dom`). `corepack pnpm build` succeeded — 43 modules transformed, `dist/index.html` + JS/CSS assets emitted, no errors. `corepack pnpm dev` verified serving on `http://localhost:8443/` with correct title/meta tags. No automated test suite exists yet — one should be introduced in step 8 (availability engine tests) at the latest.

## Exact next recommended action

Start step 3: design and write the initial Supabase migrations — `profiles`, `memberships`, `invitations`, ingredient/product/recipe taxonomy tables per the dev spec's §8.2 suggested entities — plus seed data and RLS policies, using `npx supabase` locally. This needs a Supabase project (local `supabase start` or a hosted project + connection details) before `.env`/client wiring can follow in step 4.

## Files/areas relevant to next action

New `supabase/migrations/`, `supabase/seed/` directories (per AGENTS.md target structure); `docs/Cocktail_Library_Development_Spec.md` §8 (Domain model) and §5 (Access and authentication) for the schema to encode; `.gitignore` already ignores `.env*`. No Supabase project is configured yet — confirm with the user whether to use `supabase start` (local Docker-based Postgres) or connect to an existing hosted Supabase project before writing migrations that assume one or the other.
