import { supabase } from "@/lib/supabaseClient"

export async function fetchIngredientCategories() {
  const { data, error } = await supabase.from("ingredient_categories").select("id, name").order("name")
  if (error) throw error
  return data
}

export async function fetchIngredientTypes() {
  const { data, error } = await supabase
    .from("ingredient_types")
    .select("id, category_id, name, color, bar_priority, recommend_by_default, description")
    .order("name")
  if (error) throw error
  return data
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, ingredient_type_id, name, brand, is_homemade, created_by")
    .order("name")
  if (error) throw error
  return data
}

export async function createProduct({ name, ingredientTypeId, brand, isHomemade }) {
  const { data, error } = await supabase
    .from("products")
    .insert({ name, ingredient_type_id: ingredientTypeId, brand: brand || null, is_homemade: isHomemade })
    .select()
    .single()
  if (error) throw error
  return data
}
