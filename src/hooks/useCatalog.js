import { useCallback, useEffect, useState } from "react"
import {
  fetchCocktailFamilies,
  fetchGlasses,
  fetchIngredientCategories,
  fetchIngredientTypes,
  fetchProducts,
  fetchTasteTags,
} from "@/services/catalog"

export function useCatalog() {
  const [state, setState] = useState({
    loading: true,
    categories: [],
    types: [],
    products: [],
    glasses: [],
    tasteTags: [],
    families: [],
  })

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }))
    return Promise.all([
      fetchIngredientCategories(),
      fetchIngredientTypes(),
      fetchProducts(),
      fetchGlasses(),
      fetchTasteTags(),
      fetchCocktailFamilies(),
    ]).then(([categories, types, products, glasses, tasteTags, families]) => {
      const next = { loading: false, categories, types, products, glasses, tasteTags, families }
      setState(next)
      return next
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refetch: load }
}
