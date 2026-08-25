// Pure, framework-free parsing for the member-facing "paste a recipe, fill
// in the form" flow (New Recipe screen). Deliberately NOT the same contract
// as validateRecipeImport(): that validator is all-or-nothing (any invalid
// field fails the whole row) because admin batch import commits rows
// directly with no human review. Here the output always lands in the
// ordinary New Recipe form for a member to look over before saving, so this
// is lenient by design - resolve whatever cleanly resolves (glass, family,
// taste tags, each ingredient via the same resolveIngredientType() rule
// everywhere else uses), and pass anything that doesn't resolve through as
// plain typed text instead of rejecting the whole paste. An unmatched
// ingredient name then just shows the form's existing "doesn't match -
// Request it" warning, exactly as if the member had typed it by hand -
// no separate resolution UI to build or keep in sync.

import { NON_VOLUME_UNITS } from "@/data/constants"
import { resolveGlass } from "@/domain/glassResolution"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import { RECIPE_ROLES } from "./recipeImport"

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

/**
 * @param {unknown} raw - parsed JSON: a single recipe object, or an array
 *   (only the first element is used - this flow is one recipe at a time).
 * @param {{
 *   types: {id: string, name: string}[],
 *   glasses: {id: string, name: string}[],
 *   families: {id: string, name: string}[],
 *   tasteTags: {id: string, name: string}[],
 *   aliases?: {alias: string, ingredient_type_id: string}[],
 *   glassAliases?: {alias: string, glass_id: string}[],
 * }} catalog
 * @returns {object | null} form-shaped fields ready for the New Recipe
 *   screen's setters, or null if `raw` isn't usable at all.
 */
export function parseRecipePaste(
  raw,
  { types, glasses, families, tasteTags, aliases = [], glassAliases = [] },
) {
  const item = Array.isArray(raw) ? raw[0] : raw
  if (!item || typeof item !== "object") return null

  const name = typeof item.name === "string" ? item.name.trim() : ""
  const description =
    typeof item.description === "string" ? item.description.trim() : ""

  const glassName = typeof item.glass === "string" ? item.glass.trim() : ""
  const matchedGlass = resolveGlass(glassName, {
    glasses,
    aliases: glassAliases,
  })

  const familyName = item.family ? String(item.family).trim() : ""
  const matchedFamily = familyName
    ? families.find((f) => f.name.toLowerCase() === familyName.toLowerCase())
    : null

  const liquidColor =
    typeof item.liquidColor === "string" && HEX_COLOR_RE.test(item.liquidColor)
      ? item.liquidColor
      : null
  const liquidColor2 =
    typeof item.liquidColor2 === "string" &&
    HEX_COLOR_RE.test(item.liquidColor2)
      ? item.liquidColor2
      : null

  const tasteTagIds = Array.isArray(item.tasteTags)
    ? item.tasteTags
        .map(
          (t) =>
            tasteTags.find(
              (tag) =>
                tag.name.toLowerCase() === String(t).trim().toLowerCase(),
            )?.id,
        )
        .filter(Boolean)
    : []

  const steps = Array.isArray(item.steps)
    ? item.steps
        .filter((s) => typeof s === "string" && s.trim())
        .map((s) => s.trim())
    : []

  const rawComponents = Array.isArray(item.components) ? item.components : []
  const ings = rawComponents.map((c) => {
    const comp = c && typeof c === "object" ? c : {}
    const ingredientNameRaw =
      typeof comp.ingredient === "string" ? comp.ingredient.trim() : ""
    const matched = resolveIngredientType(ingredientNameRaw, {
      types,
      aliases,
    })
    const role = RECIPE_ROLES.includes(comp.role) ? comp.role : "required"
    const unit =
      comp.unit === "ml"
        ? "ml"
        : NON_VOLUME_UNITS.includes(comp.unit)
          ? comp.unit
          : NON_VOLUME_UNITS[0]
    const amount =
      comp.amount !== undefined && comp.amount !== null
        ? String(comp.amount)
        : ""
    return {
      ingredientName: matched ? matched.name : ingredientNameRaw,
      amount,
      unit,
      role,
    }
  })

  return {
    name,
    description,
    glassName: matchedGlass?.name ?? "",
    familyId: matchedFamily?.id ?? "",
    liquidColor,
    liquidColor2,
    tasteTagIds,
    steps: steps.length > 0 ? steps : [""],
    ings:
      ings.length > 0
        ? ings
        : [{ ingredientName: "", amount: "", unit: "ml", role: "required" }],
  }
}
