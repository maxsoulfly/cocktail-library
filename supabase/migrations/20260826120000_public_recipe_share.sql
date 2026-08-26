-- Public, no-login "share this recipe" link (user request: a plain-HTML
-- read-only page anyone can view via a URL, no download, no editing). Scope
-- deliberately limited to classic + community recipes - anything already
-- visible to every member, per the user's own choice over sharing private
-- recipes too (a separate, bigger feature for later if ever wanted). This
-- reuses the exact "shared + active" definition the real "recipes: read"
-- RLS policy (20260823110000) already uses for member visibility - a
-- private recipe is never reachable through this function, full stop.
--
-- A SECURITY DEFINER function, not a new RLS policy, because there is no
-- authenticated/anon-readable path into recipes/recipe_components/
-- recipe_taste_tags/glasses/cocktail_families/profiles today - this app has
-- always been fully gated. Opening real RLS SELECT policies to `anon` would
-- expose all of those tables broadly; a single narrow function returning
-- only the fields a public recipe page actually needs is the same pattern
-- already used for redeem_invitation() and the admin merge/moderation
-- functions elsewhere in this schema.
create or replace function public.get_shared_recipe(p_recipe_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'description', r.description,
    'steps', r.steps,
    'liquidColor', r.liquid_color,
    'liquidColor2', r.liquid_color_2,
    'glass', g.name,
    'glassShape', g.shape,
    'family', f.name,
    'author', coalesce(owner.display_name, orig.display_name),
    'taste', (
      select coalesce(jsonb_agg(tt.name order by tt.name), '[]'::jsonb)
      from public.recipe_taste_tags rtt
      join public.taste_tags tt on tt.id = rtt.taste_tag_id
      where rtt.recipe_id = r.id
    ),
    'ings', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'name', it.name,
            'amount', rc.amount,
            'unitLabel', rc.unit_label,
            'role', rc.role
          )
          order by rc.sort_order
        ),
        '[]'::jsonb
      )
      from public.recipe_components rc
      join public.ingredient_types it on it.id = rc.ingredient_type_id
      where rc.recipe_id = r.id
    )
  )
  from public.recipes r
  left join public.glasses g on g.id = r.glass_id
  left join public.cocktail_families f on f.id = r.family_id
  left join public.profiles owner on owner.id = r.owner_id
  left join public.profiles orig on orig.id = r.original_owner_id
  where r.id = p_recipe_id
    and r.visibility = 'shared'
    and r.moderation_status = 'active';
$$;

revoke execute on function public.get_shared_recipe(uuid) from public, anon, authenticated;
grant execute on function public.get_shared_recipe(uuid) to anon, authenticated;
