-- Widens both is_admin()-gated ingredient_requests policies. Both are
-- required, not just the update/resolve one: fetchPendingIngredientRequests()
-- does a blanket `status = 'pending'` read with no requested_by filter, so
-- widening only "admin resolves" would leave the Requests tab rendering
-- with a usable button but zero visible rows for a moderator.
--
-- "insert own"/"owner deletes while pending" have no admin branch and stay
-- untouched.

alter policy "ingredient_requests: read own or admin" on public.ingredient_requests
  using (requested_by = (select auth.uid()) or public.is_admin_or_moderator());

alter policy "ingredient_requests: admin resolves" on public.ingredient_requests
  using (public.is_admin_or_moderator()) with check (public.is_admin_or_moderator());
