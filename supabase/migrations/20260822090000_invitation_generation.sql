-- Real invitation generation, replacing the client-only mock in
-- AdminScreen.jsx (MOCK_INVITES / generateInvite were pure useState, never
-- touching the DB - the codes shown there could never actually redeem,
-- since redeem_invitation checks the real invitations table).
--
-- Generation runs as SECURITY DEFINER rather than a direct client insert
-- (even though admins already have full RLS access to `invitations` via
-- "invitations: admin manages") per AGENTS.md's security rule: invitation
-- generation must run in protected backend logic, not client-side trust.
-- Keeping the code's randomness/uniqueness-retry in one server-side place
-- also avoids duplicating that logic in JS.
--
-- Revocation does NOT get a matching function - admins already have a full
-- RLS grant on this table, and `resolveIngredientRequest`/`createIngredientTypes`
-- establish the precedent that an admin-only RLS-gated direct update/insert
-- is sufficient when the caller already holds the necessary role, reserving
-- SECURITY DEFINER for cases where RLS can't grant the caller access at all
-- (redeem_invitation, publish/moderate crossing ownership).

alter table public.invitations drop constraint invitations_redeemed_by_fkey;
alter table public.invitations
  add constraint invitations_redeemed_by_fkey foreign key (redeemed_by) references public.profiles (id);

comment on constraint invitations_redeemed_by_fkey on public.invitations is
  'References profiles (not auth.users) so PostgREST can embed the redeemer''s display_name, matching created_by and ingredient_requests.requested_by.';

create function public.create_invitation(expires_in_days integer default 60)
returns public.invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_row public.invitations;
  v_attempt int := 0;
  i int;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can generate invitations.';
  end if;

  if expires_in_days is null or expires_in_days <= 0 then
    raise exception 'expires_in_days must be a positive number.';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'CL-';
    for i in 1..5 loop
      v_code := v_code || substr(v_chars, (floor(random() * length(v_chars)) + 1)::int, 1);
    end loop;
    v_code := v_code || '-';
    for i in 1..3 loop
      v_code := v_code || substr(v_chars, (floor(random() * length(v_chars)) + 1)::int, 1);
    end loop;

    begin
      insert into public.invitations (code, created_by, expires_at)
      values (v_code, auth.uid(), now() + (expires_in_days || ' days')::interval)
      returning * into v_row;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'Could not generate a unique invitation code - try again.';
      end if;
    end;
  end loop;

  return v_row;
end;
$$;

revoke execute on function public.create_invitation(integer) from public, anon, authenticated;
grant execute on function public.create_invitation(integer) to authenticated;
