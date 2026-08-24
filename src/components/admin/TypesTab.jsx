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
    <div className="fade-in flex flex-col gap-3">
      <p className="text-[13px] text-tx2">
        Every ingredient type in the catalog. Delete only succeeds if nothing -
        a child type, product, recipe, or substitution - still references it;
        the database's own rejection shows as-is.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
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
        <p className="text-sm text-tx3">No matching ingredient types.</p>
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
            <Card key={t.id} className="py-3.5 px-4">
              <div className="flex items-start gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ background: t.color || "var(--surface3)" }}
                />
                <div className="flex-1">
                  <div className="text-[15px] font-display font-bold text-tx mb-[3px]">
                    {t.name}
                  </div>
                  <div className="text-xs text-tx3">
                    {categoryNameById.get(t.category_id) ?? "Uncategorized"}
                    {t.parent_type_id &&
                      ` · under ${typeNameById.get(t.parent_type_id)}`}
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdminTypeId(t.id)}
                  className="bg-cyan/10 border border-cyan/25 rounded-sm py-1.5 px-3 cursor-pointer text-cyan text-xs font-display font-semibold flex items-center gap-1"
                >
                  <IconEdit size={12} /> Edit
                </button>
                <button
                  onClick={() => {
                    setTypeDeleteError(null)
                    setConfirmDeleteTypeId(t.id)
                  }}
                  className="bg-coral/10 border border-coral/25 rounded-sm py-1.5 px-3 cursor-pointer text-coral text-xs font-display font-semibold flex items-center gap-1"
                >
                  <IconTrash size={12} /> Delete
                </button>
              </div>
              {confirmDeleteTypeId === t.id && (
                <div className="mt-3 p-3 bg-coral/8 rounded-sm border border-coral/25">
                  <p className="mb-2.5 text-[13px] text-tx2">
                    {typeDeleteError
                      ? typeDeleteError
                      : `Delete "${t.name}"? This can't be undone.`}
                  </p>
                  <div className="flex gap-2">
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
