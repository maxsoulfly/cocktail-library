import { supabase } from "@/lib/supabaseClient"

// "Community" vs "private" is derived, not stored - see recipes table comment
// in the migration. Matches the source values SourceBadge already expects.
function deriveSource(recipe) {
  if (recipe.source_type === "classic") return "classic"
  if (recipe.visibility === "shared" && recipe.moderation_status === "active")
    return "community"
  return "private"
}

// Shapes a Supabase row into exactly what src/domain/availability.js and the
// screens already expect from the old mock COCKTAILS array (ings[].ingId/
// amount/unitLabel/role, taste[], etc.) so screen components don't need to
// change just because the data source did.
function mapRecipe(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    source: deriveSource(row),
    ownerId: row.owner_id,
    author: row.owner?.display_name ?? undefined,
    glass: row.glass?.name ?? "rocks",
    family: row.family?.name,
    liquidColor: row.liquid_color ?? "#22d3ee",
    steps: row.steps ?? [],
    taste: (row.recipe_taste_tags ?? [])
      .map((t) => t.taste_tags?.name)
      .filter(Boolean),
    ings: (row.recipe_components ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        ingId: c.ingredient_type_id,
        alternativeIds: (c.recipe_component_alternatives ?? []).map(
          (a) => a.ingredient_type_id,
        ),
        // numeric columns come back as strings over PostgREST
        amount: Number(c.amount),
        unitLabel: c.unit_label,
        role: c.role,
        name: c.ingredient_types?.name,
      })),
  }
}

const RECIPE_SELECT = `
  id, name, description, source_type, visibility, moderation_status, owner_id, liquid_color, steps,
  glass:glasses(name),
  family:cocktail_families(name),
  owner:profiles(display_name),
  recipe_components(id, ingredient_type_id, amount, unit_label, role, sort_order, ingredient_types(name, color), recipe_component_alternatives(ingredient_type_id)),
  recipe_taste_tags(taste_tags(name))
`

export async function fetchRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .order("name")
  if (error) throw error
  return data.map(mapRecipe)
}

export async function fetchRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .eq("id", id)
    .single()
  if (error) throw error
  return mapRecipe(data)
}

// Always creates a private user recipe - publishing is a separate action
// (publishRecipe(), below). Components/tags are inserted after the recipe
// row in separate calls (no client-side multi-statement transaction
// available); best-effort cleanup deletes the recipe again if a later step
// fails.
export async function createRecipe({
  name,
  description,
  glassId,
  familyId,
  liquidColor,
  steps,
  components,
  tasteTagIds,
}) {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      name,
      description: description || null,
      source_type: "user",
      visibility: "private",
      glass_id: glassId,
      family_id: familyId || null,
      liquid_color: liquidColor || null,
      steps,
    })
    .select()
    .single()
  if (recipeError) throw recipeError

  try {
    if (components.length > 0) {
      const { error: componentsError } = await supabase
        .from("recipe_components")
        .insert(
          components.map((c, index) => ({
            recipe_id: recipe.id,
            ingredient_type_id: c.ingredientTypeId,
            amount: c.amount,
            unit_label: c.unitLabel,
            role: c.role,
            sort_order: index,
          })),
        )
      if (componentsError) throw componentsError
    }

    if (tasteTagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from("recipe_taste_tags")
        .insert(
          tasteTagIds.map((tagId) => ({
            recipe_id: recipe.id,
            taste_tag_id: tagId,
          })),
        )
      if (tagsError) throw tagsError
    }
  } catch (err) {
    await supabase.from("recipes").delete().eq("id", recipe.id)
    throw err
  }

  return fetchRecipe(recipe.id)
}

// Spec §4: owners can edit their own recipe (private or published), and
// admins can edit the classic catalog (owner_id null) - enforced server-side
// by recipe_is_editable() and the recipes/recipe_components/
// recipe_taste_tags RLS policies, not just this client check. No
// client-side multi-statement transaction is available, so a failure partway
// through leaves a partial update rather than rolling back - same
// constraint createRecipe() already lives with.
export async function updateRecipe(
  id,
  {
    name,
    description,
    glassId,
    familyId,
    liquidColor,
    steps,
    components,
    tasteTagIds,
  },
) {
  const { error: recipeError } = await supabase
    .from("recipes")
    .update({
      name,
      description: description || null,
      glass_id: glassId,
      family_id: familyId || null,
      liquid_color: liquidColor || null,
      steps,
    })
    .eq("id", id)
  if (recipeError) throw recipeError

  const { error: delCompError } = await supabase
    .from("recipe_components")
    .delete()
    .eq("recipe_id", id)
  if (delCompError) throw delCompError
  if (components.length > 0) {
    const { error: compError } = await supabase
      .from("recipe_components")
      .insert(
        components.map((c, index) => ({
          recipe_id: id,
          ingredient_type_id: c.ingredientTypeId,
          amount: c.amount,
          unit_label: c.unitLabel,
          role: c.role,
          sort_order: index,
        })),
      )
    if (compError) throw compError
  }

  const { error: delTagError } = await supabase
    .from("recipe_taste_tags")
    .delete()
    .eq("recipe_id", id)
  if (delTagError) throw delTagError
  if (tasteTagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("recipe_taste_tags")
      .insert(
        tasteTagIds.map((tagId) => ({ recipe_id: id, taste_tag_id: tagId })),
      )
    if (tagError) throw tagError
  }

  return fetchRecipe(id)
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from("recipes").delete().eq("id", id)
  if (error) throw error
}

// Both go through SECURITY DEFINER functions - visibility/moderation_status
// are deliberately excluded from the general recipes UPDATE grant (step 6),
// so a direct .update({visibility: 'shared'}) call would fail regardless.
export async function publishRecipe(id) {
  const { error } = await supabase.rpc("publish_recipe", { p_recipe_id: id })
  if (error) throw error
}

export async function unpublishRecipe(id) {
  const { error } = await supabase.rpc("unpublish_recipe", { p_recipe_id: id })
  if (error) throw error
}

// Admin moderation tab: currently-shared community recipes only - there's no
// pre-publish review queue (publishing is immediate per the spec), just
// after-the-fact unpublishing.
export async function fetchCommunityRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, published_at, owner:profiles(display_name)")
    .eq("source_type", "user")
    .eq("visibility", "shared")
    .eq("moderation_status", "active")
    .order("published_at", { ascending: false })
  if (error) throw error
  return data
}
