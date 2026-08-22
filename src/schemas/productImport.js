// Pure, framework-free validation for product batch import (spec §12), same
// shape as src/schemas/ingredientImport.js and recipeImport.js. A product
// always resolves to an EXISTING ingredient_types.name (exact match, no
// fuzzy matching) - batch import can add products in bulk, but never a new
// ingredient type, same rule the member-facing Add Product screen enforces
// one at a time.

/**
 * @param {unknown[]} rawItems - parsed JSON array, not yet validated
 * @param {{
 *   types: {id: string, name: string}[],
 *   existingProducts?: {name: string, ingredient_type_id: string}[],
 * }} catalog
 */
export function validateProductImport(
  rawItems,
  { types, existingProducts = [] },
) {
  const typeByName = new Map(types.map((t) => [t.name.toLowerCase(), t]))
  const existingKeys = new Set(
    existingProducts.map(
      (p) => `${p.name.toLowerCase()}|${p.ingredient_type_id}`,
    ),
  )
  const seenKeys = new Set()

  const results = rawItems.map((item, index) => {
    const errors = []
    const raw = item && typeof item === "object" ? item : {}

    const name = typeof raw.name === "string" ? raw.name.trim() : ""
    if (!name) errors.push("Missing name")

    const typeName =
      typeof raw.ingredientType === "string" ? raw.ingredientType.trim() : ""
    const type = typeByName.get(typeName.toLowerCase())
    if (!typeName) errors.push("Missing ingredientType")
    else if (!type) errors.push(`Unknown ingredientType "${typeName}"`)

    if (name && type) {
      const key = `${name.toLowerCase()}|${type.id}`
      if (existingKeys.has(key))
        errors.push(`"${name}" already exists under ${type.name}`)
      else if (seenKeys.has(key))
        errors.push(
          `Duplicate "${name}" under ${type.name} earlier in this import`,
        )
      seenKeys.add(key)
    }

    const brand = typeof raw.brand === "string" ? raw.brand.trim() : ""
    const isHomemade = raw.isHomemade === true

    const valid = errors.length === 0
    return {
      index,
      name: name || undefined,
      errors,
      valid,
      resolved: valid
        ? {
            name,
            ingredient_type_id: type.id,
            brand: brand || null,
            is_homemade: isHomemade,
          }
        : null,
    }
  })

  return {
    results,
    validCount: results.filter((r) => r.valid).length,
    errorCount: results.filter((r) => !r.valid).length,
  }
}

/**
 * Builds a copy-paste prompt for formatting new products with an AI
 * assistant, generated from the live catalog so it can never drift from
 * what validateProductImport() actually accepts.
 */
export function buildProductImportPrompt({ types }) {
  const typeNames = types.map((t) => t.name).sort()

  return `Format a JSON array of cocktail products (specific branded or homemade items) for import into Cocktail Library.

Return ONLY a JSON array (no markdown fences, no commentary) where each item has:
- "name": string, required. The specific product/brand name (e.g. "Tanqueray", "Bulleit Bourbon", "Homemade Grenadine") - not a general ingredient category.
- "ingredientType": string, required. Must be exactly one of the existing ingredient types below - the generic ingredient this product represents.
- "brand": string, optional, if meaningfully different from the name.
- "isHomemade": boolean, optional, defaults to false.

Never invent a new ingredient type - only use the exact names listed below. If a product's ingredient doesn't exist yet in the list, leave that product out rather than guessing the closest existing match.

Existing ingredient types (use EXACTLY these names):
${typeNames.join(", ") || "(none yet)"}

Here is what I want to add:
`
}
