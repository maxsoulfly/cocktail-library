import { useCallback, useEffect, useState } from "react"
import { fetchRecipes } from "@/services/recipes"

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  // Deliberately doesn't re-set loading:true on refetch - AppShell unmounts
  // the whole Outlet (and shows a bare loading screen) while `recipesLoading`
  // is true, so every publish/unpublish/create/edit would otherwise flash
  // the entire app to a blank screen and back. Same class of bug already
  // fixed for My Bar toggles in useInventory.js/useLists.js (there via
  // optimistic updates); here the simpler fix is just never re-entering the
  // blocking state after the first load, since stale-then-fresh data is a
  // much better experience than an unmount/remount flash.
  const load = useCallback(() => {
    return fetchRecipes().then((data) => {
      setRecipes(data)
      setLoading(false)
      return data
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { recipes, loading, refetch: load }
}
