// Same idea as src/domain/ingredientResolution.js, applied to glasses -
// resolves a typed/imported glass name to a real glass via its canonical
// name first, then a controlled alias. Exact match only, case-insensitive -
// an alias is an explicit admin/moderator-curated equivalence (e.g. "Rocks
// Glass" -> the catalog's "Lowball Glass"), not name-similarity guessing.
// Used by both recipe batch import and paste-a-recipe, so they can't drift
// onto different glass-resolution rules from each other.

/**
 * @param {string} name
 * @param {{ glasses: {id: string, name: string}[], aliases?: {alias: string, glass_id: string}[] }} catalog
 * @returns {{id: string, name: string} | null}
 */
export function resolveGlass(name, { glasses, aliases = [] }) {
  const trimmed = typeof name === "string" ? name.trim() : ""
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()

  const direct = glasses.find((g) => g.name.toLowerCase() === lower)
  if (direct) return direct

  const alias = aliases.find((a) => a.alias.toLowerCase() === lower)
  if (!alias) return null
  return glasses.find((g) => g.id === alias.glass_id) ?? null
}
