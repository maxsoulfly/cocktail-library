@AGENTS.md

## Read before working

1. `AGENTS.md` (imported above) — repo conventions and ownership boundaries.
2. `current-context.md` — live status; verify against the actual repo state before trusting it, it can drift.
3. `docs/Cocktail_Library_Development_Spec.md` — authoritative product spec. Don't silently expand, remove, or reinterpret scope.
4. `docs/Cocktail_Library_Mindmaps.md` — process/flow reference.

## Non-negotiables

- JavaScript only in `src/**` — no TypeScript in application source. (`vite.config.ts` is Figma Make platform tooling and is exempt.)
- Supabase Postgres + Auth (email/password + Google) + Data API + RLS + migrations/seed files + Edge Functions/protected DB functions where elevated logic is required. No custom Node/Express API — if Supabase genuinely can't do something safely, stop and explain the blocker before adding one.
- Row Level Security on every exposed table; never put the service-role key in browser code.
- Availability matching, unit conversion, recommendation ranking, and import validation live in pure, framework-free `src/domain/` modules — no fuzzy ingredient-name matching, ever.
- Store liquid quantities canonically in millilitres; convert only for display.

## Essential commands

- `pnpm dev` — dev server (already running on `$PORT`; don't start a second one)
- `pnpm build` — production build
- `pnpm format` — oxfmt
- `npx supabase ...` — Supabase CLI (not globally installed in this sandbox)
- `corepack pnpm ...` or `npx pnpm ...` — bare `pnpm` is not on PATH here
- `pnpm test` — Vitest, currently covering `src/domain/` only (no component/integration tests yet)
- Lint command: none introduced yet.

## Security rules

- RLS policies ship in the same commit/chunk as the feature that needs them; test with admin, member/non-owner, and anonymous identities.
- Invitation tokens are unguessable, expiring, single-use, and revocable; generation/redemption runs in protected backend logic, never client-side trust.
- Default-deny for unauthenticated and non-member users on all application data.

## A completed development chunk

A coherent, independently verifiable unit of work — e.g. "auth + membership gating," "My Bar inventory," "the availability engine" — not every small file edit. Before calling one done: run the relevant build/tests, update `current-context.md` with the verified result and the exact next action, and update `CLAUDE.md`/`AGENTS.md` only when a durable command, convention, or architectural fact has genuinely changed (not for progress notes).
