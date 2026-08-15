// Pure, framework-free availability matching. No React, no Supabase — takes plain
// data in, returns plain data out, so it can be unit tested in isolation and reused
// once recipe/ingredient data comes from Supabase instead of src/data/mockData.js.

/**
 * @param {{ ings: { ingId: string, role: 'required'|'optional'|'garnish' }[] }} cocktail
 * @param {Set<string>} owned - ids the user owns (ingredient types and/or mapped products)
 * @param {(id: string) => string} [resolveIngredientName] - id -> display name; defaults to the id itself
 */
export function computeAvail(cocktail, owned, resolveIngredientName) {
  const resolveName = resolveIngredientName ?? ((id) => id)

  const missingRequiredIds = cocktail.ings
    .filter((i) => i.role === "required" && !owned.has(i.ingId))
    .map((i) => i.ingId)
  const missingRequired = missingRequiredIds.map(resolveName)
  const missingOptional = cocktail.ings
    .filter((i) => i.role !== "required" && !owned.has(i.ingId))
    .map((i) => resolveName(i.ingId))

  let avail
  if (missingRequired.length === 0 && missingOptional.length === 0) avail = "perfect"
  else if (missingRequired.length === 0) avail = "good"
  else if (missingRequired.length === 1) avail = "almost"
  else avail = "unavail"

  return { avail, missingRequired, missingOptional, missingRequiredIds }
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
