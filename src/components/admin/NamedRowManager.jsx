import { useState } from "react"
import clsx from "clsx"
import { FamilyIcon } from "@/components/FamilyIcon"
import { GlassSvg } from "@/components/GlassSvg"
import { IconEdit, IconTrash } from "@/components/icons"
import { IngredientIcon } from "@/components/IngredientIcon"
import {
  Btn,
  Card,
  ConfirmPanel,
  Input,
  SectionTitle,
} from "@/components/primitives"
import { resolveGlass } from "@/domain/glassResolution"
import { HexColorField } from "./HexColorField"
import { ShapePicker } from "./ShapePicker"

// Shared list+add+inline-edit+inline-delete-confirm UI for the four simple
// "admin-managed lookup table" cases (glasses, taste tags, cocktail
// families, ingredient categories) - one component instead of four
// near-identical copies. `items` need at least {id, name}; pass
// `showSortOrder` for ingredient_categories, the one table with an extra
// column. `onCreate`/`onUpdate` receive a plain string name (or
// `{name, sortOrder}` when `showSortOrder`); the caller re-fetches the
// catalog after any successful mutation, same as every other admin write in
// this file.
// "glass" -> GLASS_SHAPES/GlassSvg, "family" -> FAMILY_SHAPES/FamilyIcon,
// "ingredient" -> INGREDIENT_SHAPES/IngredientIcon (ingredient_categories,
// which also has showSortOrder - the one table with two of these optional
// columns at once, see the combined-payload comment in handleCreate below).
// Undefined means this table has no shape column at all.
const SHAPE_KIND_DEFAULTS = {
  glass: "martini",
  family: "highball",
  ingredient: "spirit_bottle",
}

const DEFAULT_NEW_COLOR_HEX = "#888888"

