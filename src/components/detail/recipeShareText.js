import { formatAmount } from "@/domain/availability"

const ROLE_HEADING = { optional: "Optional", garnish: "Garnish" }

// Plain-text rendering of a recipe for pasting into a message/social post -
// deliberately minimal (no markdown, no HTML) since the destination is
// almost always a chat app or a Facebook post, neither of which render
// formatting. Reuses formatAmount() (domain/availability.js) so the copied
// text always matches whatever unit (ml/oz) the screen is currently
// showing, rather than hardcoding one.
export function buildRecipeShareText(c, unit) {
  const lines = [c.name]
  if (c.description) lines.push("", c.description)

  lines.push("", "Ingredients:")
  for (const role of ["required", "optional", "garnish"]) {
    const roleIngs = c.ings.filter((i) => i.role === role)
    if (roleIngs.length === 0) continue
    if (ROLE_HEADING[role]) lines.push(`${ROLE_HEADING[role]}:`)
    for (const ri of roleIngs) {
      lines.push(`- ${ri.name ?? ri.ingId} - ${formatAmount(ri, unit)}`)
    }
  }

  lines.push("", "Preparation:")
  c.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))

  if (c.glass) lines.push("", `Glass: ${c.glass}`)

  return lines.join("\n")
}
