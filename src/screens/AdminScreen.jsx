import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconLock,
  IconPlus,
  IconTrash,
  IconX,
} from "@/components/icons"
import { GlassSvg } from "@/components/GlassSvg"
import { TopBar } from "@/components/Nav"
import {
  Btn,
  Card,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
  SectionTitle,
} from "@/components/primitives"
import { GLASS_SHAPES } from "@/data/constants"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import {
  BAR_PRIORITIES,
  buildIngredientImportPrompt,
  validateIngredientImport,
} from "@/schemas/ingredientImport"
import {
  buildProductImportPrompt,
  validateProductImport,
} from "@/schemas/productImport"
import {
  buildRecipeImportPrompt,
  validateRecipeImport,
} from "@/schemas/recipeImport"
import {
  createCocktailFamily,
  createGlass,
  createIngredientAlias,
  createIngredientCategory,
  createIngredientTypes,
  createProducts,
  createTasteTag,
  deleteCocktailFamily,
  deleteGlass,
  deleteIngredientAlias,
  deleteIngredientCategory,
  deleteTasteTag,
  updateCocktailFamily,
  updateGlass,
  updateIngredientAlias,
  updateIngredientCategory,
  updateTasteTag,
} from "@/services/catalog"
import {
  fetchPendingIngredientRequests,
  resolveIngredientRequest,
} from "@/services/ingredientRequests"
import {
  deriveInvitationStatus,
  fetchInvitations,
  generateInvitation,
  revokeInvitation,
} from "@/services/invitations"
import {
  createClassicRecipes,
  fetchCommunityRecipes,
  unpublishRecipe,
} from "@/services/recipes"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "invites", label: "Invitations" },
  { id: "moderation", label: "Moderation" },
  { id: "requests", label: "Requests" },
  { id: "import", label: "Batch Import" },
  { id: "catalog", label: "Catalog" },
]

const STATUS_COLORS = {
  active: "var(--green)",
  redeemed: "var(--cyan)",
  expired: "var(--unavail)",
  revoked: "var(--coral)",
}
const STATUS_DOTS = {
  active: "●",
  redeemed: "◎",
  expired: "○",
  revoked: "⊘",
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

// Shared list+add+inline-edit+inline-delete-confirm UI for the four simple
// "admin-managed lookup table" cases (glasses, taste tags, cocktail
// families, ingredient categories) - one component instead of four
// near-identical copies. `items` need at least {id, name}; pass
// `showSortOrder` for ingredient_categories, the one table with an extra
// column. `onCreate`/`onUpdate` receive a plain string name (or
// `{name, sortOrder}` when `showSortOrder`); the caller re-fetches the
// catalog after any successful mutation, same as every other admin write in
// this file.
function NamedRowManager({
  title,
  singular,
  items,
  showSortOrder,
  showShapePicker,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [newName, setNewName] = useState("")
  const [newSortOrder, setNewSortOrder] = useState("0")
  const [newShape, setNewShape] = useState("martini")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editSortOrder, setEditSortOrder] = useState("0")
  const [editShape, setEditShape] = useState("martini")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      if (showSortOrder) {
        await onCreate({
          name: newName.trim(),
          sortOrder: Number(newSortOrder) || 0,
        })
      } else if (showShapePicker) {
        await onCreate({ name: newName.trim(), shape: newShape })
      } else {
        await onCreate(newName.trim())
      }
      setNewName("")
      setNewSortOrder("0")
      setNewShape("martini")
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
    setEditShape(item.shape ?? "martini")
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    setSaving(true)
    setEditError(null)
    try {
      if (showSortOrder) {
        await onUpdate(editingId, {
          name: editName.trim(),
          sortOrder: Number(editSortOrder) || 0,
        })
      } else if (showShapePicker) {
        await onUpdate(editingId, { name: editName.trim(), shape: editShape })
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ padding: 0 }}>
        {items.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: "14px 16px",
              fontSize: 13,
              color: "var(--text3)",
            }}
          >
            None yet.
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: "10px 14px",
                borderBottom:
                  i < items.length - 1 ? "1px solid var(--border-s)" : "none",
              }}
            >
              {editingId === item.id ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Input value={editName} onChange={setEditName} />
                    </div>
                    {showSortOrder && (
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(e.target.value)}
                        style={{
                          width: 64,
                          background: "var(--surface)",
                          border: "1px solid var(--border-s)",
                          borderRadius: "var(--r-sm)",
                          padding: "10px 8px",
                          color: "var(--text)",
                          fontSize: 14,
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    )}
                  </div>
                  {showShapePicker && (
                    <ShapePicker value={editShape} onChange={setEditShape} />
                  )}
                  {editError && (
                    <p
                      style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}
                    >
                      {editError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
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
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
                    Delete "{item.name}"?{" "}
                    {deleteError ? deleteError : "This can't be undone."}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="danger"
                      small
                      disabled={deleting}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => {
                        setConfirmDeleteId(null)
                        setDeleteError(null)
                      }}
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {showShapePicker && (
                    <GlassSvg
                      type={item.shape ?? "martini"}
                      size={22}
                      color="var(--text2)"
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "var(--text)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.name}
                    {showSortOrder && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          fontFamily: "var(--font-mono)",
                          marginLeft: 8,
                        }}
                      >
                        order {item.sort_order}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => startEdit(item)}
                    title={`Edit ${singular}`}
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
                  <button
                    onClick={() => {
                      setDeleteError(null)
                      setConfirmDeleteId(item.id)
                    }}
                    title={`Delete ${singular}`}
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
                </div>
              )}
            </div>
          ))
        )}
      </Card>
      {showShapePicker && (
        <ShapePicker value={newShape} onChange={setNewShape} />
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
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
            style={{
              width: 64,
              background: "var(--surface)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              padding: "10px 8px",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
            }}
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
      {createError && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
          {createError}
        </p>
      )}
    </div>
  )
}

// Which built-in GlassSvg pictogram a glass row uses - see GLASS_SHAPES'
// comment for why this exists instead of the icon being tied to the name.
function ShapePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {GLASS_SHAPES.map((shape) => (
        <button
          key={shape}
          type="button"
          onClick={() => onChange(shape)}
          title={shape}
          style={{
            padding: "6px 10px 4px",
            borderRadius: "var(--r-sm)",
            border: `1px solid ${
              value === shape ? "var(--cyan)" : "var(--border-s)"
            }`,
            background:
              value === shape ? "rgba(34,211,238,0.12)" : "var(--surface)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <GlassSvg
            type={shape}
            size={24}
            color={value === shape ? "var(--cyan)" : "var(--text2)"}
          />
          <span
            style={{
              fontSize: 10,
              color: value === shape ? "var(--cyan)" : "var(--text2)",
              textTransform: "capitalize",
            }}
          >
            {shape.replace(/_/g, " ")}
          </span>
        </button>
      ))}
    </div>
  )
}

