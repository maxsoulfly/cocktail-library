import { describe, expect, it } from "vitest"
import { buildRecipeShareText } from "./recipeShareText"

function recipe(ings) {
  return {
    name: "Old Fashioned",
    description: "",
    ings,
    steps: ["Stir with ice.", "Strain into a rocks glass."],
    glass: "Rocks Glass",
  }
}

const bourbon = {
  ingId: "bourbon",
  name: "Bourbon",
  role: "required",
  amount: 60,
  unitLabel: "ml",
}
const bitters = {
  ingId: "bitters",
  name: "Angostura Bitters",
  role: "required",
  amount: 0,
  unitLabel: "2 dashes",
}
const gin = {
  ingId: "gin",
  name: "Gin",
  role: "required",
  amount: 60,
  unitLabel: "ml",
}
const vermouth = {
  ingId: "vermouth",
  name: "Sweet Vermouth",
  role: "required",
  amount: 30,
  unitLabel: "ml",
}
const manualPart = {
  ingId: "syrup",
  name: "Syrup",
  role: "required",
  amount: 0,
  unitLabel: "1 part",
}

describe("buildRecipeShareText", () => {
  it("includes Servings: N and scales quantities when parts mode is off (unchanged Stage 2 behavior)", () => {
    const text = buildRecipeShareText(
      recipe([bourbon, bitters]),
      "ml",
      3,
      false,
    )
    expect(text).toContain("Servings: 3")
    expect(text).toContain("Bourbon - 180ml")
    expect(text).toContain("Angostura Bitters - 6 dashes")
  })

  it("shows the ratio for ml ingredients and base (1-serving) amounts for non-volume ones in parts mode, regardless of the hidden serving count", () => {
    const text = buildRecipeShareText(
      recipe([gin, vermouth, bitters]),
      "ml",
      3,
      true,
    )
    expect(text).toContain("Gin - 2 parts")
    expect(text).toContain("Sweet Vermouth - 1 part")
    // Bitters is non-volume: must stay at the base 2 dashes, NOT scaled by
    // the hidden servings=3 - the whole point of this behavior.
    expect(text).toContain("Angostura Bitters - 2 dashes")
  })

  it("omits the Servings line and explains the base-recipe caveat in parts mode", () => {
    const text = buildRecipeShareText(recipe([gin, vermouth]), "ml", 3, true)
    expect(text).not.toContain("Servings:")
    expect(text).toContain("base recipe (1 serving)")
  })

  it("falls back to plain ml/oz at the base serving for a mixed ml+manual-part recipe, never merging the two scales", () => {
    const text = buildRecipeShareText(recipe([gin, manualPart]), "ml", 3, true)
    // Gin must show as a base-serving ml amount (60ml, not 180ml), not a
    // fabricated ratio against the unrelated manually-typed "part".
    expect(text).toContain("Gin - 60ml")
    expect(text).toContain("Syrup - 1 part")
    expect(text).not.toContain("Gin - 1 part")
    expect(text).not.toContain("Gin - 2 parts")
    expect(text).toContain("no single common part size")
  })
})
