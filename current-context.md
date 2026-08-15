# Current Context — Cocktail Library

## Phase & chunk

Agreed phase plan (revised by user on 2026-08-15 — private recipe CRUD moved into Phase 3 with recipes; publish/unpublish moderation moved to Phase 5 with admin tools):

1. ~~Inspect repository, reconcile continuity files~~ — done
2. ~~Convert TypeScript scaffold to JavaScript; app shell, routing, env handling, design tokens (Phase 0)~~ — **done, 2026-08-15**
3. ~~DB migrations, seed taxonomies, profiles/memberships/invitations/roles, RLS (Phase 0)~~ — **done, 2026-08-15**
4. ~~Auth + invitation redemption (Phase 1)~~ — **done and verified, 2026-08-16**
5. Ingredient/product catalog + private My Bar (Phase 2) — **next**
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

Step 4 — real Supabase Auth wiring and invitation redemption, replacing every piece of fake navigation-only auth from the original prototype.

**Database**: `20260815205804_invitation_redemption.sql` adds `redeem_invitation(invitation_code text)` — a `SECURITY DEFINER` function that validates a code (exists, not revoked, not already redeemed, not expired), row-locks it (`for update`) to prevent a race between two concurrent redemptions, then atomically marks it redeemed and inserts the `memberships` row. Idempotent if the caller already has a membership. `20260815210008_fix_redeem_invitation_grant.sql` closed an `anon`-callable gap the security advisor caught (see Decisions).

**Client**: `src/services/auth.js` (signUp/signIn/signInWithGoogle/signOut/sendPasswordReset/redeemInvitation, plus sessionStorage helpers for carrying an invite code across an OAuth/email-confirmation redirect), `src/services/membership.js` (fetchProfile/fetchMembership), `src/hooks/useSupabaseSession.js` + `src/hooks/useMembership.js` (React state wrapping those).

**App-level gating** (`src/App.jsx`, rewritten): `App()` now branches on real state instead of always rendering the router tree —
- no session → only `/signin` and Welcome are reachable;
- session but no membership → `JoinScreen` (auto-redeems a pending code from sessionStorage, or offers a manual entry field + sign out);
- session + membership → the existing authenticated route tree, now fed a real `profile` (so `isAdmin` is `profile.role === 'admin'`, not a hardcoded `true`).

**Screens updated**: `WelcomeScreen` (invite code now just gets stashed for post-auth redemption — no more client-side fake validation against hardcoded demo codes), `SignInScreen` (real signUp/signInWithPassword/Google OAuth/password reset, mode-aware via a `?mode=join` query param), `MoreScreen` and `HomeScreen` (real display name/email instead of hardcoded "Alex Novak").

## Implemented & verified

- `pnpm build` succeeds — 92 modules (up from 43; the Supabase client and everything downstream of it is now actually imported and bundled). Vite's >500kB chunk-size note is expected (supabase-js's weight) and not worth chasing yet.
- `npx supabase db advisors --linked --type all` clean except the three expected WARNs (`is_admin`, `is_member`, `redeem_invitation` all being callable by `authenticated` — required, and all three only ever act on/return info about the *calling* user).
- **Real signup verified end-to-end 2026-08-16.** User created their own account via the Supabase Dashboard's Users page (rather than the app's sign-up form — an equally valid path, since `handle_new_user()` fires on any `auth.users` insert regardless of how it happened) using `max.kibinimat@gmail.com`. Confirmed the trigger created a `profiles` row automatically (`role: 'member'` by default). Bootstrapped as the first admin via direct SQL (id `4c21b2bc-2253-4063-b287-ca8de2bbca87`): inserted a `memberships` row and set `role = 'admin'`. Refreshed the app — landed straight into the real Home dashboard with the Admin section visible, confirming the whole session → membership → route-gating chain works.

## Remaining / not started

Steps 5–13. Also two loose ends from step 4 specifically:
- Unit/theme preference still isn't read from or written to `profiles.unit_preference`/`profiles.theme_preference` — `AppShell` still initializes both from hardcoded defaults every load. Deferred rather than half-done; natural to pick up alongside step 7.
- No automated test coverage of `redeem_invitation()`'s edge cases (expired/revoked/already-used/race) — flagged as a candidate for whenever a test setup exists (step 8 at the latest per AGENTS.md).

## Blockers / open questions

None currently blocking. (Resolved 2026-08-16: real signup + admin bootstrap, see above. Google OAuth provider setup is still undone in the Supabase Dashboard, but that only blocks the Google sign-in button specifically, not any core flow — email/password is fully working. Revisit whenever Google sign-in actually needs testing.)

