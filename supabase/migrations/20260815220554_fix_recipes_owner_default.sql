-- createRecipe() in src/services/recipes.js never set owner_id, so every
-- member-created recipe hit recipes_user_recipes_have_owner (owner_id came
-- through NULL). Same fix as products.created_by in step 5: default to
-- auth.uid() so the client doesn't have to set it, and the RLS insert
-- policy's `owner_id = (select auth.uid())` check is satisfied automatically.

alter table public.recipes alter column owner_id set default auth.uid();
