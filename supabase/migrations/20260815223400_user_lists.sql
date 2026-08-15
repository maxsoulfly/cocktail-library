-- Favorites and Want to Make: private per-user lists (spec §7.6). Composite
-- primary key on (user_id, recipe_id) does double duty as the natural key
-- and the "can't favorite the same recipe twice" constraint - no separate
-- id/unique constraint needed, unlike user_inventory's polymorphic shape.

create table public.user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table public.user_want_to_make (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Strictly private, no admin override - same as user_inventory.

alter table public.user_favorites enable row level security;

create policy "user_favorites: read own" on public.user_favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_favorites: insert own" on public.user_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_favorites: delete own" on public.user_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

alter table public.user_want_to_make enable row level security;

create policy "user_want_to_make: read own" on public.user_want_to_make
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_want_to_make: insert own" on public.user_want_to_make
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_want_to_make: delete own" on public.user_want_to_make
  for delete to authenticated using (user_id = (select auth.uid()));
