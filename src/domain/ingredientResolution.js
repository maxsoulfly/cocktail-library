// Single source of truth for resolving a typed/imported ingredient name to a
// real ingredient_type - checks the canonical name first, then controlled
// aliases (spec §12.3: "Resolve ingredient types through IDs, canonical
// names, or controlled aliases"). Exact match only, case-insensitive - an
// alias is an explicit admin-curated equivalence, not name-similarity
// guessing, so this never violates the no-fuzzy-matching rule. Used by every
// ingredient-name matching path in the app (batch import validators, Add
// Product, My Bar's product-type editor) so they can never drift onto
// different resolution rules from each other.

/**
 * @param {string} name
 * @param {{ types: {id: string, name: string}[], aliases?: {alias: string, ingredient_type_id: string}[] }} catalog
 * @returns {{id: string, name: string} | null}
 */
export function resolveIngredientType(name, { types, aliases = [] }) {
  const trimmed = typeof name === "string" ? name.trim() : ""
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()

  const direct = types.find((t) => t.name.toLowerCase() === lower)
  if (direct) return direct

  const alias = aliases.find((a) => a.alias.toLowerCase() === lower)
  if (!alias) return null
  return types.find((t) => t.id === alias.ingredient_type_id) ?? null
}
