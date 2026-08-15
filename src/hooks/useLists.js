import { useCallback, useEffect, useState } from "react"
import {
  addFavorite,
  addWantToMake,
  fetchFavorites,
  fetchWantToMake,
  removeFavorite,
  removeWantToMake,
} from "@/services/lists"

// Same optimistic-update shape as useInventory.js: flip local state
// immediately, write in the background, roll back via a full reload only if
// the write actually fails.
export function useLists(userId) {
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [wantToMakeIds, setWantToMakeIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!userId) {
      setFavoriteIds(new Set())
      setWantToMakeIds(new Set())
      setLoading(false)
      return Promise.resolve()
    }
    setLoading(true)
    return Promise.all([fetchFavorites(userId), fetchWantToMake(userId)]).then(
      ([favs, wtm]) => {
        setFavoriteIds(new Set(favs.map((r) => r.recipe_id)))
        setWantToMakeIds(new Set(wtm.map((r) => r.recipe_id)))
        setLoading(false)
      },
    )
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const toggleFavorite = async (recipeId) => {
    const wasFav = favoriteIds.has(recipeId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (wasFav) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
    try {
      if (wasFav) await removeFavorite(userId, recipeId)
      else await addFavorite(userId, recipeId)
    } catch (err) {
      load()
      throw err
    }
  }

  const toggleWantToMake = async (recipeId) => {
    const was = wantToMakeIds.has(recipeId)
    setWantToMakeIds((prev) => {
      const next = new Set(prev)
      if (was) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
    try {
      if (was) await removeWantToMake(userId, recipeId)
      else await addWantToMake(userId, recipeId)
    } catch (err) {
      load()
      throw err
    }
  }

  return {
    loading,
    favoriteIds,
    wantToMakeIds,
    toggleFavorite,
    toggleWantToMake,
    refetch: load,
  }
}
