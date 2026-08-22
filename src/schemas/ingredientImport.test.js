import { describe, expect, it } from "vitest"
import {
  buildIngredientImportPrompt,
  validateIngredientImport,
} from "./ingredientImport"

const categories = [
  { id: "cat-spirit", name: "Spirit" },
  { id: "cat-juice", name: "Juice" },
]
const types = [
  { id: "type-rum", name: "Rum", category_id: "cat-spirit" },
  { id: "type-gin", name: "Gin", category_id: "cat-spirit" },
  { id: "type-lime", name: "Lime Juice", category_id: "cat-juice" },
]
const catalog = { categories, types }

describe("validateIngredientImport", () => {
  it("accepts a minimal valid item and resolves defaults", () => {
    const { results, validCount, errorCount } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit" }],
      catalog,
    )
    expect(validCount).toBe(1)
    expect(errorCount).toBe(0)
    expect(results[0].resolved).toEqual({
      name: "Cachaca",
      category_id: "cat-spirit",
      parent_type_id: null,
      color: null,
      bar_priority: "common",
      description: null,
    })
  })

  it("resolves a valid parentType within the same category", () => {
    const { results } = validateIngredientImport(
      [{ name: "Spiced Rum", category: "Spirit", parentType: "Rum" }],
      catalog,
    )
    expect(results[0].valid).toBe(true)
    expect(results[0].resolved.parent_type_id).toBe("type-rum")
  })

  it("rejects a missing name", () => {
    const { results } = validateIngredientImport(
      [{ category: "Spirit" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain("Missing name")
  })

  it("rejects a name that already exists in the catalog (case-insensitive)", () => {
    const { results } = validateIngredientImport(
      [{ name: "rum", category: "Spirit" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(/already exists/)
  })

  it("rejects a duplicate name within the same import batch", () => {
    const { results } = validateIngredientImport(
      [
        { name: "Cachaca", category: "Spirit" },
        { name: "cachaca", category: "Spirit" },
      ],
      catalog,
    )
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(false)
    expect(results[1].errors[0]).toMatch(/Duplicate/)
  })

  it("rejects an unknown category", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Nonsense" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain('Unknown category "Nonsense"')
  })

  it("rejects an unknown parentType", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit", parentType: "Nope" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain('Unknown parentType "Nope"')
  })

  it("rejects a parentType from a different category", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit", parentType: "Lime Juice" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(/is not in category/)
  })

  it("rejects an invalid barPriority", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit", barPriority: "urgent" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(/Invalid barPriority/)
  })

  it("rejects an invalid color", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit", color: "orange" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(/Invalid color/)
  })

  it("accepts a valid hex color", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit", color: "#a1b2c3" }],
      catalog,
    )
    expect(results[0].valid).toBe(true)
    expect(results[0].resolved.color).toBe("#a1b2c3")
  })

  it("handles a non-object item without throwing", () => {
    const { results } = validateIngredientImport(["oops"], catalog)
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain("Missing name")
  })

  it("rejects a name that already resolves to an existing type via an alias", () => {
    const { results } = validateIngredientImport(
      [{ name: "Cachaca", category: "Spirit" }],
      {
        ...catalog,
        aliases: [{ alias: "Cachaca", ingredient_type_id: "type-rum" }],
      },
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(
      /already resolves to "Rum" via an existing alias/,
    )
  })

  it("resolves a parentType given as a known alias", () => {
    const { results } = validateIngredientImport(
      [{ name: "Spiced Rum", category: "Spirit", parentType: "Ron" }],
      {
        ...catalog,
        aliases: [{ alias: "Ron", ingredient_type_id: "type-rum" }],
      },
    )
    expect(results[0].valid).toBe(true)
    expect(results[0].resolved.parent_type_id).toBe("type-rum")
  })
})

describe("buildIngredientImportPrompt", () => {
  it("lists every category and its types", () => {
    const prompt = buildIngredientImportPrompt(catalog)
    expect(prompt).toContain("Spirit")
    expect(prompt).toContain("Juice")
    expect(prompt).toContain("Gin, Rum")
    expect(prompt).toContain("Lime Juice")
  })

  it("names all allowed bar priorities", () => {
    const prompt = buildIngredientImportPrompt(catalog)
    expect(prompt).toContain("essential, common, specialized, niche")
  })

  it("annotates a type with its known aliases", () => {
    const prompt = buildIngredientImportPrompt({
      ...catalog,
      aliases: [{ alias: "Ron", ingredient_type_id: "type-rum" }],
    })
    expect(prompt).toContain("Rum (also known as: Ron)")
  })
})
