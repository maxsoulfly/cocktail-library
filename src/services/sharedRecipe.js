import { supabase } from "@/lib/supabaseClient"

// Calls the get_shared_recipe() SECURITY DEFINER function (see the
// 20260826120000 migration) - the only path into recipe data that doesn't
// require a session at all. Returns null for anything not classic/community
// (private, revoked, or a nonexistent id) - the caller shows one generic
// "not available" state rather than distinguishing why, so a bad guess at a
// private recipe's id can't be used to confirm it exists.
export async function fetchSharedRecipe(id) {
  const { data, error } = await supabase.rpc("get_shared_recipe", {
    p_recipe_id: id,
  })
  if (error) throw error
  return data
}
