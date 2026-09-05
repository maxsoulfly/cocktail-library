import { formatAmount } from "@/domain/availability"
import {
  computePartsRatio,
  formatPartsAmount,
  hasConflictingPartsUnits,
  PARTS_MODE_CONFLICT_EXPLANATION,
  PARTS_MODE_EXPLANATION,
} from "@/domain/parts"
import { scaleIngredientAmount } from "@/domain/servings"

const ROLE_HEADING = { optional: "Optional", garnish: "Garnish" }

// Plain-text rendering of a recipe for pasting into a message/social post -
// deliberately minimal (no markdown, no HTML) since the destination is
// almost always a chat app or a Facebook post, neither of which render
// formatting. Reuses formatAmount()/scaleIngredientAmount()/parts.js's ratio
// helpers so the copied text always matches whatever unit (ml/oz/parts) and
// serving count the screen is currently showing, rather than hardcoding any
// of them - including the same mixed-recipe fallback IngredientsSection.jsx
// uses, so the two never disagree about what a given recipe should show.
export function buildRecipeShareText(c, unit, servings, partsMode) {
  const lines = [c.name]
  if (c.description) lines.push("", c.description)

  const mixedConflict = partsMode && hasConflictingPartsUnits(c.ings)
  const showRatios = partsMode && !mixedConflict
  // Parts mode always shows the base (1-serving) recipe - matches the UI,
  // where the servings selector itself is hidden while parts mode is
  // active, so a serving count the user can no longer see or change must
  // never silently affect what's copied either. `Servings: N` is dropped
  // entirely rather than printing a stale/misleading number.
  const displayServings = partsMode ? 1 : servings

  if (partsMode) {
    lines.push(
      "",
      mixedConflict ? PARTS_MODE_CONFLICT_EXPLANATION : PARTS_MODE_EXPLANATION,
    )
  } else {
    lines.push("", `Servings: ${servings}`)
  }

  const partsRatios = showRatios ? computePartsRatio(c.ings) : null
  const ratioByIng = partsRatios
    ? new Map(c.ings.map((ri, i) => [ri, partsRatios[i]]))
    : null

  lines.push("", "Ingredients:")
  for (const role of ["required", "optional", "garnish"]) {
    const roleIngs = c.ings.filter((i) => i.role === role)
    if (roleIngs.length === 0) continue
    if (ROLE_HEADING[role]) lines.push(`${ROLE_HEADING[role]}:`)
    for (const ri of roleIngs) {
      const ratio = ratioByIng?.get(ri)
      const amountText =
        ratio != null
          ? formatPartsAmount(ratio)
          : formatAmount(scaleIngredientAmount(ri, displayServings), unit)
      lines.push(`- ${ri.name ?? ri.ingId} - ${amountText}`)
    }
  }

  lines.push("", "Preparation:")
  c.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))

  if (c.glass) lines.push("", `Glass: ${c.glass}`)

  return lines.join("\n")
}
