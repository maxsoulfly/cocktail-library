# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. ~~DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0)~~ — **done, 2026-08-15**
4. Auth + invitation redemption (Phase 1) — **next**
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

Step 3 — Supabase project provisioned, initial schema migrated, RLS hardened. Also published the repo to GitHub and wired the Supabase client, which happened alongside this chunk (see Decisions below).

Repository: [github.com/maxsoulfly/cocktail-library](https://github.com/maxsoulfly/cocktail-library) (public). Supabase project: hosted free tier, `cocktail-library`, ref `uahasoyromnfkaedaklz`, region `ap-northeast-1`, Postgres 17.

Four migrations applied via `npx supabase db push` (linked to the hosted project):

- `20260815200430_initial_schema.sql` — `profiles`, `invitations`, `memberships`, and the taxonomy tables (`ingredient_categories`, `ingredient_types`, `ingredient_aliases`, `glasses`, `taste_tags`, `cocktail_families`), the `handle_new_user()` signup trigger, and `is_admin()`/`is_member()` RLS helper functions.
- `20260815201339_harden_rls_policies.sql` — first RLS pass (fixed `db advisors --type security` findings; superseded by the next migration for the multiple-permissive-policy shape, kept as-is since already applied).
- `20260815201523_fix_function_grants.sql` — `REVOKE EXECUTE ... FROM anon, authenticated` doesn't work via `FROM PUBLIC` on Supabase (grants are per-role by default, not via the PUBLIC pseudo-role) — this fixed it properly.
- `20260815201731_optimize_rls_policies.sql` — fixed `db advisors --type performance` findings: wrapped bare `auth.uid()` calls as `(select auth.uid())`, and split each table's read/write policies so no command has more than one applicable permissive policy.

`supabase/seed.sql` applied via `supabase db query --linked --file` (not `db push`, which only handles migrations): 11 ingredient categories, 19 ingredient types, 6 glasses, 10 taste tags, 4 cocktail families — small, clearly-labeled dev fixtures, not the real catalog.

Deliberately **not** in this migration set: `products`, `user_inventory`, `recipes` and friends, `favorites`/`want_to_make`. Those ship in their own migrations alongside the features that need them (steps 5/6/9).

## Implemented & verified

- `npx supabase db advisors --linked --type all` is clean except two accepted WARNs: `is_admin()`/`is_member()` are callable by `authenticated` (required — the `to authenticated` RLS policies invoke them at query time; both only ever return a boolean about the *calling* user's own status via `auth.uid()`, so there's no cross-user data exposure).
- Row counts spot-checked directly against the hosted DB after every migration (including after the two follow-up fixes) to confirm seed data wasn't disturbed.
- `@supabase/supabase-js` installed; `src/lib/supabaseClient.js` created (reads `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`, throws clearly if missing). Not yet imported/used anywhere in the app — that starts in step 4 (auth).
- `.env.local` has real values (gitignored). `.env.example` has the same two keys blank, and is deliberately un-ignored via a `!.env.example` exception in `.gitignore` (the existing `.env*` pattern would otherwise have excluded it too).

## Remaining / not started

Steps 4–13 per the phase plan above. Immediately next: auth (email/password + Google) and invitation redemption, which needs a `redeem_invitation(code)` SECURITY DEFINER function (invitations/memberships intentionally have no client-writable RLS policy — redemption has to go through protected backend logic, not direct table access).

## Blockers / open questions

None currently blocking.

## Decisions made & why

- **`gh` CLI isn't installed in this sandbox** (confirmed via both Bash and PowerShell). Worked around it: user created the empty GitHub repo manually via the web UI, I added the `origin` remote and pushed over HTTPS — Windows' system-wide `credential.helper=manager-core` handled auth without needing a stored token.
- **Didn't ask the user for a Supabase personal access token.** A PAT is account-wide (not project-scoped), so instead had the user run `npx supabase login` themselves in their own terminal (one-time interactive browser approval); my subsequent `supabase link`/`db push` commands reused that session automatically since we're on the same machine/user account. Same reasoning applied to the DB password the user shared in chat: used it once for `supabase link --password`, never written to any file.
- **Seed data applied via `supabase db query --linked --file supabase/seed.sql`, not `supabase db push`.** `db push` only replays `migrations/`; there's no hosted-project equivalent of the local `db reset` auto-seed. Worth remembering for any future reseeding.
- **`profiles`/`memberships` RLS uses combined single-purpose policies** (one `select` policy covering "own row OR admin", separate `insert`/`update`/`delete` policies for admin-only tables) rather than a `for all` admin policy plus a separate read policy. Found via `db advisors --type performance`: two permissive policies both matching `SELECT` makes Postgres evaluate both per query. This is now the pattern to replicate for every future RLS-protected table (products, recipes, user_inventory, etc.).
- **`role` on `profiles` is protected by column-level `REVOKE`/`GRANT`, not just RLS.** The row-level "update own profile" policy alone would let a user set their own `role` to `'admin'`; `revoke update on profiles from authenticated` + `grant update (display_name, unit_preference, theme_preference) to authenticated` closes that off at the column-privilege level, which RLS row policies can't do by themselves.
- **Invitation status (active/redeemed/expired/revoked) is derived from timestamp columns, not stored.** Avoids a status column that could drift out of sync with `expires_at`/`redeemed_at`/`revoked_at`.
- **Promoting the first real admin is a manual one-off SQL update** (`update profiles set role = 'admin' where id = '<their-auth-uid>'`), since `profiles` rows only come into existence via the `auth.users` signup trigger — there's no way to seed a fake admin without a real Supabase Auth account. Needed once someone actually signs up in step 4.

Earlier decisions (still standing): JS-only in `src/**` with `vite.config.ts` exempted as platform tooling; TS→JS conversion details from step 2 (see git history / earlier chunk notes for the full list — trimmed here to keep this file current rather than a diary, per AGENTS.md).

## Migrations / environment changes

Four migrations + one seed script applied to the hosted Supabase project, listed above under "Last completed chunk". `.env.local` (gitignored) holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. `.gitignore` gained a `!.env.example` exception. Repository published to GitHub 2026-08-15 (initial commit `d75f35c`); this chunk's work (migrations, client wiring) is staged but not yet committed — see next action.

## Tests / build checks last run

2026-08-15: `npx supabase db push` succeeded for all four migrations (each verified individually). `npx supabase db advisors --linked --type all` clean except the two accepted WARNs noted above. Row counts on all five seeded tables spot-checked against the live DB. No frontend build re-run this chunk (no `src/` changes except adding the unused-so-far `src/lib/supabaseClient.js`) — worth a `pnpm build` before/as part of the next chunk once it's actually imported.

## Exact next recommended action

Commit this chunk's work (migrations, seed, `.env.example`, `.gitignore` fix, `supabaseClient.js`, `package.json`/lockfile changes for `@supabase/supabase-js`) and push, per the user's standing "start committing after this" instruction. Then start step 4: Supabase email/password + Google auth wiring, a `redeem_invitation(code)` SECURITY DEFINER function (validates code against `invitations`, inserts into `memberships`, marks `redeemed_at`/`redeemed_by` - all atomically, all bypassing RLS by design since the caller has no membership yet), and the actual sign-in/sign-up UI hookup in `src/screens/WelcomeScreen.jsx`/`SignInScreen.jsx` (currently these just navigate on any input, no real Supabase calls).

## Files/areas relevant to next action

`src/screens/WelcomeScreen.jsx`, `src/screens/SignInScreen.jsx` (need real Supabase Auth calls), `src/lib/supabaseClient.js` (already created, unused so far), a new migration for the `redeem_invitation()` function, Supabase Dashboard → Authentication → Providers (Google OAuth needs a client ID/secret configured there - external setup the user will need to do, similar to the GitHub/Supabase account steps earlier), `docs/Cocktail_Library_Development_Spec.md` §5 (Access and authentication) for the exact behavior required.
