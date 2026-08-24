import { useState } from "react"
import { IconEdit, IconTrash } from "@/components/icons"
import { IngredientTypeEditor } from "@/components/IngredientTypeEditor"
import { Btn, Card, Input } from "@/components/primitives"
import { deleteIngredientType } from "@/services/catalog"

// Every ingredient type in the catalog. Same split-out reasoning as Classic
// Recipes - editing already existed (My Bar's admin pencil, now
// IngredientTypeEditor shared with this tab), but delete had zero UI
// despite the "ingredient_types: admin delete" RLS policy existing since
// the RLS-hardening pass. No pre-check for in-use: a child type, product,
// recipe component, or substitution alternative referencing this type all
// have their own restricting FK, so a real delete attempt on an in-use type
// surfaces the DB's own error as-is, same precedent as the Catalog tab.
export function TypesTab({ catalog, onAddNew }) {
  const [typeQuery, setTypeQuery] = useState("")
  const [editingAdminTypeId, setEditingAdminTypeId] = useState(null)
  const [confirmDeleteTypeId, setConfirmDeleteTypeId] = useState(null)
  const [deletingType, setDeletingType] = useState(false)
  const [typeDeleteError, setTypeDeleteError] = useState(null)

  const categoryNameById = new Map(
    catalog.categories.map((c) => [c.id, c.name]),
  )
  const typeNameById = new Map(catalog.types.map((t) => [t.id, t.name]))
  const filteredTypes = [...catalog.types]
    .filter((t) => t.name.toLowerCase().includes(typeQuery.toLowerCase()))
    .sort(
      (a, b) =>
        (categoryNameById.get(a.category_id) ?? "").localeCompare(
          categoryNameById.get(b.category_id) ?? "",
        ) || a.name.localeCompare(b.name),
    )

  const handleDeleteType = async (id) => {
    setDeletingType(true)
    setTypeDeleteError(null)
    try {
      await deleteIngredientType(id)
      await catalog.refetch()
      setConfirmDeleteTypeId(null)
    } catch (err) {
      setTypeDeleteError(err.message)
    } finally {
      setDeletingType(false)
    }
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        Every ingredient type in the catalog. Delete only succeeds if nothing -
        a child type, product, recipe, or substitution - still references it;
        the database's own rejection shows as-is.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Search types..."
            value={typeQuery}
            onChange={setTypeQuery}
          />
        </div>
        <Btn variant="primary" small onClick={onAddNew}>
          + Add
        </Btn>
      </div>
      {filteredTypes.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          No matching ingredient types.
        </p>
      ) : (
        filteredTypes.map((t) =>
          editingAdminTypeId === t.id ? (
            <IngredientTypeEditor
              key={t.id}
              type={t}
              categories={catalog.categories}
              types={catalog.types}
              aliases={catalog.aliases}
              liquidColors={catalog.liquidColors}
              onAliasesChanged={catalog.refetch}
              onSaved={async () => {
                await catalog.refetch()
                setEditingAdminTypeId(null)
              }}
              onCancel={() => setEditingAdminTypeId(null)}
            />
          ) : (
            <Card key={t.id} style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: t.color || "var(--surface3)",
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 3,
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    {categoryNameById.get(t.category_id) ?? "Uncategorized"}
                    {t.parent_type_id &&
                      ` · under ${typeNameById.get(t.parent_type_id)}`}
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdminTypeId(t.id)}
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--cyan)",
                    fontSize: 12,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IconEdit size={12} /> Edit
                </button>
                <button
                  onClick={() => {
                    setTypeDeleteError(null)
                    setConfirmDeleteTypeId(t.id)
                  }}
                  style={{
                    background: "rgba(251,113,133,0.1)",
                    border: "1px solid rgba(251,113,133,0.25)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--coral)",
                    fontSize: 12,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IconTrash size={12} /> Delete
                </button>
              </div>
              {confirmDeleteTypeId === t.id && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px",
                    background: "rgba(251,113,133,0.08)",
                    borderRadius: 8,
                    border: "1px solid rgba(251,113,133,0.25)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 13,
                      color: "var(--text2)",
                    }}
                  >
                    {typeDeleteError
                      ? typeDeleteError
                      : `Delete "${t.name}"? This can't be undone.`}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="danger"
                      small
                      disabled={deletingType}
                      onClick={() => handleDeleteType(t.id)}
                    >
                      Delete
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => {
                        setConfirmDeleteTypeId(null)
                        setTypeDeleteError(null)
                      }}
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          ),
        )
      )}
    </div>
  )
}
