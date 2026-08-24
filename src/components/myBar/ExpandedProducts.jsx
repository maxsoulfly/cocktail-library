import { useState } from "react"
import { IconEdit, IconTrash } from "@/components/icons"
import {
  Btn,
  Card,
  ConfirmPanel,
  Input,
  OwnedToggle,
} from "@/components/primitives"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import { deleteProduct, updateProduct } from "@/services/catalog"

// The per-type "browse every catalog product, owned or not" panel - what
// shows when a type card's chevron is expanded. Admin-only product
// correction (edit/delete) state is fully local here since nothing outside
// this panel ever reads it.
export function ExpandedProducts({
  products,
  types,
  aliases,
  ownedProductIds,
  isAdmin,
  onToggleProduct,
  onProductsChanged,
  style,
}) {
  // Admin-only product correction - a miscategorized/typo'd product (from
  // Add Product or batch import) had no fix short of an admin deleting and
  // recreating it. One draft at a time, same pattern as Admin's inline
  // add-ingredient draft.
  const [editingProduct, setEditingProduct] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(false)

  const startEditProduct = (p) => {
    setEditError(null)
    setEditingProduct({
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      // Text, not an id - see the ingredient-type input below. A plain
      // dropdown of every ingredient type became unusable once the catalog
      // had more than a handful (a real complaint after Orange Juice turned
      // out to have no correct type to pick at all - see the type-search
      // input's comment) - same searchable text+datalist pattern
      // AddProductScreen already uses for this exact problem.
      ingredientTypeName:
        types.find((t) => t.id === p.ingredient_type_id)?.name ?? "",
      isHomemade: p.is_homemade,
    })
  }

  const editMatchedType = editingProduct
    ? resolveIngredientType(editingProduct.ingredientTypeName, {
        types,
        aliases,
      })
    : null

  const handleSaveEditProduct = async () => {
    if (!editingProduct || !editMatchedType) return
    setEditSaving(true)
    setEditError(null)
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name.trim(),
        ingredientTypeId: editMatchedType.id,
        brand: editingProduct.brand.trim(),
        isHomemade: editingProduct.isHomemade,
      })
      await onProductsChanged()
      setEditingProduct(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    setDeletingProduct(true)
    try {
      await deleteProduct(id)
      await onProductsChanged()
      setConfirmDeleteProductId(null)
    } finally {
      setDeletingProduct(false)
    }
  }

  return (
    <Card style={{ ...style, padding: 0, overflow: "hidden" }}>
      {products.map((p, pIdx) => {
        const rowBorder =
          pIdx < products.length - 1 ? "1px solid var(--border-s)" : "none"
        if (editingProduct?.id === p.id) {
          return (
            <div
              key={p.id}
              style={{
                padding: "10px 14px",
                borderBottom: rowBorder,
                background: "var(--bg2)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Input
                label="Name"
                value={editingProduct.name}
                onChange={(v) =>
                  setEditingProduct({ ...editingProduct, name: v })
                }
              />
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text2)",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Ingredient Type
                </label>
                <input
                  list={`edit-ing-types-${p.id}`}
                  value={editingProduct.ingredientTypeName}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      ingredientTypeName: e.target.value,
                    })
                  }
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-s)",
                    borderRadius: "var(--r-sm)",
                    padding: "8px 10px",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    width: "100%",
                  }}
                />
                <datalist id={`edit-ing-types-${p.id}`}>
                  {types.map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
                  {aliases.map((a) => (
                    <option key={a.id} value={a.alias} />
                  ))}
                </datalist>
                {editingProduct.ingredientTypeName.trim() &&
                  !editMatchedType && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: "var(--amber)",
                      }}
                    >
                      Doesn't match an existing ingredient type.
                    </p>
                  )}
              </div>
              <Input
                label="Brand (optional)"
                value={editingProduct.brand}
                onChange={(v) =>
                  setEditingProduct({ ...editingProduct, brand: v })
                }
              />
              {editError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                  {editError}
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  variant="primary"
                  small
                  disabled={
                    editSaving ||
                    !editingProduct.name.trim() ||
                    !editMatchedType
                  }
                  onClick={handleSaveEditProduct}
                >
                  {editSaving ? "Saving..." : "Save"}
                </Btn>
                <Btn
                  variant="ghost"
                  small
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Btn>
              </div>
            </div>
          )
        }
        if (confirmDeleteProductId === p.id) {
          return (
            <ConfirmPanel
              key={p.id}
              layout="row"
              style={{
                padding: "7px 14px",
                borderBottom: rowBorder,
                background: "var(--bg2)",
              }}
              message={`Delete "${p.name}"? This can't be undone.`}
              busy={deletingProduct}
              onConfirm={() => handleDeleteProduct(p.id)}
              onCancel={() => setConfirmDeleteProductId(null)}
            />
          )
        }
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "7px 14px",
              borderBottom: rowBorder,
              background: "var(--bg2)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: ownedProductIds.has(p.id)
                    ? "var(--text)"
                    : "var(--text3)",
                }}
              >
                {p.name}
                {p.brand && p.brand !== p.name ? ` · ${p.brand}` : ""}
                {p.is_homemade ? " · homemade" : ""}
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => startEditProduct(p)}
                title="Edit product"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--text3)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconEdit size={14} />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setConfirmDeleteProductId(p.id)}
                title="Delete product"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--text3)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconTrash size={14} />
              </button>
            )}
            <OwnedToggle
              owned={ownedProductIds.has(p.id)}
              onChange={() => onToggleProduct(p.id)}
            />
          </div>
        )
      })}
    </Card>
  )
}
