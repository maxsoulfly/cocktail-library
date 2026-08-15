// Pure, framework-free purchase-recommendation ranking (spec §11). Candidates
// are ingredient types that would unlock a recipe currently missing exactly
// one required ingredient ("almost"). Ranked by readable rules, in the
// spec's exact order - not an opaque weighted score, per the spec's explicit
// instruction to add numeric weighting only if real usage ever shows it's
// needed.

/**
 * @param {{
 *   computed: { id: string, name: string, source: string, avail: string, missingRequiredIds: string[], missingOptionalIds?: string[] }[],
 *   ingredientTypesById: Map<string, { name: string, bar_priority?: string, recommend_by_default?: boolean }>,
 *   favoriteIds: Set<string>,
 *   wantToMakeIds: Set<string>,
 *   limit?: number,
 * }} args
 */
export function rankPurchaseRecommendations({
  computed,
  ingredientTypesById,
  favoriteIds,
  wantToMakeIds,
  limit,
}) {
  const candidates = new Map()
  const getCandidate = (ingId) => {
    if (!candidates.has(ingId))
      candidates.set(ingId, { unlockedRecipes: [], upgradedRecipes: [] })
    return candidates.get(ingId)
  }

  // Primary candidate source: recipes missing exactly one required ingredient.
  computed.forEach((recipe) => {
    if (recipe.avail === "almost" && recipe.missingRequiredIds.length === 1) {
      getCandidate(recipe.missingRequiredIds[0]).unlockedRecipes.push(recipe)
    }
  })

  // Secondary signal (ranking rule 5): the same ingredient might also be a
  // missing optional/garnish on an already-good-enough recipe, upgrading it
  // to perfect too.
  if (candidates.size > 0) {
    computed.forEach((recipe) => {
      if (recipe.avail !== "good") return
      ;(recipe.missingOptionalIds ?? []).forEach((ingId) => {
        if (candidates.has(ingId))
          getCandidate(ingId).upgradedRecipes.push(recipe)
      })
    })
  }

  const scored = [...candidates.entries()].map(
    ([ingredientTypeId, { unlockedRecipes, upgradedRecipes }]) => {
      const type = ingredientTypesById.get(ingredientTypeId)
      const priority = type?.bar_priority ?? "common"
      const recommendByDefault = type?.recommend_by_default ?? true
      const isNicheOrSpecialized =
        priority === "niche" || priority === "specialized"
      const unlocksFavoriteOrWantToMake = unlockedRecipes.some(
        (r) => favoriteIds.has(r.id) || wantToMakeIds.has(r.id),
      )
      const classicsUnlocked = unlockedRecipes.filter(
        (r) => r.source === "classic",
      )
      const unlocksClassic = classicsUnlocked.length > 0
      const isEssentialOrCommon =
        (priority === "essential" || priority === "common") &&
        recommendByDefault

      const reason = unlocksFavoriteOrWantToMake
        ? "Unlocks a recipe you've favorited or want to make"
        : unlocksClassic
          ? `Unlocks ${classicsUnlocked.length} classic${
              classicsUnlocked.length === 1 ? "" : "s"
            }`
          : `Unlocks ${unlockedRecipes.length} ${
              unlockedRecipes.length === 1 ? "recipe" : "recipes"
            }`

      return {
        ingredientTypeId,
        name: type?.name ?? ingredientTypeId,
        reason,
        unlockedRecipeNames: unlockedRecipes.map((r) => r.name),
        unlockCount: unlockedRecipes.length,
        upgradeCount: upgradedRecipes.length,
        unlocksFavoriteOrWantToMake,
        unlocksClassic,
        isEssentialOrCommon,
        // Suppressed from *general* suggestions per spec §11, unless it
        // completes a Favorite/Want to Make recipe. This function only ever
        // produces the general list - a specific cocktail's own missing-item
        // display (DetailScreen) is a separate, unfiltered path.
        suppressed: isNicheOrSpecialized && !unlocksFavoriteOrWantToMake,
      }
    },
  )

  const ranked = scored
    .filter((c) => !c.suppressed)
    .sort((a, b) => {
      if (a.unlocksFavoriteOrWantToMake !== b.unlocksFavoriteOrWantToMake)
        return a.unlocksFavoriteOrWantToMake ? -1 : 1
      if (a.unlocksClassic !== b.unlocksClassic)
        return a.unlocksClassic ? -1 : 1
      if (a.isEssentialOrCommon !== b.isEssentialOrCommon)
        return a.isEssentialOrCommon ? -1 : 1
      if (a.unlockCount !== b.unlockCount) return b.unlockCount - a.unlockCount
      if (a.upgradeCount !== b.upgradeCount)
        return b.upgradeCount - a.upgradeCount
      return a.name.localeCompare(b.name) // deterministic tiebreak
    })

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked
}
