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
// automatically. "top-up"/"to taste" are also excluded even when a legacy
// numeric prefix exists (e.g. "1 top-up," a real value found in the live
// catalog) - they're inherently descriptive, not a countable quantity, no
// matter what's stored in front of them. "part"/"parts" is the one unit
// that keeps its own leading number (it's a proportion, not an absolute
// quantity) but still gets re-pluralized.

// Singular/plural pairs for the unit vocabulary this app knows about
// (NON_VOLUME_UNITS, minus "top-up"/"to taste" which are never countable -
// see DESCRIPTIVE_UNITS below). A legacy/free-text unit typed before this
// vocabulary existed (e.g. "leaves", "tsp", "cube" - real values in the
// original seed data) isn't in this table; its number still scales
// correctly, its word is just left exactly as stored.
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

// "top-up"/"to taste" normally never carry a leading number at all (the
// editor/import validator only ever save them bare), so most of the time
// they're excluded from scaling automatically, the same way any other
// no-leading-number label is. This exists for the rarer case where one
// somehow does have a numeric prefix anyway (a real example found live:
// Manhattan Iced Tea's Ice component is stored as "1 top-up") - still never
// scalable, regardless.
const DESCRIPTIVE_UNITS = new Set(["top-up", "to taste"])
function isDescriptiveUnit(word) {
  return DESCRIPTIVE_UNITS.has(word.toLowerCase())
}

// Avoids floating-point artifacts (0.1 * 3 = 0.30000000000000004) and trims
// to at most 2 decimal places - every realistic base amount stays clean
// under integer serving multiplication. NOT reused by domain/parts.js's
// ratio computation - that needs the exact stored value, not a display-
// rounded one (this rounds 1.125 to 1.13, a different number, not merely a
// display simplification of the same one - a real bug once it was reused
// there for something it wasn't designed for).
function round2(n) {
  return Math.round(n * 100) / 100
}

const LEADING_NUMBER_RE = /^(\d+(?:\.\d+)?)\s+(.+)$/

/**
 * Splits a non-ml unitLabel into its leading numeric amount (if any) and
 * unit word - the single source of truth for "does this label have a
 * count," reused by scaleIngredientAmount() below, isManualPartsUnit(), and
 * EditorScreen.jsx's edit-prefill (unitLabelToForm()). A label with no
 * leading number (e.g. "top-up", "to taste") is entirely the unit, with no
 * amount at all - previously each caller re-implemented this split
 * independently, and EditorScreen's version got it wrong for exactly this
 * case (assumed the first whitespace-separated token was always the amount,
 * corrupting "top-up" into "top-up part" on prefill+re-save - see
 * current-context.md for the real corrupted rows this produced).
 *
 * The unit word is normalized to its canonical singular form when it's a
 * known plural (e.g. "2 dashes" -> unit "dash", not "dashes") - real seed
 * data predates this app's unit vocabulary and stored some countable units
 * pre-pluralized; the editor's unit picker only ever offers singular
 * options, so without this an old plural label shows a blank/unmatched
 * Select on edit. An unknown/legacy word outside UNIT_FORMS (e.g. "cube")
 * has no canonical form to normalize to and is returned exactly as stored.
 *
 * @param {string} unitLabel
 * @returns {{ amount: string, unit: string }}
 */
export function parseUnitLabel(unitLabel) {
  const match = unitLabel.match(LEADING_NUMBER_RE)
  if (!match) return { amount: "", unit: unitLabel }
  const [, amount, word] = match
  const forms = FORM_LOOKUP.get(word.toLowerCase())
  return { amount, unit: forms ? forms[0] : word }
}

// Exported for domain/parts.js's mixed-recipe detection: true for a
// manually-authored ratio component like "2 part" - not an ml-stored
// volume, and not a bare descriptive label like "top-up" (which never
// carries a leading number to begin with, so never reaches this check).
export function isManualPartsUnit(unitLabel) {
  return isRatioUnit(parseUnitLabel(unitLabel).unit)
}

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

  const { amount, unit } = parseUnitLabel(recipeIng.unitLabel)
  if (!amount || isDescriptiveUnit(unit)) return recipeIng

  const rawNum = Number(amount)
  const scaledNum = isRatioUnit(unit) ? rawNum : rawNum * servings
  const rounded = round2(scaledNum)

  return { ...recipeIng, unitLabel: `${rounded} ${pluralize(unit, rounded)}` }
}
