-- RLS regression suite, run on demand against the hosted linked project:
--   npx supabase db query --linked --file supabase/tests/rls_suite.sql
--
-- Why this exists: RLS on this project has so far only ever been verified
-- by hand, one migration at a time, via ad-hoc `supabase db query` calls
-- that are never re-run once the next migration lands. Two real RLS bugs
-- (recipes:read had an accidental admin-can-read-anyone's-private-recipe
-- clause; profiles was admin-or-self-only, blocking cross-member author
-- display) shipped and sat live before a user noticed - a repeatable suite
-- that anyone (or a future agent) can run in one command is the point.
--
-- No Docker/Podman is available in this sandbox, so a local Supabase
-- instance (`supabase start`, which `supabase test db`'s pgTAP support
-- needs) isn't an option here. This runs plain SQL directly against the
-- hosted linked project instead, using the same identity-simulation
-- technique already used for manual verification all session:
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';
-- `db query --linked` connects with full superuser privilege, so switching
-- the `role` GUC genuinely downgrades what the rest of the transaction can
-- see/do - it isn't just cosmetic.
--
-- Everything runs inside one transaction, rolled back at the very end, so
-- no fixture data is ever left behind on the hosted project regardless of
-- whether every check passes. Each check either raises a NOTICE ("PASS:
-- ...") or aborts the whole run with an exception ("FAIL: ..." or a real
-- Postgres error) - a failure is loud and stops at the exact broken check
-- rather than silently continuing or being averaged away in a pass count.
--
-- Fixture identities: reuses the three real accounts already live in this
-- project from manual QA (an admin's `profiles.id` and two ordinary
-- members') rather than inserting synthetic ones - `profiles.id` has a
-- hard FK to `auth.users(id)`, which can't be populated with a plain
-- insert (Supabase Auth owns that table), so real accounts are the only
-- practical fixture identities without standing up a local instance.
--
-- Coverage so far: recipes, ingredient_types, memberships (the three
-- tables that already had a real RLS bug found and fixed this session),
-- plus the five simple "member read, admin write" lookup tables (glasses,
-- taste_tags, cocktail_families, liquid_colors, ingredient_categories) via
-- one generic pg_temp.test_lookup_table() helper, since they all share the
-- identical policy shape. Not yet covered: products, ingredient_aliases,
-- invitations, ingredient_requests, user_inventory, recipe_components,
-- recipe_component_alternatives, lists. Add a new section per table
-- following the pattern below as a follow-up chunk.

begin;

-- pg_temp is session-local and is dropped automatically when this
-- connection closes - no schema pollution risk even outside the normal
-- rollback path below.
create function pg_temp.assert(cond boolean, msg text) returns void
language plpgsql as $$
begin
  if not cond then
    raise exception 'FAIL: %', msg;
  end if;
  raise notice 'PASS: %', msg;
end;
$$;

create temporary table rls_original_role (name text) on commit drop;
insert into rls_original_role select current_user;
grant all on rls_original_role to authenticated, anon;

-- Switches identity for the rest of the transaction. Always resets to the
-- real connecting role first, then assumes the target - `anon` isn't a
-- member of `authenticated` (they're siblings, not nested), so jumping
-- straight from one to the other without going through a role that IS
-- allowed to assume both (the original superuser connection) fails with
-- "permission denied to set role". Pass p_role = 'anon' or 'authenticated';
-- p_sub is ignored for 'anon' (auth.uid() has nothing to return regardless).
create function pg_temp.set_identity(p_role text, p_sub uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', (select name from rls_original_role), true);
  if p_role = 'anon' then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claims', '', true);
  else
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  end if;
end;
$$;

-- Real fixture identities (see header comment for why these aren't
-- synthetic). If these accounts ever get deleted/renamed, re-point these
-- three ids at whichever real admin + two real members exist instead. Runs
-- before any identity switch, so still full superuser privilege here.
create temporary table rls_fixture_ids (
  admin_id uuid,
  member_owner_id uuid,
  member_other_id uuid,
  glass_id uuid,
  category_id uuid
) on commit drop;

insert into rls_fixture_ids
select
  (select id from public.profiles where role = 'admin' limit 1),
  (select p.id from public.profiles p
     join public.memberships m on m.user_id = p.id
     where p.role = 'member' and m.revoked_at is null
     order by m.granted_at asc limit 1),
  (select p.id from public.profiles p
     join public.memberships m on m.user_id = p.id
     where p.role = 'member' and m.revoked_at is null
     order by m.granted_at asc offset 1 limit 1),
  (select id from public.glasses limit 1),
  (select id from public.ingredient_categories limit 1);
grant all on rls_fixture_ids to authenticated, anon;

do $$
declare f record;
begin
  select * into f from rls_fixture_ids;
  perform pg_temp.assert(f.admin_id is not null, 'fixture: a real admin account exists');
  perform pg_temp.assert(f.member_owner_id is not null, 'fixture: a real member account exists (owner)');
  perform pg_temp.assert(f.member_other_id is not null, 'fixture: a second real member account exists (non-owner)');
  perform pg_temp.assert(f.member_owner_id <> f.member_other_id, 'fixture: the two member accounts are distinct');
  perform pg_temp.assert(f.glass_id is not null, 'fixture: a real glass exists');
  perform pg_temp.assert(f.category_id is not null, 'fixture: a real ingredient category exists');
end;
$$;

-- ── recipes ──────────────────────────────────────────────────────────────

create temporary table rls_recipe_ids (private_id uuid, shared_id uuid) on commit drop;
insert into rls_recipe_ids (private_id, shared_id) values (null, null);
grant all on rls_recipe_ids to authenticated, anon;

-- Set up as member_owner: a member can only ever insert visibility='private'
-- (recipes:insert's with_check ties non-admin inserts to that), so the
-- shared/published fixture below has to be created as admin instead.
do $$
declare f record; v_id uuid;
begin
  select * into f from rls_fixture_ids;
  perform pg_temp.set_identity('authenticated', f.member_owner_id);

  insert into public.recipes (name, source_type, owner_id, visibility, glass_id)
  values ('RLS_TEST private recipe', 'user', f.member_owner_id, 'private', f.glass_id)
  returning id into v_id;
  update rls_recipe_ids set private_id = v_id;

  perform pg_temp.assert(true, 'recipes: owner can insert their own private recipe');
end;
$$;

do $$
declare f record;
begin
  select * into f from rls_fixture_ids;
  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  begin
    insert into public.recipes (name, source_type, owner_id, visibility, glass_id)
    values ('RLS_TEST forged-owner recipe', 'user', f.member_other_id, 'private', f.glass_id);
    perform pg_temp.assert(false, 'recipes: a member inserting with someone else''s owner_id should be denied');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'recipes: a member cannot insert a recipe owned by someone else');
  end;
end;
$$;

-- Admin fixture: a published community recipe, owned by member_owner. Admin
-- insert bypasses the visibility='private' restriction entirely (is_admin()
-- short-circuits recipes:insert's with_check), which is the only way to
-- seed a visibility='shared' row without going through the app's own
-- publish flow.
do $$
declare f record; v_id uuid;
begin
  select * into f from rls_fixture_ids;
  perform pg_temp.set_identity('authenticated', f.admin_id);

  insert into public.recipes (name, source_type, owner_id, visibility, moderation_status, glass_id)
  values ('RLS_TEST shared recipe', 'user', f.member_owner_id, 'shared', 'active', f.glass_id)
  returning id into v_id;
  update rls_recipe_ids set shared_id = v_id;

  perform pg_temp.assert(true, 'recipes: admin can insert a published community recipe fixture');
end;
$$;

-- Reads
do $$
declare f record; r record; n int;
begin
  select * into f from rls_fixture_ids;
  select * into r from rls_recipe_ids;

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  select count(*) into n from public.recipes where id = r.private_id;
  perform pg_temp.assert(n = 1, 'recipes: owner can read their own private recipe');

  perform pg_temp.set_identity('authenticated', f.member_other_id);
  select count(*) into n from public.recipes where id = r.private_id;
  perform pg_temp.assert(n = 0, 'recipes: a non-owner member cannot read someone else''s private recipe');

  -- Regression case: recipes:read used to have an `or is_admin()` branch,
  -- letting admin read any member's still-private recipe. Fixed in
  -- 20260823110000_tighten_recipe_read_scope.sql to match the spec, which
  -- has no admin clause for this policy at all.
  perform pg_temp.set_identity('authenticated', f.admin_id);
  select count(*) into n from public.recipes where id = r.private_id;
  perform pg_temp.assert(n = 0, 'recipes: admin cannot read another member''s private recipe (regression case)');

  perform pg_temp.set_identity('anon', null);
  select count(*) into n from public.recipes where id = r.private_id;
  perform pg_temp.assert(n = 0, 'recipes: anon cannot read a private recipe');

  perform pg_temp.set_identity('authenticated', f.member_other_id);
  select count(*) into n from public.recipes where id = r.shared_id;
  perform pg_temp.assert(n = 1, 'recipes: any member can read a published community recipe');

  perform pg_temp.set_identity('anon', null);
  select count(*) into n from public.recipes where id = r.shared_id;
  perform pg_temp.assert(n = 0, 'recipes: anon cannot read a published community recipe either (default-deny for unauthenticated)');
end;
$$;

-- Writes
do $$
declare f record; r record; affected int;
begin
  select * into f from rls_fixture_ids;
  select * into r from rls_recipe_ids;

  perform pg_temp.set_identity('authenticated', f.member_other_id);
  update public.recipes set name = 'RLS_TEST hijacked' where id = r.private_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'recipes: a non-owner member cannot update someone else''s private recipe');

  delete from public.recipes where id = r.private_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'recipes: a non-owner member cannot delete someone else''s private recipe');

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  update public.recipes set name = 'RLS_TEST renamed' where id = r.private_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 1, 'recipes: the owner can update their own private recipe');
end;
$$;

-- ── ingredient_types ─────────────────────────────────────────────────────

create temporary table rls_type_ids (new_id uuid) on commit drop;
insert into rls_type_ids (new_id) values (null);
grant all on rls_type_ids to authenticated, anon;

do $$
declare f record; n int;
begin
  select * into f from rls_fixture_ids;

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  select count(*) into n from public.ingredient_types;
  perform pg_temp.assert(n > 0, 'ingredient_types: an ordinary member can read the catalog');

  perform pg_temp.set_identity('anon', null);
  select count(*) into n from public.ingredient_types;
  perform pg_temp.assert(n = 0, 'ingredient_types: anon cannot read the catalog (member-only, no anon branch)');

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  begin
    insert into public.ingredient_types (category_id, name, bar_priority, recommend_by_default)
    values (f.category_id, 'RLS_TEST type', 'essential', false);
    perform pg_temp.assert(false, 'ingredient_types: an ordinary member inserting a new type should be denied');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'ingredient_types: an ordinary member cannot insert a new type');
  end;
