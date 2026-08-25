// Ranks Home's "Almost There" list (recipes missing exactly one required
// ingredient - see availability.js, `avail === "almost"` is only ever set
// at that exact count). That means every candidate here is already tied on
// "how close" by definition - there's no missing-ingredient-count left to
// sort by within this bucket, so real cross-user popularity (favoriteCount
// + wantToMakeCount, a denormalized counter - see
// 20260826110000_recipe_popularity_counters.sql) is the only signal that
// actually differentiates them. User request, framed like a save/like
// count rather than a live aggregate query.
//
// Returns the full ranked list, not pre-sliced - the caller (HomeScreen)
// owns how many to show and any "load more" reveal, this function only
// owns the order.

/**
 * @param {{ id: string, name: string, avail: string, favoriteCount?: number, wantToMakeCount?: number }[]} computed
 * @returns {object[]}
 */
export function rankAlmostThere(computed) {
  return computed
    .filter((c) => c.avail === "almost")
    .slice()
    .sort((a, b) => {
      const popularityA = (a.favoriteCount ?? 0) + (a.wantToMakeCount ?? 0)
      const popularityB = (b.favoriteCount ?? 0) + (b.wantToMakeCount ?? 0)
      if (popularityA !== popularityB) return popularityB - popularityA
      return a.name.localeCompare(b.name) // deterministic tiebreak
    })
}
