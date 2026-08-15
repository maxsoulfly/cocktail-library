import { supabase } from "@/lib/supabaseClient"

export async function fetchFavorites(userId) {
  const { data, error } = await supabase.from("user_favorites").select("recipe_id").eq("user_id", userId)
  if (error) throw error
  return data
}

export async function addFavorite(userId, recipeId) {
  const { error } = await supabase.from("user_favorites").insert({ user_id: userId, recipe_id: recipeId })
  if (error) throw error
}

export async function removeFavorite(userId, recipeId) {
  const { error } = await supabase.from("user_favorites").delete().eq("user_id", userId).eq("recipe_id", recipeId)
  if (error) throw error
}

export async function fetchWantToMake(userId) {
  const { data, error } = await supabase.from("user_want_to_make").select("recipe_id").eq("user_id", userId)
  if (error) throw error
  return data
}

export async function addWantToMake(userId, recipeId) {
  const { error } = await supabase.from("user_want_to_make").insert({ user_id: userId, recipe_id: recipeId })
  if (error) throw error
}

export async function removeWantToMake(userId, recipeId) {
  const { error } = await supabase.from("user_want_to_make").delete().eq("user_id", userId).eq("recipe_id", recipeId)
  if (error) throw error
}
