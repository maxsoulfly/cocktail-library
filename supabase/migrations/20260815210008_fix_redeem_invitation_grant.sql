-- redeem_invitation() still showed up in `db advisors` as callable by anon
-- after the previous migration's `revoke ... from anon, authenticated`. Turns
-- out `create function` grants EXECUTE to the PUBLIC pseudo-role by default
-- (a plain Postgres behavior, separate from Supabase's own anon/authenticated/
-- service_role default grants) - revoking only the named roles left the
-- PUBLIC grant in place, and every role implicitly inherits from PUBLIC.
--
-- The three functions from earlier migrations (handle_new_user, is_admin,
-- is_member) turned out not to have this problem, but revoking from PUBLIC
-- explicitly going forward is the robust pattern - see AGENTS.md.

revoke execute on function public.redeem_invitation(text) from public, anon, authenticated;
grant execute on function public.redeem_invitation(text) to authenticated;