end;
$$;

do $$
declare f record; v_type_id uuid; affected int;
begin
  select * into f from rls_fixture_ids;
  perform pg_temp.set_identity('authenticated', f.admin_id);

  insert into public.ingredient_types (category_id, name, bar_priority, recommend_by_default)
  values (f.category_id, 'RLS_TEST type', 'essential', false)
  returning id into v_type_id;
  update rls_type_ids set new_id = v_type_id;
  perform pg_temp.assert(true, 'ingredient_types: admin can insert a new type');

  perform pg_temp.set_identity('authenticated', f.member_other_id);
  update public.ingredient_types set name = 'RLS_TEST hijacked type' where id = v_type_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'ingredient_types: an ordinary member cannot update a type');

  delete from public.ingredient_types where id = v_type_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'ingredient_types: an ordinary member cannot delete a type');

  perform pg_temp.set_identity('authenticated', f.admin_id);
  update public.ingredient_types set name = 'RLS_TEST renamed type' where id = v_type_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 1, 'ingredient_types: admin can update a type');

  delete from public.ingredient_types where id = v_type_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 1, 'ingredient_types: admin can delete a type');
end;
$$;

-- ── memberships ──────────────────────────────────────────────────────────
-- No write policy exists for anyone, including admin - every membership
-- mutation goes through admin_set_membership_revoked()/create_invitation()'s
-- redemption path instead (both SECURITY DEFINER), specifically to avoid a
-- self-escalation path via a direct column grant. See current-context.md's
-- "Decisions made & why" for the reasoning. These checks confirm that
-- boundary holds at the RLS layer itself, not just by app-code discipline.