const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border-s)",
  borderRadius: "var(--r-sm)",
  padding: "10px 14px",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  width: "100%",
}

// Backlog #2: ingredient_aliases had full RLS and zero application code -
// real spec scope (Phase 2, §12.3's "resolve through IDs, canonical names,
// or controlled aliases") that never got built. An alias maps free text to
// a real ingredient type (e.g. "Sec" -> Triple Sec) - resolveIngredientType()
// is the one place that mapping is actually consulted, everywhere an
// ingredient name gets matched. This component is only the CRUD half; each
// alias is checked against both existing type names and other aliases
// before saving, so two entries can never claim the same text and make
// resolution ambiguous - same guarantee the DB's own case-insensitive unique
// index enforces, just with a friendlier message before that round-trip.
function AliasManager({ aliases, types, onCreate, onUpdate, onDelete }) {
  const typeById = new Map(types.map((t) => [t.id, t]))

  const [newAlias, setNewAlias] = useState("")
  const [newTypeName, setNewTypeName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editAlias, setEditAlias] = useState("")
  const [editTypeName, setEditTypeName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleCreate = async () => {
    const aliasText = newAlias.trim()
    if (!aliasText || !newTypeName.trim()) return
    setCreating(true)
    setCreateError(null)
    const collision = resolveIngredientType(aliasText, { types, aliases })
    if (collision) {
      setCreateError(`"${aliasText}" already refers to "${collision.name}"`)
      setCreating(false)
      return
    }
    const targetType = resolveIngredientType(newTypeName, { types, aliases })
    if (!targetType) {
      setCreateError(
        `"${newTypeName}" doesn't match an existing ingredient type`,
      )
      setCreating(false)
      return
    }
    try {
      await onCreate({ alias: aliasText, ingredientTypeId: targetType.id })
      setNewAlias("")
      setNewTypeName("")
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (a) => {
    setEditError(null)
    setEditingId(a.id)
    setEditAlias(a.alias)
    setEditTypeName(typeById.get(a.ingredient_type_id)?.name ?? "")
  }

  const handleSaveEdit = async () => {
    const aliasText = editAlias.trim()
    if (!aliasText || !editTypeName.trim()) return
    setSaving(true)
    setEditError(null)
    const otherAliases = aliases.filter((a) => a.id !== editingId)
    const collision = resolveIngredientType(aliasText, {
      types,
      aliases: otherAliases,
    })
    if (collision) {
      setEditError(`"${aliasText}" already refers to "${collision.name}"`)
      setSaving(false)
      return
    }
    const targetType = resolveIngredientType(editTypeName, {
      types,
      aliases: otherAliases,
    })
    if (!targetType) {
      setEditError(
        `"${editTypeName}" doesn't match an existing ingredient type`,
      )
      setSaving(false)
      return
    }
    try {
      await onUpdate(editingId, {
        alias: aliasText,
        ingredientTypeId: targetType.id,
      })
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
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionTitle>Ingredient Aliases</SectionTitle>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
        Alternate names that resolve to a real ingredient type during import and
        matching (e.g. "Sec" → Triple Sec) - an explicit admin mapping, never a
        guess from name similarity. One alias can only ever mean one type.
      </p>
      <Card style={{ padding: 0 }}>
        {aliases.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: "14px 16px",
              fontSize: 13,
              color: "var(--text3)",
            }}
          >
            None yet.
          </p>
        ) : (
          aliases.map((a, i) => (
            <div
              key={a.id}
              style={{
                padding: "10px 14px",
                borderBottom:
                  i < aliases.length - 1 ? "1px solid var(--border-s)" : "none",
              }}
            >
              {editingId === a.id ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Input value={editAlias} onChange={setEditAlias} />
                  <div>
                    <input
                      list="alias-target-types"
                      value={editTypeName}
                      onChange={(e) => setEditTypeName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  {editError && (
                    <p
                      style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}
                    >
                      {editError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="primary"
                      small
                      disabled={
                        saving || !editAlias.trim() || !editTypeName.trim()
                      }
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
              ) : confirmDeleteId === a.id ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
                    Delete alias "{a.alias}"?{" "}
                    {deleteError ? deleteError : "This can't be undone."}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="danger"
                      small
                      disabled={deleting}
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => {
                        setConfirmDeleteId(null)
                        setDeleteError(null)
                      }}
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "var(--text)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {a.alias} <span style={{ color: "var(--text3)" }}>→</span>{" "}
                    {typeById.get(a.ingredient_type_id)?.name ?? "unknown type"}
                  </span>
                  <button
                    onClick={() => startEdit(a)}
                    title="Edit alias"
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
                  <button
                    onClick={() => {
                      setDeleteError(null)
                      setConfirmDeleteId(a.id)
                    }}
                    title="Delete alias"
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
                </div>
              )}
            </div>
          ))
        )}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Alias (e.g. Sec)"
              value={newAlias}
              onChange={setNewAlias}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              list="alias-target-types"
              placeholder="Maps to ingredient type..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <datalist id="alias-target-types">
          {types.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <Btn
          variant="primary"
          small
          disabled={creating || !newAlias.trim() || !newTypeName.trim()}
          onClick={handleCreate}
        >
          {creating ? "Adding..." : "Add Alias"}
        </Btn>
      </div>
      {createError && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
          {createError}
        </p>
      )}
    </div>
  )
}

export default function AdminScreen() {
  const navigate = useNavigate()
  const { catalog, computed, refetchRecipes } = useOutletContext()
  const [tab, setTab] = useState("overview")
  const [invites, setInvites] = useState([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [revokingInviteId, setRevokingInviteId] = useState(null)
  const [inviteError, setInviteError] = useState(null)
  const [copied, setCopied] = useState(null)

  // Batch Import covers three entities: "ingredients" (with its own
  // single/batch sub-modes below), "recipes", and "products" - the latter
  // two are batch/AI only, since both already have a member-facing
  // equivalent for one-off creation (New Recipe, My Bar's Add Product), so a
  // duplicate quick-add here would be redundant.
  const [importEntity, setImportEntity] = useState("ingredients")

  // Ingredient-adding has two modes: "single" (a quick form for the common
  // case of adding one thing) and "batch" (AI-formatted JSON, for adding
  // several at once).
  const [importMode, setImportMode] = useState("single")
  const [importSuccessMessage, setImportSuccessMessage] = useState(null)

  const [singleName, setSingleName] = useState("")
  // No default category - defaulting to the first one (Spirit, since it
  // sorts first) meant every ingredient silently started out mis-filed as a
  // spirit unless you noticed and changed it. Forcing an explicit choice
  // also means the parent-type list can't show irrelevant spirit styles
  // while adding something like a juice or mixer.
  const [singleCategoryId, setSingleCategoryId] = useState("")
  const [singleParentTypeId, setSingleParentTypeId] = useState("")
  const [singleBarPriority, setSingleBarPriority] = useState("common")
  const [singleColor, setSingleColor] = useState("")
  const [singleDescription, setSingleDescription] = useState("")
  const [singleSaving, setSingleSaving] = useState(false)
  const [singleError, setSingleError] = useState(null)

  const [batchPhase, setBatchPhase] = useState("paste")
  const [importJson, setImportJson] = useState("")
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  // Recipe batch import - same paste/validate/preview/commit shape as
  // ingredients, kept as separate state since the two entities' prompts,
  // validators, and commit paths are unrelated.
  const [recipeBatchPhase, setRecipeBatchPhase] = useState("paste")
  const [recipeImportJson, setRecipeImportJson] = useState("")
  const [recipeImportResult, setRecipeImportResult] = useState(null)
  const [recipeImporting, setRecipeImporting] = useState(false)
  const [recipePromptCopied, setRecipePromptCopied] = useState(false)
  const [recipeImportSuccessMessage, setRecipeImportSuccessMessage] =
    useState(null)

  // Inline "add this missing ingredient" from a recipe-import row, rather
  // than forcing a trip out to the Ingredients tab and back with the pasted
  // JSON lost. One draft at a time (not per-row) since only one form can be
  // usefully edited at once anyway. Reuses validateIngredientImport/
  // createIngredientTypes - same rules as Single Ingredient, not a second
  // hand-rolled check.
  const [addIngredientDraft, setAddIngredientDraft] = useState(null)
  const [addIngredientSaving, setAddIngredientSaving] = useState(false)
  const [addIngredientError, setAddIngredientError] = useState(null)

  // Product batch import - same shape again, one flat bulk insert since
  // products have no per-row children (unlike recipes' components/tags).
  const [productBatchPhase, setProductBatchPhase] = useState("paste")
  const [productImportJson, setProductImportJson] = useState("")
  const [productImportResult, setProductImportResult] = useState(null)
  const [productImporting, setProductImporting] = useState(false)
  const [productPromptCopied, setProductPromptCopied] = useState(false)
  const [productImportSuccessMessage, setProductImportSuccessMessage] =
    useState(null)

  // Moderation is real: currently-published community recipes, with an
  // Unpublish action. There's no pre-publish review queue in the spec
  // (publishing is immediate) - the original mock's "pending/approve/reject"
  // flow didn't map to anything real and has been dropped rather than faked.
  const [communityRecipes, setCommunityRecipes] = useState([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [confirmUnpublish, setConfirmUnpublish] = useState(null)
  const [unpublishing, setUnpublishing] = useState(false)

  const loadCommunityRecipes = () => {
    setCommunityLoading(true)
    fetchCommunityRecipes().then((data) => {
      setCommunityRecipes(data)
      setCommunityLoading(false)
    })
  }

  useEffect(() => {
    loadCommunityRecipes()
  }, [])

  const handleUnpublish = async (id) => {
    setUnpublishing(true)
    try {
      await unpublishRecipe(id)
      loadCommunityRecipes()
    } finally {
      setUnpublishing(false)
      setConfirmUnpublish(null)
    }
  }

  // Requests: members' suggestions for missing ingredient types (see
  // RequestIngredientScreen.jsx). Fulfilling one doesn't auto-create the
  // type - the admin still goes through Batch Import for that, since a
  // request is just a name/note, not a validated category+hierarchy.
  const [pendingRequests, setPendingRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [resolvingRequestId, setResolvingRequestId] = useState(null)

  const loadPendingRequests = () => {
    setRequestsLoading(true)
    fetchPendingIngredientRequests().then((data) => {
      setPendingRequests(data)
      setRequestsLoading(false)
    })
  }

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const handleResolveRequest = async (id, status) => {
    setResolvingRequestId(id)
    try {
      await resolveIngredientRequest(id, status)
      loadPendingRequests()
    } finally {
      setResolvingRequestId(null)
    }
  }

  // Jumps to the single-add form pre-filled with a request's name - doesn't
  // resolve the request itself, since "added to the catalog" and "marked
  // fulfilled" are separate admin actions (the admin might want to double-
  // check the result before dismissing the request).
  const startSingleAddFromRequest = (name) => {
    setImportSuccessMessage(null)
    setImportMode("single")
    setSingleName(name)
    setTab("import")
  }

  const loadInvitations = () => {
    setInvitesLoading(true)
    fetchInvitations().then((data) => {
      setInvites(data)
      setInvitesLoading(false)
    })
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const generateInvite = async () => {
    setGeneratingInvite(true)
    setInviteError(null)
    try {
      const created = await generateInvitation()
      setInvites([{ ...created, redeemed_by_profile: null }, ...invites])
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setGeneratingInvite(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeInvite = async (id) => {
    setRevokingInviteId(id)
    setInviteError(null)
    try {
      const revoked = await revokeInvitation(id)
      setInvites(invites.map((i) => (i.id === id ? revoked : i)))
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setRevokingInviteId(null)
    }
  }

  const importPrompt = buildIngredientImportPrompt({
    categories: catalog.categories,
    types: catalog.types,
    aliases: catalog.aliases,
  })

  const copyImportPrompt = () => {
    navigator.clipboard.writeText(importPrompt).catch(() => {})
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const runImportValidation = () => {
    let parsed
    try {
      parsed = JSON.parse(importJson)
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array")
    } catch (err) {
      setImportResult({ parseError: err.message })
      setBatchPhase("results")
      return
    }
    const validation = validateIngredientImport(parsed, {
      categories: catalog.categories,
      types: catalog.types,
      aliases: catalog.aliases,
    })
    setImportResult(validation)
    setBatchPhase("results")
  }

  const handleCommitImport = async () => {
    if (!importResult?.results) return
    const rows = importResult.results
      .filter((r) => r.valid)
      .map((r) => r.resolved)
    if (rows.length === 0) return
    setImporting(true)
    try {
      await createIngredientTypes(rows)
      await catalog.refetch()
      setImportSuccessMessage(
        `Imported ${rows.length} ingredient type${
          rows.length === 1 ? "" : "s"
        }.`,
      )
      setBatchPhase("paste")
      setImportJson("")
      setImportResult(null)
    } catch (err) {
      setImportResult({ ...importResult, commitError: err.message })
    } finally {
      setImporting(false)
    }
  }

  const recipeImportPrompt = buildRecipeImportPrompt({
    types: catalog.types,
    glasses: catalog.glasses,
    families: catalog.families,
    tasteTags: catalog.tasteTags,
    aliases: catalog.aliases,
  })

  const copyRecipeImportPrompt = () => {
    navigator.clipboard.writeText(recipeImportPrompt).catch(() => {})
    setRecipePromptCopied(true)
    setTimeout(() => setRecipePromptCopied(false), 2000)
  }

  const runRecipeImportValidation = () => {
    let parsed
    try {
      parsed = JSON.parse(recipeImportJson)
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array")
    } catch (err) {
      setRecipeImportResult({ parseError: err.message })
      setRecipeBatchPhase("results")
      return
    }
    const validation = validateRecipeImport(parsed, {
      types: catalog.types,
      glasses: catalog.glasses,
      families: catalog.families,
      tasteTags: catalog.tasteTags,
      aliases: catalog.aliases,
      existingRecipeNames: computed.map((r) => r.name),
    })
    setRecipeImportResult(validation)
    setRecipeBatchPhase("results")
  }

  const handleCommitRecipeImport = async () => {
    if (!recipeImportResult?.results) return
    const rows = recipeImportResult.results
      .filter((r) => r.valid)
      .map((r) => r.resolved)
    if (rows.length === 0) return
    setRecipeImporting(true)
    try {
      const { createdCount, failures } = await createClassicRecipes(rows)
      await refetchRecipes()
      if (failures.length === 0) {
        setRecipeImportSuccessMessage(
          `Imported ${createdCount} recipe${createdCount === 1 ? "" : "s"}.`,
        )
        setRecipeBatchPhase("paste")
        setRecipeImportJson("")
        setRecipeImportResult(null)
      } else {
        setRecipeImportResult({
          ...recipeImportResult,
          commitError: `${createdCount} imported, ${failures.length} failed: ${failures
            .map((f) => `"${f.name}" (${f.message})`)
            .join("; ")}`,
        })
      }
    } catch (err) {
      setRecipeImportResult({ ...recipeImportResult, commitError: err.message })
    } finally {
      setRecipeImporting(false)
    }
  }

  const openAddIngredientDraft = (name) => {
    setAddIngredientError(null)
    setAddIngredientDraft({
      name,
      categoryId: "",
      parentTypeId: "",
      barPriority: "common",
      color: "",
      description: "",
    })
  }

  const handleSaveAddIngredientDraft = async () => {
    if (!addIngredientDraft) return
    setAddIngredientSaving(true)
    setAddIngredientError(null)
    const categoryName =
      catalog.categories.find((c) => c.id === addIngredientDraft.categoryId)
        ?.name ?? ""
    const parentTypeName = addIngredientDraft.parentTypeId
      ? catalog.types.find((t) => t.id === addIngredientDraft.parentTypeId)
          ?.name
      : undefined
    const { results } = validateIngredientImport(
      [
        {
          name: addIngredientDraft.name.trim(),
          category: categoryName,
          parentType: parentTypeName,
          barPriority: addIngredientDraft.barPriority,
          color: addIngredientDraft.color.trim() || undefined,
          description: addIngredientDraft.description.trim() || undefined,
        },
      ],
      {
        categories: catalog.categories,
        types: catalog.types,
        aliases: catalog.aliases,
      },
    )
    const [result] = results
    if (!result.valid) {
      setAddIngredientError(result.errors.join("; "))
      setAddIngredientSaving(false)
      return
    }
    try {
      await createIngredientTypes([result.resolved])
      await catalog.refetch()
      setAddIngredientDraft(null)
      // Re-validate in place so the row that was blocked on this ingredient
      // updates immediately, without losing the pasted JSON.
      runRecipeImportValidation()
    } catch (err) {
      setAddIngredientError(err.message)
    } finally {
      setAddIngredientSaving(false)
    }
  }

  const productImportPrompt = buildProductImportPrompt({
    types: catalog.types,
    aliases: catalog.aliases,
  })

  const copyProductImportPrompt = () => {
    navigator.clipboard.writeText(productImportPrompt).catch(() => {})
    setProductPromptCopied(true)
    setTimeout(() => setProductPromptCopied(false), 2000)
  }

  const runProductImportValidation = () => {
    let parsed
    try {
      parsed = JSON.parse(productImportJson)
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array")
    } catch (err) {
      setProductImportResult({ parseError: err.message })
      setProductBatchPhase("results")
      return
    }
    const validation = validateProductImport(parsed, {
      types: catalog.types,
      aliases: catalog.aliases,
      existingProducts: catalog.products,
    })
    setProductImportResult(validation)
    setProductBatchPhase("results")
  }

  const handleCommitProductImport = async () => {
    if (!productImportResult?.results) return
    const rows = productImportResult.results
      .filter((r) => r.valid)
      .map((r) => r.resolved)
    if (rows.length === 0) return
    setProductImporting(true)
    try {
      await createProducts(rows)
      await catalog.refetch()
      setProductImportSuccessMessage(
        `Imported ${rows.length} product${rows.length === 1 ? "" : "s"}.`,
      )
      setProductBatchPhase("paste")
      setProductImportJson("")
      setProductImportResult(null)
    } catch (err) {
      setProductImportResult({
        ...productImportResult,
        commitError: err.message,
      })
    } finally {
      setProductImporting(false)
    }
  }

  // Reuses the same validator batch import uses (single-item array), so a
  // duplicate/unknown-value mistake is caught the same way in both paths
  // instead of a separately hand-rolled check that could drift.
  const handleAddSingle = async () => {
    setSingleSaving(true)
    setSingleError(null)
    const categoryName =
      catalog.categories.find((c) => c.id === singleCategoryId)?.name ?? ""
    const parentTypeName = singleParentTypeId
      ? catalog.types.find((t) => t.id === singleParentTypeId)?.name
      : undefined
    const { results } = validateIngredientImport(
      [
        {
          name: singleName.trim(),
          category: categoryName,
          parentType: parentTypeName,
          barPriority: singleBarPriority,
          color: singleColor.trim() || undefined,
          description: singleDescription.trim() || undefined,
        },
      ],
      {
        categories: catalog.categories,
        types: catalog.types,
        aliases: catalog.aliases,
      },
    )
    const [result] = results
    if (!result.valid) {
      setSingleError(result.errors.join("; "))
      setSingleSaving(false)
      return
    }
    try {
      await createIngredientTypes([result.resolved])
      await catalog.refetch()
      setImportSuccessMessage(`Added "${result.resolved.name}".`)
      setSingleName("")
      setSingleParentTypeId("")
      setSingleColor("")
      setSingleDescription("")
    } catch (err) {
      setSingleError(err.message)
    } finally {
      setSingleSaving(false)
    }
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar title="Admin Dashboard" onBack={() => navigate(-1)} />

      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-s)",
          background: "var(--bg2)",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                tab === t.id ? "var(--violet)" : "transparent"
              }`,
              color: tab === t.id ? "var(--violet)" : "var(--text2)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: tab === t.id ? 700 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {t.id === "requests" && pendingRequests.length > 0
              ? ` (${pendingRequests.length})`
              : ""}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {tab === "overview" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Classic Recipes",
                  val: computed.filter((r) => r.source === "classic").length,
                  color: "var(--violet)",
                },
                {
                  label: "Community Recipes",
                  val: communityRecipes.length,
                  color: "var(--cyan)",
                },
                {
                  label: "Ingredient Types",
                  val: catalog.types.length,
                  color: "var(--green)",
                },
                {
                  label: "Active Invitations",
                  val: invites.filter(
                    (i) => deriveInvitationStatus(i) === "active",
                  ).length,
                  color: "var(--amber)",
                },
              ].map(({ label, val, color }) => (
                <Card
                  key={label}
                  style={{ padding: "16px", textAlign: "center" }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      color,
                      marginBottom: 4,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text2)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {label}
                  </div>
                </Card>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
              All four counts are real.
            </p>
          </div>
        )}

        {tab === "invites" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Btn
              variant="primary"
              disabled={generatingInvite}
              onClick={generateInvite}
            >
              <IconPlus size={15} />{" "}
              {generatingInvite ? "Generating..." : "Generate Invitation"}
            </Btn>
            {inviteError && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                {inviteError}
              </p>
            )}
            {invitesLoading ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                Loading...
              </p>
            ) : invites.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                No invitations yet.
              </p>
            ) : (
              invites.map((inv) => {
                const status = deriveInvitationStatus(inv)
                return (
                  <Card key={inv.id} style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              fontSize: 14,
                              color: "var(--text)",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {inv.code}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: STATUS_COLORS[status],
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {STATUS_DOTS[status]} {status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          Created {formatDate(inv.created_at)} · Expires{" "}
                          {formatDate(inv.expires_at)}
                        </div>
                        {inv.redeemed_by_profile && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--cyan)",
                              marginTop: 2,
                            }}
                          >
                            Redeemed by{" "}
                            {inv.redeemed_by_profile.display_name ?? "a member"}
                          </div>
                        )}
                      </div>
                      {status === "active" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => copyCode(inv.code)}
                            style={{
                              background:
                                copied === inv.code
                                  ? "rgba(52,211,153,0.15)"
                                  : "var(--surface3)",
                              border: "1px solid var(--border-s)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              cursor: "pointer",
                              color:
                                copied === inv.code
                                  ? "var(--green)"
                                  : "var(--text2)",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {copied === inv.code ? (
                              <IconCheck size={12} />
                            ) : (
                              <IconCopy size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => revokeInvite(inv.id)}
                            disabled={revokingInviteId === inv.id}
                            style={{
                              background: "rgba(251,113,133,0.1)",
                              border: "1px solid rgba(251,113,133,0.25)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              cursor: "pointer",
                              color: "var(--coral)",
                              fontSize: 12,
                            }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {tab === "moderation" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Published community recipes. Unpublishing returns a recipe to its
              owner's private list without deleting it.
            </p>
            {communityLoading ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                Loading...
              </p>
            ) : communityRecipes.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                No published community recipes.
              </p>
            ) : (
              communityRecipes.map((c) => (
                <Card key={c.id} style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
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
                        {c.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>
                        by {c.owner?.display_name ?? "unknown"}
                        {c.published_at &&
                          ` · published ${formatDate(c.published_at)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmUnpublish(c.id)}
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
                      <IconLock size={12} /> Unpublish
                    </button>
                  </div>
                  {confirmUnpublish === c.id && (
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
                        Unpublish "{c.name}"? It returns to{" "}
                        {c.owner?.display_name ?? "the owner"}'s private list —
                        their copy won't be deleted.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn
                          variant="danger"
                          small
                          disabled={unpublishing}
                          onClick={() => handleUnpublish(c.id)}
                        >
                          Unpublish
                        </Btn>
                        <Btn
                          variant="ghost"
                          small
                          onClick={() => setConfirmUnpublish(null)}
                        >
                          Cancel
                        </Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "requests" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Ingredients members have asked for. Fulfilling one is just
              bookkeeping - use Batch Import to actually add the type.
            </p>
            {requestsLoading ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                Loading...
              </p>
            ) : pendingRequests.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                No pending requests.
              </p>
            ) : (
              pendingRequests.map((r) => (
                <Card key={r.id} style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
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
                        {r.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>
                        by {r.requester?.display_name ?? "unknown"} ·{" "}
                        {formatDate(r.created_at)}
                      </div>
                      {r.note && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 13,
                            color: "var(--text2)",
                          }}
                        >
                          {r.note}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => startSingleAddFromRequest(r.name)}
                        title="Add to catalog"
                        style={{
                          background: "rgba(34,211,238,0.1)",
                          border: "1px solid rgba(34,211,238,0.25)",
                          borderRadius: 6,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "var(--cyan)",
                        }}
                      >
                        <IconPlus size={14} />
                      </button>
                      <button
                        onClick={() => handleResolveRequest(r.id, "fulfilled")}
                        disabled={resolvingRequestId === r.id}
                        title="Mark fulfilled"
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.25)",
                          borderRadius: 6,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "var(--green)",
                        }}
                      >
                        <IconCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleResolveRequest(r.id, "dismissed")}
                        disabled={resolvingRequestId === r.id}
                        title="Dismiss"
                        style={{
                          background: "rgba(251,113,133,0.1)",
                          border: "1px solid rgba(251,113,133,0.25)",
                          borderRadius: 6,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "var(--coral)",
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "import" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "flex",
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
              }}
            >
              {[
                { id: "ingredients", label: "Ingredients" },
                { id: "recipes", label: "Recipes" },
                { id: "products", label: "Products" },
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => setImportEntity(e.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background:
                      importEntity === e.id ? "rgba(34,211,238,0.12)" : "none",
                    border: "none",
                    cursor: "pointer",
                    color:
                      importEntity === e.id ? "var(--cyan)" : "var(--text2)",
                    fontFamily: "var(--font-display)",
                    fontWeight: importEntity === e.id ? 700 : 400,
                    fontSize: 13,
                    transition: "all 0.15s",
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>

            {importEntity === "ingredients" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {importSuccessMessage && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
                    {importSuccessMessage}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    background: "var(--surface)",
                    border: "1px solid var(--border-s)",
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                  }}
                >
                  {[
                    { id: "single", label: "Single Ingredient" },
                    { id: "batch", label: "Batch Import (AI)" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setImportSuccessMessage(null)
                        setImportMode(m.id)
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background:
                          importMode === m.id
                            ? "rgba(167,139,250,0.12)"
                            : "none",
                        border: "none",
                        cursor: "pointer",
                        color:
                          importMode === m.id
                            ? "var(--violet)"
                            : "var(--text2)",
                        fontFamily: "var(--font-display)",
                        fontWeight: importMode === m.id ? 700 : 400,
                        fontSize: 13,
                        transition: "all 0.15s",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {importMode === "single" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <Input
                      label="Name"
                      placeholder="e.g. Passionfruit Juice"
                      value={singleName}
                      onChange={setSingleName}
                    />
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text2)",
                          fontFamily: "var(--font-display)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Category
                      </label>
                      <CategoryPicker
                        categories={catalog.categories}
                        value={singleCategoryId}
                        onChange={(v) => {
                          setSingleCategoryId(v)
                          setSingleParentTypeId("")
                        }}
                      />
                    </div>
                    {singleCategoryId && (
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--text2)",
                            fontFamily: "var(--font-display)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          Parent type (optional)
                        </label>
                        <Select
                          value={singleParentTypeId}
                          onChange={setSingleParentTypeId}
                          options={[
                            { value: "", label: "None" },
                            ...catalog.types
                              .filter((t) => t.category_id === singleCategoryId)
                              .map((t) => ({ value: t.id, label: t.name })),
                          ]}
                        />
                      </div>
                    )}
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text2)",
                          fontFamily: "var(--font-display)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Bar priority
                      </label>
                      <Select
                        value={singleBarPriority}
                        onChange={setSingleBarPriority}
                        options={BAR_PRIORITIES.map((p) => ({
                          value: p,
                          label: p[0].toUpperCase() + p.slice(1),
                        }))}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text2)",
                          fontFamily: "var(--font-display)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Color (optional)
                      </label>
                      <ColorSwatchPicker
                        value={singleColor}
                        onChange={setSingleColor}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text2)",
                          fontFamily: "var(--font-display)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Description (optional)
                      </label>
                      <textarea
                        value={singleDescription}
                        onChange={(e) => setSingleDescription(e.target.value)}
                        rows={2}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-s)",
                          borderRadius: "var(--r-sm)",
                          padding: "10px 14px",
                          color: "var(--text)",
                          fontSize: 14,
                          fontFamily: "var(--font-body)",
                          width: "100%",
                          resize: "vertical",
                        }}
                      />
                    </div>
                    {singleError && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "var(--coral)",
                        }}
                      >
                        {singleError}
                      </p>
                    )}
                    <Btn
                      variant="primary"
                      full
                      disabled={
                        !singleName.trim() || !singleCategoryId || singleSaving
                      }
                      onClick={handleAddSingle}
                    >
                      {singleSaving ? "Adding..." : "Add Ingredient"}
                    </Btn>
                  </div>
                )}

                {importMode === "batch" && batchPhase === "paste" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Format with AI, then Paste JSON
                    </h3>
                    <p
                      style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}
                    >
                      Copy this prompt into an AI chat along with what you want
                      to add (e.g. "Passionfruit Juice, Yuzu, Grapefruit"), then
                      paste its JSON output below. The prompt is generated from
                      the live catalog, so it always lists the current
                      categories and types.
                    </p>
                    <textarea
                      readOnly
                      value={importPrompt}
                      rows={14}
                      onFocus={(e) => e.target.select()}
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "14px",
                        color: "var(--text2)",
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        lineHeight: 1.6,
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn variant="ghost" small onClick={copyImportPrompt}>
                      {promptCopied ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )}{" "}
                      {promptCopied ? "Copied" : "Copy Prompt"}
                    </Btn>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Paste your JSON here..."
                      rows={8}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "12px 14px",
                        color: "var(--text)",
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn variant="primary" full onClick={runImportValidation}>
                      Validate
                    </Btn>
                  </div>
                )}

                {importMode === "batch" &&
                  batchPhase === "results" &&
                  importResult && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-display)",
                          fontSize: 17,
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        Validation Results
                      </h3>
                      {importResult.parseError ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--coral)",
                          }}
                        >
                          Couldn't parse that as a JSON array:{" "}
                          {importResult.parseError}
                        </p>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 8,
                            }}
                          >
                            {[
                              {
                                label: "Ready to import",
                                val: importResult.validCount,
                                color: "var(--green)",
                              },
                              {
                                label: "Errors",
                                val: importResult.errorCount,
                                color: "var(--coral)",
                              },
                            ].map(({ label, val, color }) => (
                              <Card
                                key={label}
                                style={{ padding: "12px", textAlign: "center" }}
                              >
                                <div
                                  style={{
                                    fontSize: 24,
                                    fontFamily: "var(--font-display)",
                                    fontWeight: 800,
                                    color,
                                    marginBottom: 2,
                                  }}
                                >
                                  {val}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text2)",
                                  }}
                                >
                                  {label}
                                </div>
                              </Card>
                            ))}
                          </div>
                          <Card style={{ padding: "12px 14px" }}>
                            {importResult.results.map((row, i, arr) => (
                              <div
                                key={row.index}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  padding: "8px 0",
                                  borderBottom:
                                    i < arr.length - 1
                                      ? "1px solid var(--border-s)"
                                      : "none",
                                }}
                              >
                                <div
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    marginTop: 6,
                                    background: row.valid
                                      ? "var(--green)"
                                      : "var(--coral)",
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: "var(--text)",
                                    }}
                                  >
                                    {row.name ?? `Row ${row.index + 1}`}
                                  </span>
                                  {!row.valid && (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--coral)",
                                        marginTop: 2,
                                      }}
                                    >
                                      {row.errors.join("; ")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </Card>
                          {importResult.commitError && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "var(--coral)",
                              }}
                            >
                              {importResult.commitError}
                            </p>
                          )}
                        </>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn
                          variant="ghost"
                          small
                          onClick={() => {
                            setBatchPhase("paste")
                            setImportJson("")
                            setImportResult(null)
                          }}
                        >
                          Cancel
                        </Btn>
                        {!importResult.parseError && (
                          <Btn
                            variant="primary"
                            full
                            disabled={
                              importing || importResult.validCount === 0
                            }
                            onClick={handleCommitImport}
                          >
                            {importing
                              ? "Importing..."
                              : `Import ${importResult.validCount} Ingredient${
                                  importResult.validCount === 1 ? "" : "s"
                                }`}
                          </Btn>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {importEntity === "recipes" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {recipeImportSuccessMessage && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
                    {recipeImportSuccessMessage}
                  </p>
                )}

                {recipeBatchPhase === "paste" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Format with AI, then Paste JSON
                    </h3>
                    <p
                      style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}
                    >
                      Copy this prompt into an AI chat along with what recipes
                      you want to add, then paste its JSON output below. The
                      prompt is generated from the live catalog (ingredients,
                      glasses, families, taste tags), so the AI can only
                      reference things that actually exist.
                    </p>
                    <textarea
                      readOnly
                      value={recipeImportPrompt}
                      rows={14}
                      onFocus={(e) => e.target.select()}
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "14px",
                        color: "var(--text2)",
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        lineHeight: 1.6,
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn variant="ghost" small onClick={copyRecipeImportPrompt}>
                      {recipePromptCopied ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )}{" "}
                      {recipePromptCopied ? "Copied" : "Copy Prompt"}
                    </Btn>
                    <textarea
                      value={recipeImportJson}
                      onChange={(e) => setRecipeImportJson(e.target.value)}
                      placeholder="Paste your JSON here..."
                      rows={8}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "12px 14px",
                        color: "var(--text)",
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn
                      variant="primary"
                      full
                      onClick={runRecipeImportValidation}
                    >
                      Validate
                    </Btn>
                  </div>
                )}

                {recipeBatchPhase === "results" && recipeImportResult && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Validation Results
                    </h3>
                    {recipeImportResult.parseError ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--coral)",
                        }}
                      >
                        Couldn't parse that as a JSON array:{" "}
                        {recipeImportResult.parseError}
                      </p>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 8,
                          }}
                        >
                          {[
                            {
                              label: "Ready to import",
                              val: recipeImportResult.validCount,
                              color: "var(--green)",
                            },
                            {
                              label: "Errors",
                              val: recipeImportResult.errorCount,
                              color: "var(--coral)",
                            },
                          ].map(({ label, val, color }) => (
                            <Card
                              key={label}
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <div
                                style={{
                                  fontSize: 24,
                                  fontFamily: "var(--font-display)",
                                  fontWeight: 800,
                                  color,
                                  marginBottom: 2,
                                }}
                              >
                                {val}
                              </div>
                              <div
                                style={{ fontSize: 11, color: "var(--text2)" }}
                              >
                                {label}
                              </div>
                            </Card>
                          ))}
                        </div>
                        <Card style={{ padding: "12px 14px" }}>
                          {recipeImportResult.results.map((row, i, arr) => (
                            <div
                              key={row.index}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "8px 0",
                                borderBottom:
                                  i < arr.length - 1
                                    ? "1px solid var(--border-s)"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  marginTop: 6,
                                  background: row.valid
                                    ? "var(--green)"
                                    : "var(--coral)",
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{ fontSize: 13, color: "var(--text)" }}
                                >
                                  {row.name ?? `Row ${row.index + 1}`}
                                </span>
                                {!row.valid && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--coral)",
                                      marginTop: 2,
                                    }}
                                  >
                                    {row.errors.join("; ")}
                                  </div>
                                )}
                                {row.missingIngredientNames?.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 6,
                                      marginTop: 6,
                                    }}
                                  >
                                    {row.missingIngredientNames.map((n) => (
                                      <button
                                        key={n}
                                        onClick={() =>
                                          openAddIngredientDraft(n)
                                        }
                                        style={{
                                          background: "rgba(34,211,238,0.1)",
                                          border:
                                            "1px solid rgba(34,211,238,0.25)",
                                          borderRadius: 6,
                                          padding: "3px 8px",
                                          cursor: "pointer",
                                          color: "var(--cyan)",
                                          fontSize: 11,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <IconPlus size={10} /> Add "{n}"
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </Card>

                        {addIngredientDraft && (
                          <Card
                            style={{
                              padding: "14px",
                              border: "1px solid rgba(34,211,238,0.25)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text)",
                                fontFamily: "var(--font-display)",
                              }}
                            >
                              Add ingredient
                            </div>
                            {/* The AI-flagged text isn't always a clean
                                ingredient name (e.g. "Fresh pineapple - 50
                                g", with the quantity/notes still attached) -
                                editable rather than a fixed label so that
                                can be cleaned up before creating the type. */}
                            <Input
                              label="Name"
                              value={addIngredientDraft.name}
                              onChange={(v) =>
                                setAddIngredientDraft({
                                  ...addIngredientDraft,
                                  name: v,
                                })
                              }
                            />
                            <div>
                              <label
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "var(--text2)",
                                  fontFamily: "var(--font-display)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  display: "block",
                                  marginBottom: 6,
                                }}
                              >
                                Category
                              </label>
                              <CategoryPicker
                                categories={catalog.categories}
                                value={addIngredientDraft.categoryId}
                                onChange={(v) =>
                                  setAddIngredientDraft({
                                    ...addIngredientDraft,
                                    categoryId: v,
                                    parentTypeId: "",
                                  })
                                }
                              />
                            </div>
                            {addIngredientDraft.categoryId && (
                              <Select
                                value={addIngredientDraft.parentTypeId}
                                onChange={(v) =>
                                  setAddIngredientDraft({
                                    ...addIngredientDraft,
                                    parentTypeId: v,
                                  })
                                }
                                options={[
                                  { value: "", label: "No parent type" },
                                  ...catalog.types
                                    .filter(
                                      (t) =>
                                        t.category_id ===
                                        addIngredientDraft.categoryId,
                                    )
                                    .map((t) => ({
                                      value: t.id,
                                      label: t.name,
                                    })),
                                ]}
                              />
                            )}
                            <Select
                              value={addIngredientDraft.barPriority}
                              onChange={(v) =>
                                setAddIngredientDraft({
                                  ...addIngredientDraft,
                                  barPriority: v,
                                })
                              }
                              options={BAR_PRIORITIES.map((p) => ({
                                value: p,
                                label: p[0].toUpperCase() + p.slice(1),
                              }))}
                            />
                            <ColorSwatchPicker
                              value={addIngredientDraft.color}
                              onChange={(v) =>
                                setAddIngredientDraft({
                                  ...addIngredientDraft,
                                  color: v,
                                })
                              }
                            />
                            {addIngredientError && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: "var(--coral)",
                                }}
                              >
                                {addIngredientError}
                              </p>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <Btn
                                variant="primary"
                                small
                                disabled={
                                  !addIngredientDraft.name.trim() ||
                                  !addIngredientDraft.categoryId ||
                                  addIngredientSaving
                                }
                                onClick={handleSaveAddIngredientDraft}
                              >
                                {addIngredientSaving
                                  ? "Adding..."
                                  : "Add & Re-validate"}
                              </Btn>
                              <Btn
                                variant="ghost"
                                small
                                onClick={() => setAddIngredientDraft(null)}
                              >
                                Cancel
                              </Btn>
                            </div>
                          </Card>
                        )}
                        {recipeImportResult.commitError && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "var(--coral)",
                            }}
                          >
                            {recipeImportResult.commitError}
                          </p>
                        )}
                      </>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        variant="ghost"
                        small
                        onClick={() => {
                          setRecipeBatchPhase("paste")
                          setRecipeImportJson("")
                          setRecipeImportResult(null)
                        }}
                      >
                        Cancel
                      </Btn>
                      {!recipeImportResult.parseError && (
                        <Btn
                          variant="primary"
                          full
                          disabled={
                            recipeImporting ||
                            recipeImportResult.validCount === 0
                          }
                          onClick={handleCommitRecipeImport}
                        >
                          {recipeImporting
                            ? "Importing..."
                            : `Import ${recipeImportResult.validCount} Recipe${
                                recipeImportResult.validCount === 1 ? "" : "s"
                              }`}
                        </Btn>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {importEntity === "products" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {productImportSuccessMessage && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
                    {productImportSuccessMessage}
                  </p>
                )}

                {productBatchPhase === "paste" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Format with AI, then Paste JSON
                    </h3>
                    <p
                      style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}
                    >
                      Copy this prompt into an AI chat along with what branded
                      or homemade products you want to add, then paste its JSON
                      output below. The prompt is generated from the live
                      ingredient types, so the AI can only map products onto
                      things that actually exist.
                    </p>
                    <textarea
                      readOnly
                      value={productImportPrompt}
                      rows={14}
                      onFocus={(e) => e.target.select()}
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "14px",
                        color: "var(--text2)",
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        lineHeight: 1.6,
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn
                      variant="ghost"
                      small
                      onClick={copyProductImportPrompt}
                    >
                      {productPromptCopied ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )}{" "}
                      {productPromptCopied ? "Copied" : "Copy Prompt"}
                    </Btn>
                    <textarea
                      value={productImportJson}
                      onChange={(e) => setProductImportJson(e.target.value)}
                      placeholder="Paste your JSON here..."
                      rows={8}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "12px 14px",
                        color: "var(--text)",
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                        resize: "vertical",
                        width: "100%",
                      }}
                    />
                    <Btn
                      variant="primary"
                      full
                      onClick={runProductImportValidation}
                    >
                      Validate
                    </Btn>
                  </div>
                )}

                {productBatchPhase === "results" && productImportResult && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Validation Results
                    </h3>
                    {productImportResult.parseError ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--coral)",
                        }}
                      >
                        Couldn't parse that as a JSON array:{" "}
                        {productImportResult.parseError}
                      </p>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 8,
                          }}
                        >
                          {[
                            {
                              label: "Ready to import",
                              val: productImportResult.validCount,
                              color: "var(--green)",
                            },
                            {
                              label: "Errors",
                              val: productImportResult.errorCount,
                              color: "var(--coral)",
                            },
                          ].map(({ label, val, color }) => (
                            <Card
                              key={label}
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <div
                                style={{
                                  fontSize: 24,
                                  fontFamily: "var(--font-display)",
                                  fontWeight: 800,
                                  color,
                                  marginBottom: 2,
                                }}
                              >
                                {val}
                              </div>
                              <div
                                style={{ fontSize: 11, color: "var(--text2)" }}
                              >
                                {label}
                              </div>
                            </Card>
                          ))}
                        </div>
                        <Card style={{ padding: "12px 14px" }}>
                          {productImportResult.results.map((row, i, arr) => (
                            <div
                              key={row.index}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "8px 0",
                                borderBottom:
                                  i < arr.length - 1
                                    ? "1px solid var(--border-s)"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  marginTop: 6,
                                  background: row.valid
                                    ? "var(--green)"
                                    : "var(--coral)",
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{ fontSize: 13, color: "var(--text)" }}
                                >
                                  {row.name ?? `Row ${row.index + 1}`}
                                </span>
                                {!row.valid && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--coral)",
                                      marginTop: 2,
                                    }}
                                  >
                                    {row.errors.join("; ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </Card>
                        {productImportResult.commitError && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "var(--coral)",
                            }}
                          >
                            {productImportResult.commitError}
                          </p>
                        )}
                      </>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        variant="ghost"
                        small
                        onClick={() => {
                          setProductBatchPhase("paste")
                          setProductImportJson("")
                          setProductImportResult(null)
                        }}
                      >
                        Cancel
                      </Btn>
                      {!productImportResult.parseError && (
                        <Btn
                          variant="primary"
                          full
                          disabled={
                            productImporting ||
                            productImportResult.validCount === 0
                          }
                          onClick={handleCommitProductImport}
                        >
                          {productImporting
                            ? "Importing..."
                            : `Import ${productImportResult.validCount} Product${
                                productImportResult.validCount === 1 ? "" : "s"
                              }`}
                        </Btn>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "catalog" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Glasses, taste tags, cocktail families, and ingredient categories
              - the lookup lists recipes and ingredient types reference. A row
              in use by a recipe or ingredient type can't be deleted (the
              database rejects it); rename or add new ones instead.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
              Every glass picks one of a handful of built-in pictograms
              (whichever one looks closest) - a new glass name works
              immediately, no code change needed. A genuinely new silhouette
              none of these resemble still needs a developer to draw it.
            </p>
            <NamedRowManager
              title="Glasses"
              singular="glass"
              items={catalog.glasses}
              showShapePicker
              onCreate={async ({ name, shape }) => {
                await createGlass(name, shape)
                await catalog.refetch()
              }}
              onUpdate={async (id, { name, shape }) => {
                await updateGlass(id, name, shape)
                await catalog.refetch()
              }}
              onDelete={async (id) => {
                await deleteGlass(id)
                await catalog.refetch()
              }}
            />
            <NamedRowManager
              title="Taste Tags"
              singular="taste tag"
              items={catalog.tasteTags}
              onCreate={async (name) => {
                await createTasteTag(name)
                await catalog.refetch()
              }}
              onUpdate={async (id, name) => {
                await updateTasteTag(id, name)
                await catalog.refetch()
              }}
              onDelete={async (id) => {
                await deleteTasteTag(id)
                await catalog.refetch()
              }}
            />
            <NamedRowManager
              title="Cocktail Families"
              singular="family"
              items={catalog.families}
              onCreate={async (name) => {
                await createCocktailFamily(name)
                await catalog.refetch()
              }}
              onUpdate={async (id, name) => {
                await updateCocktailFamily(id, name)
                await catalog.refetch()
              }}
              onDelete={async (id) => {
                await deleteCocktailFamily(id)
                await catalog.refetch()
              }}
            />
            <NamedRowManager
              title="Ingredient Categories"
              singular="category"
              items={catalog.categories}
              showSortOrder
              onCreate={async ({ name, sortOrder }) => {
                await createIngredientCategory({ name, sortOrder })
                await catalog.refetch()
              }}
              onUpdate={async (id, { name, sortOrder }) => {
                await updateIngredientCategory(id, { name, sortOrder })
                await catalog.refetch()
              }}
              onDelete={async (id) => {
                await deleteIngredientCategory(id)
                await catalog.refetch()
              }}
            />
            <AliasManager
              aliases={catalog.aliases}
              types={catalog.types}
              onCreate={async ({ alias, ingredientTypeId }) => {
                await createIngredientAlias({ alias, ingredientTypeId })
                await catalog.refetch()
              }}
              onUpdate={async (id, { alias, ingredientTypeId }) => {
                await updateIngredientAlias(id, { alias, ingredientTypeId })
                await catalog.refetch()
              }}
              onDelete={async (id) => {
                await deleteIngredientAlias(id)
                await catalog.refetch()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
