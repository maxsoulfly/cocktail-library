import { useCallback, useEffect, useState } from "react"
import {
  addIngredientTypeOwnership,
  addProductOwnership,
  fetchInventory,
  removeIngredientTypeOwnership,
} from "@/services/inventory"

export function useInventory(userId) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!userId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchInventory(userId).then((data) => {
      setRows(data)
      setLoading(false)
    })
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const ownedTypeIds = new Set(rows.filter((r) => r.ingredient_type_id).map((r) => r.ingredient_type_id))
  const ownedProductIds = new Set(rows.filter((r) => r.product_id).map((r) => r.product_id))

  // Toggling only ever manages the *generic* ownership row. A type owned via
  // a product still displays as owned (see MyBarScreen's combined isOwned
  // check) but the toggle itself won't touch that product's ownership row -
  // there's no "unown a product" flow in this MVP.
  const toggleType = async (typeId) => {
    if (ownedTypeIds.has(typeId)) {
      await removeIngredientTypeOwnership(userId, typeId)
    } else {
      await addIngredientTypeOwnership(userId, typeId)
    }
    load()
  }

  const ownProduct = async (productId) => {
    await addProductOwnership(userId, productId)
    load()
  }

  return { loading, ownedTypeIds, ownedProductIds, toggleType, ownProduct, refetch: load }
}
