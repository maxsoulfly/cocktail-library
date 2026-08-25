import { describe, expect, it } from "vitest"
import { NON_VOLUME_UNITS } from "@/data/constants"
import { parseRecipePaste } from "./recipePaste"

const types = [
  { id: "type-gin", name: "Gin" },
  { id: "type-vermouth", name: "Dry Vermouth" },
]
const glasses = [{ id: "glass-martini", name: "Martini" }]
const families = [{ id: "fam-stirred", name: "Stirred" }]
const tasteTags = [{ id: "tag-dry", name: "Dry" }]
const catalog = { types, glasses, families, tasteTags }

const validItem = {
  name: "Martini",
  description: "Classic.",
  glass: "Martini",
  family: "Stirred",
  liquidColor: "#dbeafe",
  tasteTags: ["Dry"],
  steps: ["Stir.", "Strain."],
  components: [
    { ingredient: "Gin", amount: 60, unit: "ml", role: "required" },
    { ingredient: "Dry Vermouth", amount: 10, unit: "ml" },
  ],
}

describe("parseRecipePaste", () => {
  it("maps a fully-resolvable recipe into form-shaped fields", () => {
    const result = parseRecipePaste(validItem, catalog)
    expect(result).toEqual({
      name: "Martini",
      description: "Classic.",
      glassName: "Martini",
      familyId: "fam-stirred",
      liquidColor: "#dbeafe",
      liquidColor2: null,
      tasteTagIds: ["tag-dry"],
      steps: ["Stir.", "Strain."],
      ings: [
        { ingredientName: "Gin", amount: "60", unit: "ml", role: "required" },
        {
          ingredientName: "Dry Vermouth",
          amount: "10",
          unit: "ml",
          role: "required",
        },
      ],
    })
  })

  it("takes the first element when given an array", () => {
    const result = parseRecipePaste([validItem, { name: "Second" }], catalog)
    expect(result.name).toBe("Martini")
  })

  it("returns null for unusable input", () => {
    expect(parseRecipePaste(null, catalog)).toBeNull()
    expect(parseRecipePaste("just text", catalog)).toBeNull()
    expect(parseRecipePaste([], catalog)).toBeNull()
  })

  it("passes an unresolved ingredient through as typed text instead of rejecting the recipe", () => {
    const result = parseRecipePaste(
      {
        ...validItem,
        components: [{ ingredient: "Pineapple", amount: 50, unit: "g" }],
      },
      catalog,
    )
    expect(result.ings).toEqual([
      {
        ingredientName: "Pineapple",
        amount: "50",
        unit: "g",
        role: "required",
      },
    ])
  })

  it("resolves an ingredient given as a known alias", () => {
    const result = parseRecipePaste(
      {
        ...validItem,
        components: [{ ingredient: "London Dry", amount: 60, unit: "ml" }],
      },
      {
        ...catalog,
        aliases: [{ alias: "London Dry", ingredient_type_id: "type-gin" }],
      },
    )
    expect(result.ings[0].ingredientName).toBe("Gin")
  })

  it("leaves glass/family blank when unmatched rather than failing", () => {
    const result = parseRecipePaste(
      { ...validItem, glass: "Snifter", family: "Sours" },
      catalog,
    )
    expect(result.glassName).toBe("")
    expect(result.familyId).toBe("")
    expect(result.name).toBe("Martini")
  })

  it("ignores an invalid liquidColor rather than failing", () => {
    const result = parseRecipePaste(
      { ...validItem, liquidColor: "blue" },
      catalog,
    )
    expect(result.liquidColor).toBeNull()
  })

  it("resolves an optional liquidColor2 for a layered/gradient drink", () => {
    const result = parseRecipePaste(
      { ...validItem, liquidColor2: "#f97316" },
      catalog,
    )
    expect(result.liquidColor2).toBe("#f97316")
  })

  it("ignores an invalid liquidColor2 rather than failing", () => {
    const result = parseRecipePaste(
      { ...validItem, liquidColor2: "orange" },
      catalog,
    )
    expect(result.liquidColor2).toBeNull()
  })

  it("accepts an 8-digit hex color with alpha (e.g. the 'Clear' swatch)", () => {
    const result = parseRecipePaste(
      { ...validItem, liquidColor: "#dbeafe80" },
      catalog,
    )
    expect(result.liquidColor).toBe("#dbeafe80")
  })

  it("ignores unknown taste tags rather than failing", () => {
    const result = parseRecipePaste(
      { ...validItem, tasteTags: ["Dry", "Bitter"] },
      catalog,
    )
    expect(result.tasteTagIds).toEqual(["tag-dry"])
  })

  it("falls back to a blank ingredient row when there are no components", () => {
    const result = parseRecipePaste({ ...validItem, components: [] }, catalog)
    expect(result.ings).toEqual([
      { ingredientName: "", amount: "", unit: "ml", role: "required" },
    ])
  })

  it("falls back to one blank step when there are no steps", () => {
    const result = parseRecipePaste({ ...validItem, steps: [] }, catalog)
    expect(result.steps).toEqual([""])
  })

  it("defaults an unrecognized unit to the first non-volume unit rather than misrepresenting it as ml", () => {
    const result = parseRecipePaste(
      {
        ...validItem,
        components: [{ ingredient: "Gin", amount: 2, unit: "cl" }],
      },
      catalog,
    )
    expect(result.ings[0].unit).toBe(NON_VOLUME_UNITS[0])
  })
})
