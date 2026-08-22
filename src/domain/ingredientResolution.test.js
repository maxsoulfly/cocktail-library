import { describe, expect, it } from "vitest"
import { resolveIngredientType } from "./ingredientResolution"

const types = [
  { id: "type-triple-sec", name: "Triple Sec" },
  { id: "type-gin", name: "Gin" },
]
const aliases = [
  { alias: "Sec", ingredient_type_id: "type-triple-sec" },
  { alias: "Curaçao", ingredient_type_id: "type-triple-sec" },
]

describe("resolveIngredientType", () => {
  it("resolves an exact canonical name, case-insensitive", () => {
    expect(resolveIngredientType("gin", { types, aliases })).toEqual(types[1])
  })

  it("resolves via an alias, case-insensitive", () => {
    expect(resolveIngredientType("sec", { types, aliases })).toEqual(types[0])
  })

  it("prefers a canonical name match over an alias with the same text", () => {
    const shadowed = [{ alias: "Gin", ingredient_type_id: "type-triple-sec" }]
    expect(resolveIngredientType("Gin", { types, aliases: shadowed })).toEqual(
      types[1],
    )
  })

  it("returns null for no match", () => {
    expect(resolveIngredientType("Vodka", { types, aliases })).toBeNull()
  })

  it("returns null for blank input without throwing", () => {
    expect(resolveIngredientType("  ", { types, aliases })).toBeNull()
  })

  it("works with no aliases provided at all", () => {
    expect(resolveIngredientType("Gin", { types })).toEqual(types[1])
  })

  it("doesn't throw if an alias points at a since-deleted type", () => {
    const dangling = [{ alias: "Ghost", ingredient_type_id: "nope" }]
    expect(
      resolveIngredientType("Ghost", { types, aliases: dangling }),
    ).toBeNull()
  })
})
