import { useEffect, useState } from "react"
import { fetchIngredientCategories, fetchIngredientTypes, fetchProducts } from "@/services/catalog"

export function useCatalog() {
  const [state, setState] = useState({ loading: true, categories: [], types: [], products: [] })
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true }))
    Promise.all([fetchIngredientCategories(), fetchIngredientTypes(), fetchProducts()]).then(
      ([categories, types, products]) => {
        if (active) setState({ loading: false, categories, types, products })
      },
    )
    return () => {
      active = false
    }
  }, [refreshToken])

  return { ...state, refetch: () => setRefreshToken((t) => t + 1) }
}
