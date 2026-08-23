import { describe, expect, it } from "vitest"
import {
  computeAvail,
  formatAmount,
  mlToOz,
  resolveOwnedIngredientTypes,
} from "./availability"

function component(overrides) {
  return {
    ingId: "gin",
    alternativeIds: [],
    amount: 30,
    unitLabel: "ml",
    role: "required",
    ...overrides,
  }
}

describe("computeAvail", () => {
  it("is perfect when every required, optional, and garnish component is owned", () => {
    const cocktail = {
      ings: [
        component({ ingId: "gin", role: "required" }),
        component({ ingId: "lime", role: "optional" }),
        component({ ingId: "mint", role: "garnish" }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["gin", "lime", "mint"]))
    expect(result.avail).toBe("perfect")
    expect(result.missingRequired).toEqual([])
    expect(result.missingOptional).toEqual([])
  })

  it("is good_enough when every required component is owned but optional/garnish are missing", () => {
    const cocktail = {
      ings: [
        component({ ingId: "gin", role: "required" }),
        component({ ingId: "lime", role: "optional" }),
        component({ ingId: "mint", role: "garnish" }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["gin"]))
    expect(result.avail).toBe("good")
    expect(result.missingRequired).toEqual([])
    expect(result.missingOptional).toEqual(["lime", "mint"])
    expect(result.missingOptionalIds).toEqual(["lime", "mint"])
  })

  it("is almost when exactly one required component is missing", () => {
    const cocktail = {
      ings: [
        component({ ingId: "gin", role: "required" }),
        component({ ingId: "vermouth", role: "required" }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["gin"]))
    expect(result.avail).toBe("almost")
    expect(result.missingRequired).toEqual(["vermouth"])
    expect(result.missingRequiredIds).toEqual(["vermouth"])
  })

  it("is unavailable when two or more required components are missing", () => {
    const cocktail = {
      ings: [
        component({ ingId: "gin", role: "required" }),
        component({ ingId: "vermouth", role: "required" }),
        component({ ingId: "campari", role: "required" }),
      ],
    }
    const result = computeAvail(cocktail, new Set())
    expect(result.avail).toBe("unavail")
    expect(result.missingRequired).toHaveLength(3)
  })

  it("satisfies a required component via a substitution alternative", () => {
    const cocktail = {
      ings: [
        component({
          ingId: "gin",
          alternativeIds: ["vodka"],
          role: "required",
        }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["vodka"]))
    expect(result.avail).toBe("perfect")
    expect(result.missingRequired).toEqual([])
  })

  it("records which substitution alternative satisfied a component", () => {
    const cocktail = {
      ings: [
        component({
          ingId: "gin",
          alternativeIds: ["vodka"],
          role: "required",
        }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["vodka"]), (id) =>
      id === "vodka" ? "Vodka" : id,
    )
    expect(result.substitutions).toEqual({
      gin: { matchedId: "vodka", matchedName: "Vodka" },
    })
  })

  it("does not record a substitution when the primary ingredient itself is owned", () => {
    const cocktail = {
      ings: [
        component({
          ingId: "gin",
          alternativeIds: ["vodka"],
          role: "required",
        }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["gin", "vodka"]))
    expect(result.substitutions).toEqual({})
  })

  it("still reports the primary ingredient as missing when no alternative is owned either", () => {
    const cocktail = {
      ings: [
        component({
          ingId: "gin",
          alternativeIds: ["vodka"],
          role: "required",
        }),
      ],
    }
    const result = computeAvail(cocktail, new Set(["rum"]))
    expect(result.missingRequiredIds).toEqual(["gin"])
  })

  it("resolves missing ingredient ids to display names via the provided resolver", () => {
    const cocktail = { ings: [component({ ingId: "gin", role: "required" })] }
    const result = computeAvail(cocktail, new Set(), (id) =>
      id === "gin" ? "Gin" : id,
    )
    expect(result.missingRequired).toEqual(["Gin"])
  })

  it("falls back to the raw id when no resolver is given", () => {
    const cocktail = { ings: [component({ ingId: "gin", role: "required" })] }
    const result = computeAvail(cocktail, new Set())
    expect(result.missingRequired).toEqual(["gin"])
  })
})

describe("mlToOz", () => {
  it("converts common bar measures to friendly fractions", () => {
    expect(mlToOz(15)).toBe("½ oz")
    expect(mlToOz(22)).toBe("¾ oz")
    expect(mlToOz(30)).toBe("1 oz")
    expect(mlToOz(45)).toBe("1½ oz")
    expect(mlToOz(60)).toBe("2 oz")
  })

  it("falls back to a decimal for uncommon amounts", () => {
    expect(mlToOz(100)).toBe("3.4 oz")
  })
})

describe("formatAmount", () => {
  it("displays ml amounts as-is when the unit preference is ml", () => {
    expect(formatAmount({ amount: 30, unitLabel: "ml" }, "ml")).toBe("30ml")
  })

  it("converts to oz for display without mutating the input (stored data is never rewritten)", () => {
    const recipeIng = { amount: 30, unitLabel: "ml" }
    const snapshot = { ...recipeIng }
    const result = formatAmount(recipeIng, "oz")
    expect(result).toBe("1 oz")
    expect(recipeIng).toEqual(snapshot)
  })

  it("passes non-volume semantic units through verbatim regardless of unit preference", () => {
    const recipeIng = { amount: 0, unitLabel: "2 dashes" }
    expect(formatAmount(recipeIng, "ml")).toBe("2 dashes")
    expect(formatAmount(recipeIng, "oz")).toBe("2 dashes")
  })
})

describe("resolveOwnedIngredientTypes", () => {
  const types = [
    { id: "spirit", parent_type_id: null },
    { id: "gin", parent_type_id: "spirit" },
    { id: "london-dry-gin", parent_type_id: "gin" },
    { id: "vodka", parent_type_id: "spirit" },
  ]

  it("includes directly owned types", () => {
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(["gin"]),
      ownedProductIds: new Set(),
      products: [],
      ingredientTypes: types,
    })
    expect(owned.has("gin")).toBe(true)
  })

  it("satisfies an ancestor type when a more specific child type is owned", () => {
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(["london-dry-gin"]),
      ownedProductIds: new Set(),
      products: [],
      ingredientTypes: types,
    })
    expect(owned.has("london-dry-gin")).toBe(true)
    expect(owned.has("gin")).toBe(true)
    expect(owned.has("spirit")).toBe(true)
  })

  it("does not satisfy a child type just because its parent is owned", () => {
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(["gin"]),
      ownedProductIds: new Set(),
      products: [],
      ingredientTypes: types,
    })
    expect(owned.has("london-dry-gin")).toBe(false)
  })

  it("does not leak satisfaction across unrelated branches of the hierarchy", () => {
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(["gin"]),
      ownedProductIds: new Set(),
      products: [],
      ingredientTypes: types,
    })
    expect(owned.has("vodka")).toBe(false)
  })

  it("satisfies a type via an owned product mapped to it, including that type's ancestors", () => {
    const products = [{ id: "product-1", ingredient_type_id: "london-dry-gin" }]
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(),
      ownedProductIds: new Set(["product-1"]),
      products,
      ingredientTypes: types,
    })
    expect(owned.has("london-dry-gin")).toBe(true)
    expect(owned.has("gin")).toBe(true)
    expect(owned.has("spirit")).toBe(true)
  })

  it("ignores a product that isn't actually owned", () => {
    const products = [{ id: "product-1", ingredient_type_id: "gin" }]
    const owned = resolveOwnedIngredientTypes({
      ownedTypeIds: new Set(),
      ownedProductIds: new Set(),
      products,
      ingredientTypes: types,
    })
    expect(owned.has("gin")).toBe(false)
  })
})
