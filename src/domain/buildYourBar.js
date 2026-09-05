// Pure, framework-free resolution for the homepage "Build your bar"
// essentials list (src/data/buildYourBarEssentials.js) against the live
// catalog. Deliberately NOT the same as resolveIngredientType()
// (domain/ingredientResolution.js) - that function exists to resolve
// arbitrary free-text/imported names, including through admin-curated
// aliases, because the input there is genuinely unknown at build time. The
// names here are our own hardcoded canonical names, individually verified
// against the catalog at design time - matching them through an alias
// would risk silently resolving to the WRONG type if an alias string ever
// happened to collide with one of these names, so this resolves against
// ingredient_types.name only, exact match, case-insensitive.
//
// ingredient_types.name has a real database unique constraint, but it's
// case-sensitive at the Postgres level ("Gin" and "gin" could both exist as
// distinct rows) while this resolver's matching is case-insensitive for
// the same reason resolveIngredientType()'s is - so a case-insensitive
// collision isn't structurally impossible even though it's never happened
// in this catalog. Missing (renamed/deleted since this list was written)
// and ambiguous (two types matching) are both reported explicitly rather
// than the caller silently getting an arbitrary pick or a crash - a status
// per name, not a bare nullable value, so a future catalog edit that
// breaks one of these names surfaces as a clear, debuggable result instead
// of a wrong tile.

/**
 * @param {string[]} names - canonical ingredient_type names to resolve, in
 *   order
 * @param {{ id: string, name: string }[]} types - the live catalog
 * @returns {({ status: "resolved", name: string, type: object }
 *   | { status: "missing", name: string }
 *   | { status: "ambiguous", name: string, candidates: object[] })[]}
 *   one result per input name, same order
 */
export function resolveEssentialsList(names, types) {
  return names.map((name) => {
    const lower = name.toLowerCase()
    const matches = types.filter((t) => t.name.toLowerCase() === lower)
    if (matches.length === 0) return { status: "missing", name }
    if (matches.length > 1)
      return { status: "ambiguous", name, candidates: matches }
    return { status: "resolved", name, type: matches[0] }
  })
}