do $$
declare f record; n int; affected int;
begin
  select * into f from rls_fixture_ids;

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  select count(*) into n from public.memberships where user_id = f.member_owner_id;
  perform pg_temp.assert(n = 1, 'memberships: a member can read their own membership row');

  select count(*) into n from public.memberships where user_id = f.member_other_id;
  perform pg_temp.assert(n = 0, 'memberships: a member cannot read someone else''s membership row');

  perform pg_temp.set_identity('authenticated', f.admin_id);
  select count(*) into n from public.memberships where user_id = f.member_other_id;
  perform pg_temp.assert(n = 1, 'memberships: admin can read any membership row');

  -- Direct update, bypassing admin_set_membership_revoked() entirely.
  update public.memberships set revoked_at = now() where user_id = f.member_other_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'memberships: even admin cannot write directly - only the SECURITY DEFINER function can');

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  update public.memberships set revoked_at = now() where user_id = f.member_owner_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'memberships: a member cannot even revoke their own membership directly');

  perform pg_temp.set_identity('anon', null);
  begin
    insert into public.memberships (user_id, granted_at) values (f.member_owner_id, now());
    perform pg_temp.assert(false, 'memberships: anon inserting a membership row should be denied');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'memberships: anon cannot insert a membership row');
  end;
end;
$$;

