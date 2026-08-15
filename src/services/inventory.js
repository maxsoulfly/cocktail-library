import { supabase } from "@/lib/supabaseClient"

export async function fetchInventory(userId) {
  const { data, error } = await supabase
    .from("user_inventory")
    .select("id, ingredient_type_id, product_id")
    .eq("user_id", userId)
  if (error) throw error
  return data
}

export async function addIngredientTypeOwnership(userId, ingredientTypeId) {
  const { error } = await supabase
    .from("user_inventory")
    .insert({ user_id: userId, ingredient_type_id: ingredientTypeId })
  if (error) throw error
}

export async function removeIngredientTypeOwnership(userId, ingredientTypeId) {
  const { error } = await supabase
    .from("user_inventory")
    .delete()
    .eq("user_id", userId)
    .eq("ingredient_type_id", ingredientTypeId)
  if (error) throw error
}

export async function addProductOwnership(userId, productId) {
  const { error } = await supabase
    .from("user_inventory")
    .insert({ user_id: userId, product_id: productId })
  if (error) throw error
}
