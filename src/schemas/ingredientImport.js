// Pure, framework-free validation for ingredient-type batch import (spec
// §12). No Supabase/React here - takes plain data in, returns plain data
// out, so it's independently testable and so the AI-prompt generator below
// can share its rules instead of restating them by hand (the two drifting
// apart is exactly what the spec's "reject unknown units/values" and this
// project's no-fuzzy-matching rule are meant to prevent).

import { resolveIngredientType } from "@/domain/ingredientResolution"

export const BAR_PRIORITIES = ["essential", "common", "specialized", "niche"]
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

/**
 * @param {unknown[]} rawItems - parsed JSON array, not yet validated
 * @param {{
 *   categories: {id: string, name: string}[],
 *   types: {id: string, name: string, category_id: string}[],
 *   aliases?: {alias: string, ingredient_type_id: string}[],
 * }} catalog
 */
export function validateIngredientImport(
  rawItems,
  { categories, types, aliases = [] },
) {
  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c]),
  )
  const seenNames = new Set()

  const results = rawItems.map((item, index) => {
    const errors = []
    const raw = item && typeof item === "object" ? item : {}

    const name = typeof raw.name === "string" ? raw.name.trim() : ""
    const existingViaName = name
      ? resolveIngredientType(name, { types, aliases })
      : null
    if (!name) errors.push("Missing name")
    else if (existingViaName)
      errors.push(
        existingViaName.name.toLowerCase() === name.toLowerCase()
          ? `"${name}" already exists in the catalog`
          : `"${name}" already resolves to "${existingViaName.name}" via an existing alias`,
      )
    else if (seenNames.has(name.toLowerCase()))
      errors.push(`Duplicate "${name}" earlier in this import`)
    if (name) seenNames.add(name.toLowerCase())

    const categoryName =
      typeof raw.category === "string" ? raw.category.trim() : ""
    const category = categoryByName.get(categoryName.toLowerCase())
    if (!categoryName) errors.push("Missing category")
    else if (!category) errors.push(`Unknown category "${categoryName}"`)

    let parent = null
    if (raw.parentType) {
      const parentName = String(raw.parentType).trim()
      parent = resolveIngredientType(parentName, { types, aliases })
      if (!parent) errors.push(`Unknown parentType "${parentName}"`)
      else if (category && parent.category_id !== category.id)
        errors.push(
          `parentType "${parentName}" is not in category "${categoryName}"`,
        )
    }

    const barPriority = raw.barPriority ?? "common"
    if (!BAR_PRIORITIES.includes(barPriority))
      errors.push(
        `Invalid barPriority "${barPriority}" (must be one of ${BAR_PRIORITIES.join(", ")})`,
      )

    if (
      raw.color !== undefined &&
      raw.color !== null &&
      !HEX_COLOR_RE.test(raw.color)
    )
      errors.push(`Invalid color "${raw.color}" (expected hex like #a1b2c3)`)

    const valid = errors.length === 0
    return {
      index,
      name: name || undefined,
      errors,
      valid,
      resolved: valid
        ? {
            name,
            category_id: category.id,
            parent_type_id: parent?.id ?? null,
            color: raw.color ?? null,
            bar_priority: barPriority,
            description:
              typeof raw.description === "string" ? raw.description : null,
          }
        : null,
    }
  })

  return {
    results,
    validCount: results.filter((r) => r.valid).length,
    errorCount: results.filter((r) => !r.valid).length,
  }
}

/**
 * Builds a copy-paste prompt for formatting new ingredient types with an AI
 * assistant, generated from the live catalog so it can never drift from
 * what validateIngredientImport() actually accepts.
 */
export function buildIngredientImportPrompt({
  categories,
  types,
  aliases = [],
}) {
  const categoryNames = categories.map((c) => c.name).sort()
  const typesByCategory = new Map(categoryNames.map((name) => [name, []]))
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))
  const aliasesByTypeId = new Map()
  aliases.forEach((a) => {
    if (!aliasesByTypeId.has(a.ingredient_type_id))
      aliasesByTypeId.set(a.ingredient_type_id, [])
    aliasesByTypeId.get(a.ingredient_type_id).push(a.alias)
  })
  types.forEach((t) => {
    const categoryName = categoryNameById.get(t.category_id)
    if (!categoryName) return
    const knownAliases = aliasesByTypeId.get(t.id) ?? []
    const label =
      knownAliases.length > 0
        ? `${t.name} (also known as: ${knownAliases.join(", ")})`
        : t.name
    typesByCategory.get(categoryName)?.push(label)
  })

  const existingLines = categoryNames
    .map(
      (name) =>
        `- ${name}: ${(typesByCategory.get(name) ?? []).sort().join(", ") || "(none yet)"}`,
    )
    .join("\n")

  return `Format a JSON array of new cocktail ingredient types for import into Cocktail Library.

Return ONLY a JSON array (no markdown fences, no commentary) where each item has:
- "name": string, required. Must not duplicate an existing ingredient type or any of its known aliases below.
- "category": string, required. Must be exactly one of: ${categoryNames.join(", ")}.
- "parentType": string, optional. Must be an existing type name (or one of its known aliases) within the SAME category, used to group related styles (e.g. "Rum" as the parentType for a new "Spiced Rum").
- "barPriority": one of ${BAR_PRIORITIES.join(", ")}. Optional, defaults to "common".
- "color": optional hex color like "#fb923c".
- "description": optional short string.

Existing categories and types (do not invent a new category; reuse an existing type name or alias as parentType where it makes sense - names in parentheses are known aliases, already covered, not gaps to fill):
${existingLines}

Here is what I want to add:
`
}