Still true for every *future* invited user until step 12 builds the admin import/invite-management UI: generating an invitation code has no UI yet. Workaround in the meantime: `insert into public.invitations (code, created_by, expires_at) values ('CL-XXXX-XXX', '4c21b2bc-2253-4063-b287-ca8de2bbca87', now() + interval '30 days');` via `supabase db query --linked` (using the admin's id above for `created_by`).

## Decisions made & why

- **`redeem_invitation()` needed a second grant-fixing migration.** Same root cause as the earlier `is_admin`/`is_member` issue but the mirror image: this time the *named* `anon`/`authenticated` grants were correctly revoked, but `create function` also grants EXECUTE to the `PUBLIC` pseudo-role by default (plain Postgres behavior), and every role inherits from PUBLIC. Now documented in `AGENTS.md` as a standing rule: always revoke from `public, anon, authenticated` explicitly, verify with `db advisors` after every function-adding migration.
- **No pre-auth "is this code valid" check.** The Welcome screen used to fake-validate against hardcoded codes; real validation only happens through `redeem_invitation()`, which requires `auth.uid()` and therefore an authenticated caller. Considered adding an `anon`-callable "check code" RPC for earlier UX feedback, but skipped it — invitation codes are meant to be unguessable/high-entropy per the spec, and not exposing *any* anon-callable surface against the invitations table is a strictly safer default than a boolean-only check would be. Matches the mindmap's documented flow (auth happens before redemption is attempted), and is the smaller/simpler implementation besides.
- **Invite code survives redirects via `sessionStorage`, not router state.** Google OAuth and (optionally) email-confirmation both involve a full-page redirect away from and back to the app, which drops any in-memory React/router state. `sessionStorage` survives that within the same tab.
- **App-level gating branches by returning entirely different trees** (`if (!session) return <Routes>...</Routes>`, etc.) rather than nested route guards/`<Outlet>` wrappers for every state. Simpler to read top-to-bottom for three mutually-exclusive states; revisit if the branching logic grows more complex than this.
- **Bootstrapping the first admin has no UI and isn't going to get one.** It's a one-time manual SQL operation (see Blockers above) — building a UI for something that happens exactly once per deployment isn't worth it.

Earlier decisions (still standing, trimmed here — see git history for full step-2/step-3 notes rather than growing this into a diary): JS-only in `src/**` with `vite.config.ts` exempted; hosted Supabase over local; repo published to `github.com/maxsoulfly/cocktail-library`; RLS policy shape (combined read policy + separate single-command write policies) for every future table.

## Migrations / environment changes

Two new migrations this chunk (`20260815205804_invitation_redemption.sql`, `20260815210008_fix_redeem_invitation_grant.sql`), both applied via `supabase db push`. No new environment variables. `AGENTS.md` gained the PUBLIC-grant rule under "Database & Row Level Security" and documented `src/hooks/`/`src/lib/` in the structure section.

## Tests / build checks last run

2026-08-16: `pnpm build` — 92 modules, no errors. `npx supabase db push` — both migrations applied. `npx supabase db advisors --linked --type all` — clean except the three expected WARNs. Real browser signup + admin bootstrap performed by the user and confirmed working (see Implemented & verified above).

## Exact next recommended action

Start step 5: ingredient/product catalog + private My Bar. Needs a new migration for `products` (branded/homemade items, each mapped to an existing `ingredient_types` row — members can add products, never new types, per the spec) and `user_inventory` (private per-user ownership records, presence-only, RLS scoped to own rows), following the same RLS shape established in step 3 (combined read policy + separate single-command write policies, functions locked down per the PUBLIC-grant rule in AGENTS.md). Then swap `MyBarScreen.jsx`/`AddProductScreen.jsx` off `src/data/mockData.js` onto real queries via new `src/services/catalog.js`/`src/services/inventory.js` modules.

## Files/areas relevant to next action

`supabase/migrations/` (new migration for `products`/`user_inventory`), `src/services/catalog.js` and `src/services/inventory.js` (new), `src/screens/MyBarScreen.jsx` and `src/screens/AddProductScreen.jsx` (currently read `INGS`/`ING_CATEGORIES` from `src/data/mockData.js` — need to switch to real queries against `ingredient_types`/`ingredient_categories`/`products`/`user_inventory`), `docs/Cocktail_Library_Development_Spec.md` §7.4 (My Bar) and §8.1 (ingredient type vs. product) for the exact behavior required.
