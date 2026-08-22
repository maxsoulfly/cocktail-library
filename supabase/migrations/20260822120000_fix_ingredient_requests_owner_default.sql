-- createIngredientRequest() in src/services/ingredientRequests.js never set
-- requested_by, so every submission hit the "insert own" RLS policy's
-- `requested_by = auth.uid()` check with requested_by coming through NULL -
-- same class of bug already fixed for recipes.owner_id in
-- 20260815220554_fix_recipes_owner_default.sql. Default to auth.uid() so the
-- client doesn't have to set it, matching that precedent and
-- products.created_by.

alter table public.ingredient_requests alter column requested_by set default auth.uid();
