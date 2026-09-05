import { describe, expect, it } from "vitest"
import { formatAmount } from "./availability"
import { scaleIngredientAmount } from "./servings"

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
