import { useEffect, useState } from "react"
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
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true }))
    Promise.all([
      fetchIngredientCategories(),
      fetchIngredientTypes(),
      fetchProducts(),
      fetchGlasses(),
      fetchTasteTags(),
      fetchCocktailFamilies(),
    ]).then(([categories, types, products, glasses, tasteTags, families]) => {
      if (active) setState({ loading: false, categories, types, products, glasses, tasteTags, families })
    })
    return () => {
      active = false
    }
  }, [refreshToken])

  return { ...state, refetch: () => setRefreshToken((t) => t + 1) }
}
