// Pure, framework-free availability matching. No React, no Supabase — takes plain
// data in, returns plain data out, so it can be unit tested in isolation and reused
// once recipe/ingredient data comes from Supabase instead of src/data/mockData.js.

/**
 * @param {{ ings: { ingId: string, role: 'required'|'optional'|'garnish', alternativeIds?: string[] }[] }} cocktail
 * @param {Set<string>} owned - satisfied ingredient type ids; build with resolveOwnedIngredientTypes()
 *   so product-mapping and parent/child hierarchy are already accounted for before this runs.
 * @param {(id: string) => string} [resolveIngredientName] - id -> display name; defaults to the id itself
 */
export function computeAvail(cocktail, owned, resolveIngredientName) {
  const resolveName = resolveIngredientName ?? ((id) => id)

  // Satisfied directly, or via any substitution alternative ("one allowed
  // item from its substitution group" - the spec never requires *which*
  // alternative, just that one is owned).
  const isSatisfied = (component) => owned.has(component.ingId) || (component.alternativeIds ?? []).some((id) => owned.has(id))

  const missingRequiredIds = cocktail.ings
    .filter((i) => i.role === "required" && !isSatisfied(i))
    .map((i) => i.ingId)
  const missingRequired = missingRequiredIds.map(resolveName)
  const missingOptionalIds = cocktail.ings
    .filter((i) => i.role !== "required" && !isSatisfied(i))
    .map((i) => i.ingId)
  const missingOptional = missingOptionalIds.map(resolveName)

  let avail
  if (missingRequired.length === 0 && missingOptional.length === 0) avail = "perfect"
  else if (missingRequired.length === 0) avail = "good"
  else if (missingRequired.length === 1) avail = "almost"
  else avail = "unavail"

  return { avail, missingRequired, missingOptional, missingRequiredIds, missingOptionalIds }
}

export function mlToOz(ml) {
  const oz = ml / 29.5735
  if (oz < 0.3) return "¼ oz"
  if (Math.abs(oz - 0.5) < 0.1) return "½ oz"
  if (Math.abs(oz - 0.75) < 0.1) return "¾ oz"
  if (Math.abs(oz - 1) < 0.1) return "1 oz"
  if (Math.abs(oz - 1.5) < 0.1) return "1½ oz"
  if (Math.abs(oz - 2) < 0.1) return "2 oz"
  if (Math.abs(oz - 3) < 0.1) return "3 oz"
  return `${oz.toFixed(1)} oz`
}

/**
 * @param {{ amount: number, unitLabel: string }} recipeIng
 * @param {'ml'|'oz'} unit
 */
export function formatAmount(recipeIng, unit) {
  if (recipeIng.amount === 0) return recipeIng.unitLabel
  if (unit === "oz") return mlToOz(recipeIng.amount)
  return `${recipeIng.amount}${recipeIng.unitLabel}`
}

/**
 * Expands raw ownership into the full set of ingredient type ids a user's
 * bar satisfies, per the spec's component-satisfaction rules (§10.1):
 * owning a product satisfies its mapped generic type, and owning a more
 * specific child type satisfies any of its ancestor types ("a compatible
 * explicit child type"). Do this expansion once, up front, so computeAvail()
 * itself can stay a plain Set membership check.
 *
 * @param {{
 *   ownedTypeIds: Set<string>,
 *   ownedProductIds: Set<string>,
 *   products: { id: string, ingredient_type_id: string }[],
 *   ingredientTypes: { id: string, parent_type_id: string|null }[],
 * }} args
 * @returns {Set<string>}
 */
export function resolveOwnedIngredientTypes({ ownedTypeIds, ownedProductIds, products, ingredientTypes }) {
  const typesById = new Map(ingredientTypes.map((t) => [t.id, t]))

  const direct = new Set(ownedTypeIds)
  products.forEach((p) => {
    if (ownedProductIds.has(p.id)) direct.add(p.ingredient_type_id)
  })

  const expanded = new Set(direct)
  direct.forEach((id) => {
    let current = typesById.get(id)
    while (current?.parent_type_id) {
      expanded.add(current.parent_type_id)
      current = typesById.get(current.parent_type_id)
    }
  })
  return expanded
}
