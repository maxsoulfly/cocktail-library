// Pure, framework-free "parts" ratio computation - Stage 3 of the
// serving-size/parts feature (see current-context.md for the full design).
// Turns a recipe's stored ml amounts into a reduced integer ratio for
// display (e.g. 60ml rum + 30ml lime -> 2 parts : 1 part), without touching
// the stored recipe and without inventing a "1 part = N ml" value anywhere.
//
// Only components with unitLabel === "ml" participate - everything else
// (dash, piece, top-up, an already-manually-typed "part" component, ...)
// keeps rendering exactly as it already does elsewhere in the app; this
// module has nothing to say about those and returns null for them.
//
// The ratio is computed by exact integer GCD reduction, not a fuzzy/
// tolerance-snapped approximation - a recipe whose proportions genuinely
// don't share a large common factor gets an honest, unreduced ratio rather
// than a fabricated "nicer" one. This is deliberate (see current-context.md/
// docs/project.md's Decisions) and mathematically guarantees the ratio is
// invariant under uniform scaling (gcd(k*a, k*b) = k*gcd(a,b)) - so it's
// always computed from the recipe's base (1-serving) stored amounts and
// never needs recomputing per serving count.

function gcd(a, b) {
  let x = a
  let y = b
  while (y !== 0) {
    ;[x, y] = [y, x % y]
  }
  return x
}

// Reads decimal places off the raw amount's own string form - NOT via
// src/domain/servings.js's round2(), which exists to tidy already-scaled
// *display* numbers to 2dp and would silently discard real precision here
// (round2(1.125) = 1.13, a different number, not just a rounded display of
// the same one - caught in review before this ever shipped). JS's Number-
// to-String conversion always produces the shortest decimal string that
// parses back to the exact same value, so this faithfully reflects the
// amount's true stored precision, whatever it is - clearing decimals by
// scaling to an integer before reducing keeps the ratio exact, per this
// feature's explicit "no approximation" design.
function decimalPlaces(n) {
  const s = String(n)
  const i = s.indexOf(".")
  return i === -1 ? 0 : s.length - i - 1
}

/**
 * @param {{ amount: number, unitLabel: string }[]} components - a recipe's
 *   components, in any order/shape formatAmount() already consumes
 * @returns {(number|null)[]} one entry per input component, same order/
 *   length - the reduced integer ratio value for an ml-stored component
 *   with a positive amount, or null for anything else
 */
export function computePartsRatio(components) {
  const volumeIndices = []
  const volumeAmounts = []
  components.forEach((c, i) => {
    if (c.unitLabel === "ml" && c.amount > 0) {
      volumeIndices.push(i)
      volumeAmounts.push(c.amount)
    }
  })

  const result = components.map(() => null)
  if (volumeAmounts.length === 0) return result

  const maxDecimals = Math.max(...volumeAmounts.map(decimalPlaces))
  const scale = 10 ** maxDecimals
  // Math.round here is a defensive guard against float-multiplication noise
  // (e.g. 1.125 * 1000 landing a fraction of a unit off in binary) - by
  // construction, scale already exactly clears every decimal place present
  // in each amount's own string form, so this never discards real precision.
  const scaledInts = volumeAmounts.map((a) => Math.round(a * scale))

  const divisor = scaledInts.reduce((acc, n) => gcd(acc, n), scaledInts[0])
  const ratios = scaledInts.map((n) => n / divisor)

  volumeIndices.forEach((idx, i) => {
    result[idx] = ratios[i]
  })
  return result
}
