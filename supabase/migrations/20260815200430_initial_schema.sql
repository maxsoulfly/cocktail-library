-- Identity/access layer (profiles, invite-only membership, invitations) plus the
-- admin-managed taxonomy tables that recipes will reference later (ingredient
-- types/categories/aliases, glasses, taste tags, cocktail families).
--
-- Deliberately NOT in this migration: products, user_inventory, recipes and
-- friends, favorites/want-to-make. Those ship in their own migrations alongside
-- the features that need them (My Bar, recipes, lists), per AGENTS.md.

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per authenticated user, created automatically on signup (see trigger
-- below). role defaults to 'member' and is intentionally NOT client-writable
-- (see the column-level grant at the bottom) - promoting to admin is a manual
-- operation until an admin-management flow exists.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  unit_preference text not null default 'ml' check (unit_preference in ('ml', 'oz')),
  theme_preference text not null default 'system' check (theme_preference in ('dark', 'light', 'system')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public application profile and role, one per auth.users row.';

-- ── invitations ──────────────────────────────────────────────────────────────
-- Status (active/redeemed/expired/revoked) is derived from the timestamp
-- columns rather than stored, so there's no separate status field that could
-- drift out of sync.

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users (id),
  revoked_at timestamptz
);

comment on table public.invitations is 'Expiring, single-use invitation codes. Redemption/creation happens through protected backend logic, not direct client writes - see the redeem_invitation() function added alongside auth in a later migration.';

-- ── memberships ──────────────────────────────────────────────────────────────
-- Existence of a row = the user has valid application access. Kept separate
-- from profiles (rather than a boolean column) so "authenticated but not a
-- member" is representable and easy to check via EXISTS in RLS policies.

create table public.memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  invitation_id uuid references public.invitations (id),
  granted_at timestamptz not null default now()
);

comment on table public.memberships is 'Grants invite-only application access. Rows are created only by protected invitation-redemption logic, never directly by clients.';

-- ── taxonomy: ingredient categories/types/aliases ───────────────────────────

create table public.ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.ingredient_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.ingredient_categories (id),
  parent_type_id uuid references public.ingredient_types (id),
  name text not null unique,
  color text,
  bar_priority text not null default 'common' check (bar_priority in ('essential', 'common', 'specialized', 'niche')),
  recommend_by_default boolean not null default true,
  description text
);

comment on column public.ingredient_types.parent_type_id is 'Optional hierarchy, e.g. Spirit -> Gin -> London Dry Gin. Used for explicit-ancestry matching only - never text similarity.';
comment on column public.ingredient_types.bar_priority is 'Drives purchase-recommendation ranking: essential/common are promoted, specialized/niche are suppressed from general suggestions.';

create index ingredient_types_category_id_idx on public.ingredient_types (category_id);
create index ingredient_types_parent_type_id_idx on public.ingredient_types (parent_type_id);

create table public.ingredient_aliases (
  id uuid primary key default gen_random_uuid(),
  ingredient_type_id uuid not null references public.ingredient_types (id) on delete cascade,
  alias text not null,
  unique (ingredient_type_id, alias)
);

comment on table public.ingredient_aliases is 'Controlled search/import aliases - resolved explicitly during batch import, never guessed from name similarity.';

create index ingredient_aliases_ingredient_type_id_idx on public.ingredient_aliases (ingredient_type_id);

-- ── taxonomy: glasses, taste tags, cocktail families ────────────────────────

create table public.glasses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.taste_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.cocktail_families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- ── auth.users -> profiles trigger ──────────────────────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS helper functions ────────────────────────────────────────────────────
-- security definer + a locked-down search_path so these are safe to call from
-- policies on other tables without being subject to (or manipulable via)
-- caller-controlled search_path tricks.

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.memberships where user_id = auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── RLS: profiles ────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: admin reads all" on public.profiles
  for select using (public.is_admin());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- Column-level grant so `role` can never be changed by the user themselves,
-- even though the row-level policy above would otherwise permit the update.
revoke update on public.profiles from authenticated;
grant update (display_name, unit_preference, theme_preference) on public.profiles to authenticated;

-- ── RLS: invitations ─────────────────────────────────────────────────────────
-- Admin-only end to end. Redemption by a not-yet-member user does not go
-- through these policies at all - it goes through a SECURITY DEFINER function
-- added in the auth chunk, which bypasses RLS by design.

alter table public.invitations enable row level security;

create policy "invitations: admin manages" on public.invitations
  for all using (public.is_admin()) with check (public.is_admin());

-- ── RLS: memberships ─────────────────────────────────────────────────────────
-- No insert/update/delete policy at all: membership rows are only ever
-- created by protected invitation-redemption logic (SECURITY DEFINER /
-- service role), which bypasses RLS.

alter table public.memberships enable row level security;

create policy "memberships: read own" on public.memberships
  for select using (user_id = auth.uid());

create policy "memberships: admin reads all" on public.memberships
  for select using (public.is_admin());

-- ── RLS: taxonomy tables ─────────────────────────────────────────────────────
-- Same shape for all six: any registered member can read, only the
-- administrator can write. Non-members and anonymous users get nothing.

alter table public.ingredient_categories enable row level security;
create policy "ingredient_categories: members read" on public.ingredient_categories for select using (public.is_member());
create policy "ingredient_categories: admin writes" on public.ingredient_categories for all using (public.is_admin()) with check (public.is_admin());

alter table public.ingredient_types enable row level security;
create policy "ingredient_types: members read" on public.ingredient_types for select using (public.is_member());
create policy "ingredient_types: admin writes" on public.ingredient_types for all using (public.is_admin()) with check (public.is_admin());

alter table public.ingredient_aliases enable row level security;
create policy "ingredient_aliases: members read" on public.ingredient_aliases for select using (public.is_member());
create policy "ingredient_aliases: admin writes" on public.ingredient_aliases for all using (public.is_admin()) with check (public.is_admin());

alter table public.glasses enable row level security;
create policy "glasses: members read" on public.glasses for select using (public.is_member());
create policy "glasses: admin writes" on public.glasses for all using (public.is_admin()) with check (public.is_admin());

alter table public.taste_tags enable row level security;
create policy "taste_tags: members read" on public.taste_tags for select using (public.is_member());
create policy "taste_tags: admin writes" on public.taste_tags for all using (public.is_admin()) with check (public.is_admin());

alter table public.cocktail_families enable row level security;
create policy "cocktail_families: members read" on public.cocktail_families for select using (public.is_member());
create policy "cocktail_families: admin writes" on public.cocktail_families for all using (public.is_admin()) with check (public.is_admin());
