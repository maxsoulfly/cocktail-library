-- User management for admins: change a member's role (member/admin) and
-- block/unblock their access - neither had any write path before. profiles
-- has had a role column since day one, but the original migration's own
-- comment said promoting to admin was "a manual operation until an
-- admin-management flow exists". memberships has had zero write policy for
-- anyone but the invitation-redemption function ("Rows are created only by
-- protected invitation-redemption logic, never directly by clients").
--
-- Scoping confirmed with the user before writing this: block is a
-- soft-revoke column, mirroring how invitations already models revocation
-- via a timestamp rather than a delete - preserves the original
-- invitation_id/granted_at and makes unblocking a clean reversal instead of
-- fabricating a new row. Neither function lets an admin target their own
-- account, so nobody can lock themselves out with no other admin around to
-- undo it. "Edit" was scoped to role + block only - display_name stays
-- self-managed (More screen), nothing else on profiles needs an admin path.

alter table public.memberships add column revoked_at timestamptz;

comment on column public.memberships.revoked_at is 'Soft-revoke: non-null means the membership is blocked. Set/cleared only via admin_set_membership_revoked() - RLS grants no direct client write on this table.';

-- is_member() is the single gate every "members read" / is_member()-checked
-- RLS policy across the schema goes through, so this one change blocks a
-- revoked user's access everywhere at once rather than needing to touch
-- every individual policy.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and revoked_at is null
  );
$$;

-- Role changes go through a function rather than a direct RLS/column grant.
-- profiles already has an "update own" policy for authenticated users
-- (display_name/unit/theme only, via its own column grant) - broadening
-- that column grant to also cover `role` would let the SAME "update own"
-- policy be satisfied by a member's own row, silently letting anyone
-- self-promote, since Postgres OR's multiple permissive policies together
-- rather than requiring the admin-only one specifically. A SECURITY
-- DEFINER function sidesteps that: it runs with its own elevated privilege
-- and the dangerous column grant never needs to exist on the client-facing
-- surface at all.
create function public.admin_set_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change a member''s role.';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  if new_role not in ('admin', 'member') then
    raise exception 'Invalid role.';
  end if;

  update public.profiles set role = new_role
  where id = target_user_id
  returning * into v_row;

  if v_row is null then
    raise exception 'No such user.';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- Block/unblock - same "protected function, not a direct grant" precedent
-- as membership creation itself (redeem_invitation()). memberships has
-- deliberately had zero client-facing write policy since day one; this
-- keeps that boundary intact instead of opening a new RLS write surface on
-- a security-sensitive table.
create function public.admin_set_membership_revoked(target_user_id uuid, revoked boolean)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.memberships;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change a member''s access.';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot block or unblock your own account.';
  end if;

  update public.memberships
  set revoked_at = case when revoked then now() else null end
  where user_id = target_user_id
  returning * into v_row;

  if v_row is null then
    raise exception 'That user has no membership to block/unblock.';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.admin_set_membership_revoked(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_membership_revoked(uuid, boolean) to authenticated;
