import { describe, expect, it } from "vitest"
import { formatAmount } from "./availability"
import { parseUnitLabel, scaleIngredientAmount } from "./servings"

describe("scaleIngredientAmount", () => {
  it("is a no-op at servings=1 for ml, non-volume, and descriptive units", () => {
    const ml = { amount: 30, unitLabel: "ml" }
    const dashes = { amount: 0, unitLabel: "2 dashes" }
    const topUp = { amount: 0, unitLabel: "top-up" }
    expect(scaleIngredientAmount(ml, 1)).toEqual(ml)
    expect(scaleIngredientAmount(dashes, 1)).toEqual(dashes)
    expect(scaleIngredientAmount(topUp, 1)).toEqual(topUp)
  })

  it("scales ml amounts, matching the spec's own examples via formatAmount", () => {
    const gin = { amount: 30, unitLabel: "ml" }
    expect(formatAmount(scaleIngredientAmount(gin, 2), "ml")).toBe("60ml")
    const rum = { amount: 30, unitLabel: "ml" }
    expect(formatAmount(scaleIngredientAmount(rum, 2), "oz")).toBe("2 oz")
  })

  it("scales a numeric non-volume amount and pluralizes: piece -> pieces", () => {
    const result = scaleIngredientAmount({ amount: 0, unitLabel: "1 piece" }, 2)
    expect(result).toEqual({ amount: 0, unitLabel: "2 pieces" })
  })

  it("scales a decimal amount up into a whole one and keeps it singular", () => {
    const result = scaleIngredientAmount(
      { amount: 0, unitLabel: "0.5 slice" },
      2,
    )
    expect(result).toEqual({ amount: 0, unitLabel: "1 slice" })
  })

  it("scales an already-plural stored amount", () => {
    const result = scaleIngredientAmount(
      { amount: 0, unitLabel: "2 dashes" },
      2,
    )
    expect(result).toEqual({ amount: 0, unitLabel: "4 dashes" })
  })

  it("scales grams, an invariant (non-pluralizing) unit", () => {
    const result = scaleIngredientAmount({ amount: 0, unitLabel: "1 g" }, 3)
    expect(result).toEqual({ amount: 0, unitLabel: "3 g" })
  })

  it("scales splash the same way as dash", () => {
    const result = scaleIngredientAmount(
      { amount: 0, unitLabel: "1 splash" },
      2,
    )
    expect(result).toEqual({ amount: 0, unitLabel: "2 splashes" })
  })

  it("avoids floating-point artifacts when rounding", () => {
    const result = scaleIngredientAmount({ amount: 0, unitLabel: "0.1 g" }, 3)
    expect(result).toEqual({ amount: 0, unitLabel: "0.3 g" })
  })

  it("leaves bare descriptive labels with no leading number untouched", () => {
    const topUp = { amount: 0, unitLabel: "top-up" }
    const toTaste = { amount: 0, unitLabel: "to taste" }
    expect(scaleIngredientAmount(topUp, 3)).toEqual(topUp)
    expect(scaleIngredientAmount(toTaste, 3)).toEqual(toTaste)
  })

  it("treats a descriptive unit as non-scalable even with a legacy numeric prefix, at multiple serving counts (Case 2)", () => {
    // Real value found live: Manhattan Iced Tea's Ice component is stored
    // as "1 top-up", not bare "top-up" - it has a leading number, so
    // without this exclusion it would multiply like any other countable
    // unit (e.g. "2 top-up" at 2 servings), which isn't a meaningful
    // quantity for an inherently descriptive "top up the glass" instruction.
    const legacyTopUp = { amount: 0, unitLabel: "1 top-up" }
    expect(scaleIngredientAmount(legacyTopUp, 2)).toEqual(legacyTopUp)
    expect(scaleIngredientAmount(legacyTopUp, 3)).toEqual(legacyTopUp)
    expect(scaleIngredientAmount(legacyTopUp, 12)).toEqual(legacyTopUp)

    const legacyToTaste = { amount: 0, unitLabel: "2 to taste" }
    expect(scaleIngredientAmount(legacyToTaste, 2)).toEqual(legacyToTaste)
  })

  it("never multiplies a part/parts ratio, but still re-pluralizes it", () => {
    const onePart = scaleIngredientAmount({ amount: 0, unitLabel: "1 part" }, 3)
    expect(onePart).toEqual({ amount: 0, unitLabel: "1 part" })
    const twoParts = scaleIngredientAmount(
      { amount: 0, unitLabel: "2 part" },
      2,
    )
    expect(twoParts).toEqual({ amount: 0, unitLabel: "2 parts" })
  })

  it("scales the number of a legacy/free-text unit outside NON_VOLUME_UNITS without touching its word", () => {
    const leaves = scaleIngredientAmount(
      { amount: 0, unitLabel: "8 leaves" },
      2,
    )
    expect(leaves).toEqual({ amount: 0, unitLabel: "16 leaves" })
    const tsp = scaleIngredientAmount({ amount: 0, unitLabel: "2 tsp" }, 2)
    expect(tsp).toEqual({ amount: 0, unitLabel: "4 tsp" })
  })
})

