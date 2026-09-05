import { formatAmount } from "@/domain/availability"
import { scaleIngredientAmount } from "@/domain/servings"

const ROLE_HEADING = { optional: "Optional", garnish: "Garnish" }

// Plain-text rendering of a recipe for pasting into a message/social post -
// deliberately minimal (no markdown, no HTML) since the destination is
// almost always a chat app or a Facebook post, neither of which render
// formatting. Reuses formatAmount() (domain/availability.js) and
// scaleIngredientAmount() (domain/servings.js) so the copied text always
// matches whatever unit (ml/oz) and serving count the screen is currently
// showing, rather than hardcoding either.
export function buildRecipeShareText(c, unit, servings) {
  const lines = [c.name]
  if (c.description) lines.push("", c.description)

  lines.push("", `Servings: ${servings}`)

  lines.push("", "Ingredients:")
  for (const role of ["required", "optional", "garnish"]) {
    const roleIngs = c.ings.filter((i) => i.role === role)
    if (roleIngs.length === 0) continue
    if (ROLE_HEADING[role]) lines.push(`${ROLE_HEADING[role]}:`)
    for (const ri of roleIngs) {
      const scaled = scaleIngredientAmount(ri, servings)
      lines.push(`- ${ri.name ?? ri.ingId} - ${formatAmount(scaled, unit)}`)
    }
  }

  lines.push("", "Preparation:")
  c.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))

  if (c.glass) lines.push("", `Glass: ${c.glass}`)

  return lines.join("\n")
}
