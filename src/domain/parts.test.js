import { describe, expect, it } from "vitest"
import { computePartsRatio } from "./parts"

function ml(amount) {
  return { amount, unitLabel: "ml" }
}
function nonVolume(unitLabel) {
  return { amount: 0, unitLabel }
}

describe("computePartsRatio", () => {
  it("reduces a simple recipe to a small integer ratio (the spec's own example)", () => {
    const result = computePartsRatio([ml(60), ml(30)])
    expect(result).toEqual([2, 1])
  })

  it("gives a single-component recipe a ratio of 1", () => {
    const result = computePartsRatio([ml(60)])
    expect(result).toEqual([1])
  })

  it("reduces three components sharing a common factor", () => {
    const result = computePartsRatio([ml(45), ml(30), ml(15)])
    expect(result).toEqual([3, 2, 1])
  })

  it("handles decimal ml amounts exactly, not approximately", () => {
    const result = computePartsRatio([ml(22.5), ml(60), ml(30)])
    expect(result).toEqual([3, 8, 4])
  })

  it("preserves precision beyond 2 decimal places rather than display-rounding it away", () => {
    // Regression: an earlier version reused servings.js's round2() (meant
    // for tidying already-scaled *display* numbers to 2dp) to normalize
    // amounts before reduction. round2(1.125) = 1.13 - a different number,
    // not a rounded display of the same one - which silently turned this
    // exact 1:2 ratio into gcd(113, 225) = 1, i.e. an unreduced [113, 225].
    const result = computePartsRatio([ml(1.125), ml(2.25)])
    expect(result).toEqual([1, 2])
  })

  it("does not fabricate a prettier ratio when amounts share no large common factor", () => {
    // gcd(7, 22) = 1 - stays exactly as-is, an honest (if less tidy) ratio.
    const result = computePartsRatio([ml(7), ml(22)])
    expect(result).toEqual([7, 22])
  })

  it("returns null for every component when there are no ml-stored amounts", () => {
    const result = computePartsRatio([
      nonVolume("2 dashes"),
      nonVolume("top-up"),
    ])
    expect(result).toEqual([null, null])
  })

  it("returns null only for non-ml components in a mixed recipe, preserving order", () => {
    const result = computePartsRatio([
      ml(60),
      nonVolume("2 dashes"),
      ml(30),
      nonVolume("top-up"),
    ])
    expect(result).toEqual([2, null, 1, null])
  })

  it("excludes a zero/non-positive ml amount rather than letting it poison the ratio", () => {
    const result = computePartsRatio([ml(60), ml(0), ml(30)])
    expect(result).toEqual([2, null, 1])
  })

  it("is invariant under uniform scaling, matching a recipe scaled to 2 servings", () => {
    const base = computePartsRatio([ml(60), ml(30)])
    const scaledTo2Servings = computePartsRatio([ml(120), ml(60)])
    expect(scaledTo2Servings).toEqual(base)
  })
})
