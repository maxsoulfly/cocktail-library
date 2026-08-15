-- Follow-up to 20260815201339_harden_rls_policies.sql: `revoke execute ...
-- from public` there was a no-op, because Supabase's default privileges grant
-- EXECUTE directly to the `anon`/`authenticated` roles by name, not via the
-- PUBLIC pseudo-role. Revoke from the actual roles instead.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_member() from anon, authenticated;

-- Still needed for the `to authenticated` RLS policies to invoke these during
-- query evaluation for signed-in users.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_member() to authenticated;
