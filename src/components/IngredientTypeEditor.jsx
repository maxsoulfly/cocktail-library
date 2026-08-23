import { useState } from "react"
import {
  Btn,
  Card,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
} from "@/components/primitives"
import {
  BAR_PRIORITIES,
  validateIngredientImport,
} from "@/schemas/ingredientImport"
import { updateIngredientType } from "@/services/catalog"

// Shared "edit an existing ingredient type" form - used by both My Bar's
// inline admin edit pencil and Admin's Ingredient Types tab, so the one real
// business rule here (reusing validateIngredientImport()'s single-item path
// for the duplicate-name/parent-hierarchy check) only lives in one place.
export function IngredientTypeEditor({
  type,
  categories,
  types,
  aliases,
  liquidColors,
  onSaved,
  onCancel,
  style,
}) {
  const [name, setName] = useState(type.name)
  const [categoryId, setCategoryId] = useState(type.category_id)
  const [parentTypeId, setParentTypeId] = useState(type.parent_type_id ?? "")
  const [barPriority, setBarPriority] = useState(type.bar_priority)
  const [color, setColor] = useState(type.color ?? "")
  const [description] = useState(type.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const otherTypes = types.filter((t) => t.id !== type.id)

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
      })
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      style={{
        ...style,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
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
      {error && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
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
