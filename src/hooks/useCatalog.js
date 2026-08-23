import { useCallback, useEffect, useState } from "react"
import {
  fetchCocktailFamilies,
  fetchGlasses,
  fetchIngredientAliases,
  fetchIngredientCategories,
  fetchIngredientTypes,
  fetchLiquidColors,
  fetchProducts,
  fetchTasteTags,
} from "@/services/catalog"

export function useCatalog() {
  const [state, setState] = useState({
    loading: true,
    categories: [],
    types: [],
    aliases: [],
    products: [],
    glasses: [],
    tasteTags: [],
    families: [],
    liquidColors: [],
  })

  // Deliberately doesn't re-set loading:true on refetch - same reasoning as
  // useRecipes.js: AppShell unmounts the whole Outlet while catalog.loading
  // is true, so every refetch (already triggered today by AddProductScreen
  // after adding a product) would flash the entire app blank and back.
  const load = useCallback(() => {
    return Promise.all([
      fetchIngredientCategories(),
      fetchIngredientTypes(),
      fetchIngredientAliases(),
      fetchProducts(),
      fetchGlasses(),
      fetchTasteTags(),
      fetchCocktailFamilies(),
      fetchLiquidColors(),
    ]).then(
      ([
        categories,
        types,
        aliases,
        products,
        glasses,
        tasteTags,
        families,
        liquidColors,
      ]) => {
        const next = {
          loading: false,
          categories,
          types,
          aliases,
          products,
          glasses,
          tasteTags,
          families,
          liquidColors,
        }
        setState(next)
        return next
      },
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refetch: load }
}