-- ── glasses / taste_tags / cocktail_families / liquid_colors /
--    ingredient_categories ────────────────────────────────────────────────
-- All five share the identical "member read, admin write" shape (verified
-- live via pg_policies before writing this - liquid_colors' policies
-- target role {public} rather than {authenticated} like the other four,
-- but the outcome is the same either way since is_member()/is_admin() both
-- evaluate false with no identity set, so anon is denied regardless of
-- which mechanism the policy uses). One generic helper instead of five
-- near-identical copies - p_insert_cols/p_insert_vals are trusted literals
-- this file controls itself, not user input, so the dynamic SQL below
-- carries no injection risk.
create function pg_temp.test_lookup_table(
  p_table text, p_insert_cols text, p_insert_vals text,
  p_update_col text, p_update_val text
) returns void language plpgsql as $$
declare
  f record;
  v_id uuid;
  n int;
  affected int;
begin
  select * into f from rls_fixture_ids;

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  execute format('select count(*) from public.%I', p_table) into n;
  perform pg_temp.assert(n > 0, format('%s: an ordinary member can read', p_table));

  perform pg_temp.set_identity('anon', null);
  execute format('select count(*) from public.%I', p_table) into n;
  perform pg_temp.assert(n = 0, format('%s: anon cannot read', p_table));

  perform pg_temp.set_identity('authenticated', f.member_owner_id);
  begin
    execute format('insert into public.%I (%s) values (%s)', p_table, p_insert_cols, p_insert_vals);
    perform pg_temp.assert(false, format('%s: an ordinary member inserting should be denied', p_table));
  exception when insufficient_privilege then
    perform pg_temp.assert(true, format('%s: an ordinary member cannot insert', p_table));
  end;

  perform pg_temp.set_identity('authenticated', f.admin_id);
  execute format('insert into public.%I (%s) values (%s) returning id', p_table, p_insert_cols, p_insert_vals) into v_id;
  perform pg_temp.assert(true, format('%s: admin can insert', p_table));

  perform pg_temp.set_identity('authenticated', f.member_other_id);
  execute format('update public.%I set %I = %L where id = $1', p_table, p_update_col, p_update_val) using v_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, format('%s: an ordinary member cannot update', p_table));

  execute format('delete from public.%I where id = $1', p_table) using v_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, format('%s: an ordinary member cannot delete', p_table));

  perform pg_temp.set_identity('authenticated', f.admin_id);
  execute format('update public.%I set %I = %L where id = $1', p_table, p_update_col, p_update_val) using v_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 1, format('%s: admin can update', p_table));

  execute format('delete from public.%I where id = $1', p_table) using v_id;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 1, format('%s: admin can delete', p_table));
end;
$$;

do $$ begin
  perform pg_temp.test_lookup_table('glasses', 'name, shape', $vals$'RLS_TEST glass', 'martini'$vals$, 'name', 'RLS_TEST glass renamed');
end $$;
do $$ begin
  perform pg_temp.test_lookup_table('taste_tags', 'name', $vals$'RLS_TEST tag'$vals$, 'name', 'RLS_TEST tag renamed');
end $$;
do $$ begin
  perform pg_temp.test_lookup_table('cocktail_families', 'name, shape', $vals$'RLS_TEST family', 'highball'$vals$, 'name', 'RLS_TEST family renamed');
end $$;
do $$ begin
  perform pg_temp.test_lookup_table('liquid_colors', 'name, hex', $vals$'RLS_TEST color', '#123456'$vals$, 'name', 'RLS_TEST color renamed');
end $$;
do $$ begin
  perform pg_temp.test_lookup_table('ingredient_categories', 'name, sort_order', $vals$'RLS_TEST category', 999$vals$, 'name', 'RLS_TEST category renamed');
end $$;

rollback;
