-- Redeeming an invitation is the only way a `memberships` row is created.
-- Runs as SECURITY DEFINER specifically to bypass RLS on invitations/
-- memberships (the caller has no membership yet, by definition, so an RLS
-- policy could never let them do this themselves). The row lock (`for
-- update`) prevents two concurrent redemptions of the same code racing each
-- other. Idempotent for a user who already has a membership, so retries
-- (double-click, restored session, etc.) are harmless.

create function public.redeem_invitation(invitation_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    return;
  end if;

  select * into v_invitation
  from public.invitations
  where code = invitation_code
  for update;

  if not found then
    raise exception 'This invitation code is not valid.';
  end if;

  if v_invitation.revoked_at is not null then
    raise exception 'This invitation has been revoked.';
  end if;

  if v_invitation.redeemed_at is not null then
    raise exception 'This invitation has already been used.';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'This invitation has expired.';
  end if;

  update public.invitations
  set redeemed_at = now(), redeemed_by = auth.uid()
  where id = v_invitation.id;

  insert into public.memberships (user_id, invitation_id)
  values (auth.uid(), v_invitation.id);
end;
$$;

revoke execute on function public.redeem_invitation(text) from anon, authenticated;
grant execute on function public.redeem_invitation(text) to authenticated;
