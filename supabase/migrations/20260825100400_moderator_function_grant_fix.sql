-- Follow-up to 20260825100000_moderator_role.sql: db advisors flagged
-- is_moderator()/is_admin_or_moderator() as anon-executable, unlike their
-- siblings is_admin()/is_member(). `create function` grants EXECUTE to
-- PUBLIC by default (plain Postgres behavior) - revoking only the named
-- anon/authenticated roles leaves that PUBLIC grant in place, and every
-- role (including anon) inherits from PUBLIC. AGENTS.md's own documented
-- gotcha, missed on the first pass - revoke PUBLIC explicitly too.

revoke execute on function public.is_moderator() from public;
revoke execute on function public.is_admin_or_moderator() from public;
