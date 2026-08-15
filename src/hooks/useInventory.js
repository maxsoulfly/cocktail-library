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
      return Promise.resolve([])
    }
    setLoading(true)
    return fetchInventory(userId).then((data) => {
      setRows(data)
      setLoading(false)
      return data
    })
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const ownedTypeIds = new Set(rows.filter((r) => r.ingredient_type_id).map((r) => r.ingredient_type_id))
  const ownedProductIds = new Set(rows.filter((r) => r.product_id).map((r) => r.product_id))

  // Optimistic: update local state immediately so the toggle feels instant,
  // fire the write in the background, and only pay the network round-trip
  // (via a full reload) if it actually fails. Toggling only ever manages the
  // *generic* ownership row - a type owned via a product still displays as
  // owned (see MyBarScreen's combined isOwned check) but the toggle itself
  // won't touch that product's ownership row - there's no "unown a product"
  // flow in this MVP.
  const toggleType = async (typeId) => {
    const wasOwned = ownedTypeIds.has(typeId)
    setRows((prev) =>
      wasOwned
        ? prev.filter((r) => r.ingredient_type_id !== typeId)
        : [...prev, { id: `optimistic-${typeId}`, ingredient_type_id: typeId, product_id: null }],
    )
    try {
      if (wasOwned) {
        await removeIngredientTypeOwnership(userId, typeId)
      } else {
        await addIngredientTypeOwnership(userId, typeId)
      }
    } catch (err) {
      load() // roll back to real state on failure
      throw err
    }
  }

  const ownProduct = async (productId) => {
    setRows((prev) => [...prev, { id: `optimistic-${productId}`, ingredient_type_id: null, product_id: productId }])
    try {
      await addProductOwnership(userId, productId)
    } catch (err) {
      load()
      throw err
    }
  }

  return { loading, ownedTypeIds, ownedProductIds, toggleType, ownProduct, refetch: load }
}
