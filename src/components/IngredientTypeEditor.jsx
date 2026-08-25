import { useState } from "react"
import { ShapePicker } from "@/components/admin/ShapePicker"
import {
  Btn,
  Card,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
} from "@/components/primitives"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import {
  BAR_PRIORITIES,
  validateIngredientImport,
} from "@/schemas/ingredientImport"
import {
  createIngredientAlias,
  deleteIngredientAlias,
  updateIngredientType,
} from "@/services/catalog"

// Shared "edit an existing ingredient type" form - used by both My Bar's
// inline admin edit pencil and Admin's Ingredient Types tab, so the one real
// business rule here (reusing validateIngredientImport()'s single-item path
// for the duplicate-name/parent-hierarchy check) only lives in one place.
// Aliases live here too (not a separate admin-wide list) per user request -
// managing "Sec -> Triple Sec" reads more naturally next to Triple Sec's own
// name/category/color than in a global table of every alias for every type.
// Only possible on Edit, not the Single Ingredient add form: an alias needs
// a real ingredient_type_id to attach to, which doesn't exist until the type
// itself has been created.
export function IngredientTypeEditor({
  type,
  categories,
  types,
  aliases,
  liquidColors,
  onSaved,
  onAliasesChanged,
  onCancel,
  style,
}) {
  const [name, setName] = useState(type.name)
  const [categoryId, setCategoryId] = useState(type.category_id)
  const [parentTypeId, setParentTypeId] = useState(type.parent_type_id ?? "")
  const [barPriority, setBarPriority] = useState(type.bar_priority)
  const [color, setColor] = useState(type.color ?? "")
  const [shape, setShape] = useState(type.shape ?? "spirit_bottle")
  const [description] = useState(type.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const typeAliases = aliases.filter((a) => a.ingredient_type_id === type.id)
  const [newAlias, setNewAlias] = useState("")
  const [aliasSaving, setAliasSaving] = useState(false)
  const [aliasError, setAliasError] = useState(null)
  const [deletingAliasId, setDeletingAliasId] = useState(null)

  const otherTypes = types.filter((t) => t.id !== type.id)

  const handleAddAlias = async () => {
    const aliasText = newAlias.trim()
    if (!aliasText) return
    setAliasSaving(true)
    setAliasError(null)
    const collision = resolveIngredientType(aliasText, { types, aliases })
    if (collision) {
      setAliasError(
        collision.id === type.id
          ? `"${aliasText}" already refers to this type`
          : `"${aliasText}" already refers to "${collision.name}"`,
      )
      setAliasSaving(false)
      return
    }
    try {
      await createIngredientAlias({
        alias: aliasText,
        ingredientTypeId: type.id,
      })
      setNewAlias("")
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
      await deleteIngredientAlias(id)
      await onAliasesChanged()
    } catch (err) {
      setAliasError(err.message)
    } finally {
      setDeletingAliasId(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const categoryName = categories.find((c) => c.id === categoryId)?.name ?? ""
    const parentTypeName = parentTypeId
      ? otherTypes.find((t) => t.id === parentTypeId)?.name
      : undefined
    const { results } = validateIngredientImport(
      [
        {
          name: name.trim(),
          category: categoryName,
          parentType: parentTypeName,
          barPriority,
          color: color.trim() || undefined,
          description: description.trim() || undefined,
        },
      ],
      { categories, types: otherTypes, aliases },
    )
    const [result] = results
    if (!result.valid) {
      setError(result.errors.join("; "))
      setSaving(false)
      return
    }
    try {
      const updated = await updateIngredientType(type.id, {
        name: result.resolved.name,
        categoryId: result.resolved.category_id,
        parentTypeId: result.resolved.parent_type_id,
        barPriority: result.resolved.bar_priority,
        color: result.resolved.color,
        description: result.resolved.description,
        shape,
      })
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-3.5 flex flex-col gap-2" style={style}>
      <Input label="Name" value={name} onChange={setName} />
      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={(v) => {
          setCategoryId(v)
          setParentTypeId("")
        }}
      />
      <Select
        value={parentTypeId}
        onChange={setParentTypeId}
        options={[
          { value: "", label: "No parent type" },
          ...otherTypes
            .filter((t) => t.category_id === categoryId)
            .map((t) => ({ value: t.id, label: t.name })),
        ]}
      />
      <Select
        value={barPriority}
        onChange={setBarPriority}
        options={BAR_PRIORITIES.map((p) => ({
          value: p,
          label: p[0].toUpperCase() + p.slice(1),
        }))}
      />
      <ColorSwatchPicker
        value={color}
        onChange={setColor}
        colors={liquidColors}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em]">
          Pictogram
        </label>
        <ShapePicker kind="ingredient" value={shape} onChange={setShape} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em]">
          Aliases
        </label>
        {typeAliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {typeAliases.map((a) => (
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
              placeholder="Add alias (e.g. Sec)"
              value={newAlias}
              onChange={setNewAlias}
            />
          </div>
          <Btn
            small
            disabled={aliasSaving || !newAlias.trim()}
            onClick={handleAddAlias}
          >
            {aliasSaving ? "Adding..." : "+ Add"}
          </Btn>
        </div>
        {aliasError && <p className="text-xs text-coral">{aliasError}</p>}
      </div>
      {error && <p className="text-xs text-coral">{error}</p>}
      <div className="flex gap-2">
        <Btn
          variant="primary"
          small
          disabled={saving || !name.trim() || !categoryId}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </Btn>
        <Btn variant="ghost" small onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </Card>
  )
}
