import { useCallback, useEffect, useState } from "react"
import { fetchRecipes } from "@/services/recipes"

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchRecipes().then((data) => {
      setRecipes(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { recipes, loading, refetch: load }
}
