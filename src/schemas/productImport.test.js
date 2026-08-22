import { describe, expect, it } from "vitest"
import {
  buildProductImportPrompt,
  validateProductImport,
} from "./productImport"

const types = [
  { id: "type-gin", name: "Gin" },
  { id: "type-vodka", name: "Vodka" },
]
const catalog = { types }

describe("validateProductImport", () => {
  it("accepts a minimal valid item and resolves defaults", () => {
    const { results, validCount, errorCount } = validateProductImport(
      [{ name: "Tanqueray", ingredientType: "Gin" }],
      catalog,
    )
    expect(validCount).toBe(1)
    expect(errorCount).toBe(0)
    expect(results[0].resolved).toEqual({
      name: "Tanqueray",
      ingredient_type_id: "type-gin",
      brand: null,
      is_homemade: false,
    })
  })

  it("accepts an optional brand and isHomemade", () => {
    const { results } = validateProductImport(
      [
        {
          name: "Homemade Grenadine",
          ingredientType: "Gin",
          brand: "Kitchen",
          isHomemade: true,
        },
      ],
      catalog,
    )
    expect(results[0].resolved.brand).toBe("Kitchen")
    expect(results[0].resolved.is_homemade).toBe(true)
  })

  it("rejects a missing name", () => {
    const { results } = validateProductImport(
      [{ ingredientType: "Gin" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain("Missing name")
  })

  it("rejects a missing ingredientType", () => {
    const { results } = validateProductImport([{ name: "Tanqueray" }], catalog)
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain("Missing ingredientType")
  })

  it("rejects an unknown ingredientType (no fuzzy matching)", () => {
    const { results } = validateProductImport(
      [{ name: "Tanqueray", ingredientType: "Jin" }],
      catalog,
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain('Unknown ingredientType "Jin"')
  })

  it("rejects a product already existing under the same type (case-insensitive)", () => {
    const { results } = validateProductImport(
      [{ name: "tanqueray", ingredientType: "Gin" }],
      {
        types,
        existingProducts: [
          { name: "Tanqueray", ingredient_type_id: "type-gin" },
        ],
      },
    )
    expect(results[0].valid).toBe(false)
    expect(results[0].errors[0]).toMatch(/already exists/)
  })

  it("allows the same product name under a different type", () => {
    const { results } = validateProductImport(
      [{ name: "Absolut", ingredientType: "Vodka" }],
      {
        types,
        existingProducts: [{ name: "Absolut", ingredient_type_id: "type-gin" }],
      },
    )
    expect(results[0].valid).toBe(true)
  })

  it("rejects a duplicate name+type within the same import batch", () => {
    const { results } = validateProductImport(
      [
        { name: "Tanqueray", ingredientType: "Gin" },
        { name: "tanqueray", ingredientType: "gin" },
      ],
      catalog,
    )
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(false)
    expect(results[1].errors[0]).toMatch(/Duplicate/)
  })

  it("handles a non-object item without throwing", () => {
    const { results } = validateProductImport(["oops"], catalog)
    expect(results[0].valid).toBe(false)
    expect(results[0].errors).toContain("Missing name")
  })

  it("resolves ingredientType given as a known alias", () => {
    const { results } = validateProductImport(
      [{ name: "Tanqueray", ingredientType: "London Dry" }],
      {
        ...catalog,
        aliases: [{ alias: "London Dry", ingredient_type_id: "type-gin" }],
      },
    )
    expect(results[0].valid).toBe(true)
    expect(results[0].resolved.ingredient_type_id).toBe("type-gin")
  })
})

describe("buildProductImportPrompt", () => {
  it("lists every ingredient type", () => {
    const prompt = buildProductImportPrompt(catalog)
    expect(prompt).toContain("Gin")
    expect(prompt).toContain("Vodka")
  })

  it("annotates a type with its known aliases", () => {
    const prompt = buildProductImportPrompt({
      ...catalog,
      aliases: [{ alias: "London Dry", ingredient_type_id: "type-gin" }],
    })
    expect(prompt).toContain("Gin (also known as: London Dry)")
  })
})