describe("parseUnitLabel", () => {
  it("returns the whole label as the unit, with no amount, for a bare descriptive label", () => {
    expect(parseUnitLabel("top-up")).toEqual({ amount: "", unit: "top-up" })
    expect(parseUnitLabel("to taste")).toEqual({ amount: "", unit: "to taste" })
  })

  it("splits a leading number from the rest for a countable unit", () => {
    expect(parseUnitLabel("2 dash")).toEqual({ amount: "2", unit: "dash" })
    expect(parseUnitLabel("1 cube")).toEqual({ amount: "1", unit: "cube" })
    expect(parseUnitLabel("2 part")).toEqual({ amount: "2", unit: "part" })
  })

  it("normalizes a known plural unit word to its canonical singular form (Case 1: editor round-trip)", () => {
    // Real seed data predates this app's unit vocabulary and stored some
    // countable units pre-pluralized (the actual Old Fashioned recipe's
    // Angostura Bitters is "2 dashes") - the editor's unit picker only ever
    // offers singular options ("dash", not "dashes"), so without this,
    // opening that recipe to edit it showed a blank/unmatched Select.
    expect(parseUnitLabel("2 dashes")).toEqual({ amount: "2", unit: "dash" })
    expect(parseUnitLabel("3 splashes")).toEqual({
      amount: "3",
      unit: "splash",
    })
    expect(parseUnitLabel("2 parts")).toEqual({ amount: "2", unit: "part" })
  })

  it("leaves an unknown/legacy unit word unchanged - no canonical singular form exists for it", () => {
    expect(parseUnitLabel("8 leaves")).toEqual({ amount: "8", unit: "leaves" })
  })

  it("preserves the quantity through a full editor save round-trip even though the word normalizes (Case 1)", () => {
    // Simulates EditorScreen.jsx's handleSave() reconstruction
    // (`${amount} ${unit}`.trim()) on top of the normalized prefill - the
    // *quantity* must survive exactly; the word is expected to become
    // singular on save (matches what selecting "dash" from the dropdown
    // for a brand new entry has always produced - see docs/project.md's
    // Follow-ups for the pre-existing, unrelated pluralize-at-save-time
    // note this doesn't change).
    const { amount, unit } = parseUnitLabel("2 dashes")
    expect(`${amount} ${unit}`.trim()).toBe("2 dash")
  })

  it("regression: round-tripping 'top-up' through the editor's parse-then-reconstruct never fabricates 'top-up part'", () => {
    // The real bug (found live, corrupted 5 real recipe_components rows):
    // EditorScreen.jsx's unitLabelToForm() used to split "top-up" as
    // amount="top-up" + unit falling back to the first NON_VOLUME_UNITS
    // entry ("part") - a blind re-save then wrote "top-up part" back to
    // storage via the exact `${amount} ${unit}`.trim() reconstruction
    // EditorScreen.jsx's handleSave() uses. This locks in the fix: parsing
    // then reconstructing via that same pattern must return the original
    // label unchanged, for every bare non-volume unit, not just "top-up".
    for (const label of ["top-up", "to taste"]) {
      const { amount, unit } = parseUnitLabel(label)
      const reconstructed = `${amount} ${unit}`.trim()
      expect(reconstructed).toBe(label)
    }
  })
})
