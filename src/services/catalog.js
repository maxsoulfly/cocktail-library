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

// Admin-only via the pre-existing "products: admin update" RLS policy - a
// product created by anyone (member's Add Product, or admin batch import)
// can be miscategorized (wrong ingredient type, a typo) with no way to fix
// it short of an admin recreating the row. No new grant needed - the policy
// already exists, just never had a caller.
export async function updateProduct(
  id,
  { name, ingredientTypeId, brand, isHomemade },
) {
  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      ingredient_type_id: ingredientTypeId,
      brand: brand || null,
      is_homemade: isHomemade,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Admin batch import - `rows` are already-validated resolved objects from
// src/schemas/productImport.js (snake_case, matching the table), not raw
// import JSON. Uses the same "products: member insert" RLS policy any
// member's single Add Product goes through (created_by defaults to
// auth.uid() at the column level) - no new grant needed, and no per-row
// children to insert, so a single bulk insert is enough (unlike recipes).
export async function createProducts(rows) {
  const { error } = await supabase.from("products").insert(rows)
  if (error) throw error
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
