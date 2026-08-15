-- products: branded/homemade items mapped to an existing ingredient type -
-- a shared, searchable catalog (any member reads all products), not private.
-- Members can add products but never new ingredient types (enforced simply
-- by ingredient_type_id being a required FK with no member-writable path to
-- ingredient_types itself).
--
-- user_inventory: private per-user ownership records, presence only. Exactly
-- one of ingredient_type_id (generic ownership) or product_id (a specific
-- product) is set per row - owning a product satisfies its mapped generic
-- type, per the spec.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  ingredient_type_id uuid not null references public.ingredient_types (id),
  name text not null,
  brand text,
  is_homemade boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

comment on table public.products is 'Branded/homemade options mapped to an ingredient type. Shared catalog (member-read, member-insert), not private.';

create index products_ingredient_type_id_idx on public.products (ingredient_type_id);
create index products_created_by_idx on public.products (created_by);

create table public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_type_id uuid references public.ingredient_types (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_inventory_exactly_one_target check (
    (ingredient_type_id is not null and product_id is null) or
    (ingredient_type_id is null and product_id is not null)
  ),
  unique (user_id, ingredient_type_id),
  unique (user_id, product_id)
);

comment on table public.user_inventory is 'Private per-user ownership records (presence only - no quantity/expiry). Strictly private: no admin-read override, unlike profiles/memberships.';

create index user_inventory_user_id_idx on public.user_inventory (user_id);

-- ── RLS: products ────────────────────────────────────────────────────────────

alter table public.products enable row level security;

create policy "products: read" on public.products
  for select to authenticated using (public.is_member() or public.is_admin());

create policy "products: member insert" on public.products
  for insert to authenticated with check (
    (public.is_member() or public.is_admin())
    and created_by = (select auth.uid())
  );

create policy "products: admin update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products: admin delete" on public.products
  for delete to authenticated using (public.is_admin());

-- ── RLS: user_inventory (own rows only, no admin override) ──────────────────

alter table public.user_inventory enable row level security;

create policy "user_inventory: read own" on public.user_inventory
  for select to authenticated using (user_id = (select auth.uid()));

create policy "user_inventory: insert own" on public.user_inventory
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "user_inventory: delete own" on public.user_inventory
  for delete to authenticated using (user_id = (select auth.uid()));