export function NamedRowManager({
  title,
  singular,
  items,
  showSortOrder,
  shapeKind,
  colorField,
  onCreate,
  onUpdate,
  onDelete,
  aliases,
  onCreateAlias,
  onDeleteAlias,
  onAliasesChanged,
}) {
  const [newName, setNewName] = useState("")
  const [newSortOrder, setNewSortOrder] = useState("0")
  const [newShape, setNewShape] = useState(
    SHAPE_KIND_DEFAULTS[shapeKind] ?? "martini",
  )
  const [newHex, setNewHex] = useState(DEFAULT_NEW_COLOR_HEX)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editSortOrder, setEditSortOrder] = useState("0")
  const [editShape, setEditShape] = useState(
    SHAPE_KIND_DEFAULTS[shapeKind] ?? "martini",
  )
  const [editHex, setEditHex] = useState(DEFAULT_NEW_COLOR_HEX)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Glass-only aliases (e.g. "Rocks Glass" -> the catalog's "Lowball
  // Glass"), same inline chip-list pattern IngredientTypeEditor uses for
  // ingredient aliases - only rendered when the caller passes `aliases`
  // (currently just the Glasses entry in CatalogTab.jsx), so the other
  // three NamedRowManager consumers (taste tags, cocktail families,
  // ingredient categories) are unaffected.
  const [newAliasText, setNewAliasText] = useState("")
  const [aliasSaving, setAliasSaving] = useState(false)
  const [aliasError, setAliasError] = useState(null)
  const [deletingAliasId, setDeletingAliasId] = useState(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      // Not a mutually-exclusive if/else chain: ingredient_categories has
      // both showSortOrder and shapeKind at once (sort_order predates
      // shape) - build the payload from whichever optional fields this
      // table actually has, rather than only ever sending one.
      if (showSortOrder || shapeKind || colorField) {
        await onCreate({
          name: newName.trim(),
          ...(showSortOrder && { sortOrder: Number(newSortOrder) || 0 }),
          ...(shapeKind && { shape: newShape }),
          ...(colorField && { hex: newHex.trim() }),
        })
      } else {
        await onCreate(newName.trim())
      }
      setNewName("")
      setNewSortOrder("0")
      setNewShape(SHAPE_KIND_DEFAULTS[shapeKind] ?? "martini")
      setNewHex(DEFAULT_NEW_COLOR_HEX)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (item) => {
    setEditError(null)
    setEditingId(item.id)
    setEditName(item.name)
    setEditSortOrder(String(item.sort_order ?? 0))
    setEditShape(item.shape ?? SHAPE_KIND_DEFAULTS[shapeKind] ?? "martini")
    setEditHex(item.hex ?? DEFAULT_NEW_COLOR_HEX)
    setNewAliasText("")
    setAliasError(null)
  }

  const handleAddAlias = async (itemId) => {
    const aliasText = newAliasText.trim()
    if (!aliasText) return
    setAliasSaving(true)
    setAliasError(null)
    const collision = resolveGlass(aliasText, { glasses: items, aliases })
    if (collision) {
      setAliasError(
        collision.id === itemId
          ? `"${aliasText}" already refers to this glass`
          : `"${aliasText}" already refers to "${collision.name}"`,
      )
      setAliasSaving(false)
      return
    }
    try {
      await onCreateAlias(aliasText, itemId)
      setNewAliasText("")
      await onAliasesChanged()
    } catch (err) {
      setAliasError(err.message)
    } finally {
      setAliasSaving(false)
    }
  }

  const handleDeleteAlias = async (id) => {
    setDeletingAliasId(id)
    setAliasError(null)
    try {
      await onDeleteAlias(id)
      await onAliasesChanged()
    } catch (err) {
      setAliasError(err.message)
    } finally {
      setDeletingAliasId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    setSaving(true)
    setEditError(null)
    try {
      if (showSortOrder || shapeKind || colorField) {
        await onUpdate(editingId, {
          name: editName.trim(),
          ...(showSortOrder && { sortOrder: Number(editSortOrder) || 0 }),
          ...(shapeKind && { shape: editShape }),
          ...(colorField && { hex: editHex.trim() }),
        })
      } else {
        await onUpdate(editingId, editName.trim())
      }
      setEditingId(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(id)
      setConfirmDeleteId(null)
    } catch (err) {
      // Most likely a foreign key violation (still in use by a recipe or
      // ingredient type) - the DB's own error message is specific enough to
      // show as-is rather than guessing a friendlier one.
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <SectionTitle>{title}</SectionTitle>
      <Card className="p-0">
        {items.length === 0 ? (
          <p className="py-3.5 px-4 text-[13px] text-tx3">None yet.</p>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              className={clsx(
                "py-2.5 px-3.5",
                i < items.length - 1 && "border-b border-bdr",
              )}
            >
              {editingId === item.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    {colorField && (
                      <HexColorField value={editHex} onChange={setEditHex} />
                    )}
                    <div className="flex-1">
                      <Input value={editName} onChange={setEditName} />
                    </div>
                    {showSortOrder && (
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(e.target.value)}
                        className="w-16 bg-surface border border-bdr rounded-sm py-2.5 px-2 text-tx text-sm font-mono"
                      />
                    )}
                  </div>
                  {shapeKind && (
                    <ShapePicker
                      kind={shapeKind}
                      value={editShape}
                      onChange={setEditShape}
                    />
                  )}
                  {aliases && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em]">
                        Aliases
                      </label>
                      {aliases.filter((a) => a.glass_id === item.id).length >
                        0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {aliases
                            .filter((a) => a.glass_id === item.id)
                            .map((a) => (
                              <span
                                key={a.id}
                                className="flex items-center gap-1.5 py-1 px-2 bg-surface border border-bdr rounded-sm text-[13px] text-tx"
                              >
                                {a.alias}
                                <button
                                  onClick={() => handleDeleteAlias(a.id)}
                                  disabled={deletingAliasId === a.id}
                                  title={`Remove alias "${a.alias}"`}
                                  className="bg-transparent border-none cursor-pointer p-0 text-tx3 text-sm leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Add alias (e.g. Rocks Glass)"
                            value={newAliasText}
                            onChange={setNewAliasText}
                          />
                        </div>
                        <Btn
                          small
                          disabled={aliasSaving || !newAliasText.trim()}
                          onClick={() => handleAddAlias(item.id)}
                        >
                          {aliasSaving ? "Adding..." : "+ Add"}
                        </Btn>
                      </div>
                      {aliasError && (
                        <p className="text-xs text-coral">{aliasError}</p>
                      )}
                    </div>
                  )}
                  {editError && (
                    <p className="text-xs text-coral">{editError}</p>
                  )}
                  <div className="flex gap-2">
                    <Btn
                      variant="primary"
                      small
                      disabled={saving || !editName.trim()}
                      onClick={handleSaveEdit}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              ) : confirmDeleteId === item.id ? (
                <ConfirmPanel
                  layout="stack"
                  message={`Delete "${item.name}"? ${
                    deleteError ? deleteError : "This can't be undone."
                  }`}
                  busy={deleting}
                  onConfirm={() => handleDelete(item.id)}
                  onCancel={() => {
                    setConfirmDeleteId(null)
                    setDeleteError(null)
                  }}
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  {shapeKind === "glass" && (
                    <GlassSvg
                      type={item.shape ?? "martini"}
                      size={22}
                      color="var(--text2)"
                    />
                  )}
                  {shapeKind === "family" && (
                    <FamilyIcon
                      shape={item.shape ?? "highball"}
                      size={22}
                      color="var(--text2)"
                    />
                  )}
                  {shapeKind === "ingredient" && (
                    <IngredientIcon
                      shape={item.shape ?? "spirit_bottle"}
                      size={22}
                      color="var(--text2)"
                    />
                  )}
                  {colorField && (
                    <div
                      title={item.hex}
                      className="w-4.5 h-4.5 rounded-full border border-bdr shrink-0"
                      style={{ background: item.hex }}
                    />
                  )}
                  <span className="flex-1 text-sm text-tx font-body">
                    {item.name}
                    {showSortOrder && (
                      <span className="text-[11px] text-tx3 font-mono ml-2">
                        order {item.sort_order}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => startEdit(item)}
                    title={`Edit ${singular}`}
                    className="bg-transparent border-none cursor-pointer p-1 text-tx3 flex items-center"
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(null)
                      setConfirmDeleteId(item.id)
                    }}
                    title={`Delete ${singular}`}
                    className="bg-transparent border-none cursor-pointer p-1 text-tx3 flex items-center"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
      {shapeKind && (
        <ShapePicker kind={shapeKind} value={newShape} onChange={setNewShape} />
      )}
      <div className="flex gap-2 items-center">
        {colorField && <HexColorField value={newHex} onChange={setNewHex} />}
        <div className="flex-1">
          <Input
            placeholder={`New ${singular} name`}
            value={newName}
            onChange={setNewName}
          />
        </div>
        {showSortOrder && (
          <input
            type="number"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(e.target.value)}
            title="Sort order"
            className="w-16 bg-surface border border-bdr rounded-sm py-2.5 px-2 text-tx text-sm font-mono"
          />
        )}
        <Btn
          variant="primary"
          small
          disabled={creating || !newName.trim()}
          onClick={handleCreate}
        >
          {creating ? "Adding..." : "Add"}
        </Btn>
      </div>
      {createError && <p className="text-xs text-coral">{createError}</p>}
    </div>
  )
}
