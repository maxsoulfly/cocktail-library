import { supabase } from "@/lib/supabaseClient"

export async function fetchIngredientCategories() {
  const { data, error } = await supabase
    .from("ingredient_categories")
    .select("id, name, sort_order")
    .order("sort_order")
    .order("name")
  if (error) throw error
  return data
}

export async function fetchIngredientTypes() {
  const { data, error } = await supabase
    .from("ingredient_types")
    .select(
      "id, category_id, parent_type_id, name, color, bar_priority, recommend_by_default, description",
    )
    .order("name")
  if (error) throw error
  return data
}

// Admin-only via ingredient_types' existing "admin writes" RLS policy - no
// new grant needed. `rows` are already-validated resolved objects from
// src/schemas/ingredientImport.js, not raw import JSON.
export async function createIngredientTypes(rows) {
  const { error } = await supabase.from("ingredient_types").insert(rows)
  if (error) throw error
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, ingredient_type_id, name, brand, is_homemade, created_by")
    .order("name")
  if (error) throw error
  return data
}

export async function createProduct({
  name,
  ingredientTypeId,
  brand,
  isHomemade,
}) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      ingredient_type_id: ingredientTypeId,
      brand: brand || null,
      is_homemade: isHomemade,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchGlasses() {
  const { data, error } = await supabase
    .from("glasses")
    .select("id, name")
    .order("name")
  if (error) throw error
  return data
}

export async function fetchTasteTags() {
  const { data, error } = await supabase
    .from("taste_tags")
    .select("id, name")
    .order("name")
  if (error) throw error
  return data
}

export async function fetchCocktailFamilies() {
  const { data, error } = await supabase
    .from("cocktail_families")
    .select("id, name")
    .order("name")
  if (error) throw error
  return data
}
