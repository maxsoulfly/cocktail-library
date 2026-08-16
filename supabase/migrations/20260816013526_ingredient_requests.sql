-- Members can't create ingredient types directly (spec §4/§7.2), but had no
-- way to flag a gap either - the Garnish/Juice conversation this session
-- surfaced real missing types with no path to report them short of asking
-- in chat. A lightweight request queue: members submit a name + optional
-- note, admin reviews from a new AdminScreen tab and marks it
-- fulfilled/dismissed. Deliberately no workflow beyond that (no auto-
-- creation, no notification) - this is a suggestion box, not an approval
-- pipeline.

create table public.ingredient_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id),
  name text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index ingredient_requests_requested_by_idx on public.ingredient_requests (requested_by);
create index ingredient_requests_status_idx on public.ingredient_requests (status);

alter table public.ingredient_requests enable row level security;

create policy "ingredient_requests: read own or admin" on public.ingredient_requests
  for select to authenticated using (requested_by = (select auth.uid()) or public.is_admin());

create policy "ingredient_requests: insert own" on public.ingredient_requests
  for insert to authenticated with check (requested_by = (select auth.uid()));

-- Members can withdraw their own request while it's still pending; once an
-- admin has acted on it, the record belongs to their review history.
create policy "ingredient_requests: owner deletes while pending" on public.ingredient_requests
  for delete to authenticated using (requested_by = (select auth.uid()) and status = 'pending');

create policy "ingredient_requests: admin resolves" on public.ingredient_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
