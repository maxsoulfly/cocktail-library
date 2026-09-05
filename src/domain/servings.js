// Pure, framework-free serving-size scaling. Takes a stored recipe_component
// (amount/unitLabel, exactly the shape src/domain/availability.js's
// formatAmount() consumes) and a serving count, returns a new plain object
// with the same shape scaled for display - the stored recipe is never
// touched. Compose with formatAmount() for final ml/oz rendering:
// formatAmount(scaleIngredientAmount(ri, servings), unit).
//
// Non-volume components encode their quantity inside unitLabel itself (e.g.
// "2 dashes", amount is unused/0 - see the recipe_components.amount column
// comment in supabase/migrations/20260815214307_recipes_schema.sql). Scaling
// those means parsing the leading number back out, multiplying it, and
// re-pluralizing the unit word - anything with NO leading number ("top-up",
// "to taste") simply never matches the parse and passes through unscaled,
// automatically, with no separate non-scalable list to maintain. "part"/
// "parts" is the one unit that keeps its own leading number (it's a
// proportion, not an absolute quantity) but still gets re-pluralized.

// Singular/plural pairs for the unit vocabulary this app knows about
// (NON_VOLUME_UNITS, minus "top-up"/"to taste" which never carry a leading
// number and so never reach the pluralization step). A legacy/free-text unit
// typed before this vocabulary existed (e.g. "leaves", "tsp", "cube" - real
// values in the original seed data) isn't in this table; its number still
// scales correctly, its word is just left exactly as stored.
const UNIT_FORMS = [
  ["dash", "dashes"],
  ["barspoon", "barspoons"],
  ["piece", "pieces"],
  ["slice", "slices"],
  ["wedge", "wedges"],
  ["splash", "splashes"],
  ["part", "parts"],
  ["g", "g"],
]

const FORM_LOOKUP = new Map()
UNIT_FORMS.forEach(([singular, plural]) => {
  FORM_LOOKUP.set(singular, [singular, plural])
  FORM_LOOKUP.set(plural, [singular, plural])
})

function pluralize(word, count) {
  const forms = FORM_LOOKUP.get(word.toLowerCase())
  if (!forms) return word
  const [singular, plural] = forms
  return count === 1 ? singular : plural
}

function isRatioUnit(word) {
  const lower = word.toLowerCase()
  return lower === "part" || lower === "parts"
}

// Avoids floating-point artifacts (0.1 * 3 = 0.30000000000000004) and trims
// to at most 2 decimal places - every realistic base amount stays clean
// under integer serving multiplication.
function round2(n) {
  return Math.round(n * 100) / 100
}

const LEADING_NUMBER_RE = /^(\d+(?:\.\d+)?)\s+(.+)$/

/**
 * @param {{ amount: number, unitLabel: string }} recipeIng
 * @param {number} servings - positive integer, 1 = no-op (returns recipeIng
 *   unchanged, guaranteeing zero behavior change when nothing is scaled)
 * @returns {{ amount: number, unitLabel: string }}
 */
export function scaleIngredientAmount(recipeIng, servings) {
  if (servings === 1) return recipeIng

  if (recipeIng.unitLabel === "ml") {
    return { ...recipeIng, amount: recipeIng.amount * servings }
  }

  const match = recipeIng.unitLabel.match(LEADING_NUMBER_RE)
  if (!match) return recipeIng

  const [, numStr, word] = match
  const rawNum = Number(numStr)
  const scaledNum = isRatioUnit(word) ? rawNum : rawNum * servings
  const rounded = round2(scaledNum)

  return { ...recipeIng, unitLabel: `${rounded} ${pluralize(word, rounded)}` }
}
