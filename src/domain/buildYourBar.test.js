import { describe, expect, it } from "vitest"
import {
  BUILD_YOUR_BAR_GROUPS,
  BUILD_YOUR_BAR_INITIAL_SIX,
} from "@/data/buildYourBarEssentials"
import { resolveEssentialsList } from "./buildYourBar"

const types = [
  { id: "type-gin", name: "Gin" },
  { id: "type-vodka", name: "Vodka" },
  { id: "type-lime", name: "Lime Juice" },
]

describe("resolveEssentialsList", () => {
  it("resolves a matching name, case-insensitive", () => {
    const result = resolveEssentialsList(["gin"], types)
    expect(result).toEqual([
      { status: "resolved", name: "gin", type: types[0] },
    ])
  })

  it("preserves input order across multiple names", () => {
    const result = resolveEssentialsList(["Vodka", "Gin"], types)
    expect(result.map((r) => r.type.name)).toEqual(["Vodka", "Gin"])
  })

  it("reports 'missing' explicitly, rather than skipping silently or throwing, for a name no longer in the catalog", () => {
    const result = resolveEssentialsList(["Absinthe"], types)
    expect(result).toEqual([{ status: "missing", name: "Absinthe" }])
  })

  it("reports 'ambiguous' explicitly, rather than picking the first match arbitrarily, when two types share a name", () => {
    const collidingTypes = [
      { id: "type-a", name: "Gin" },
      { id: "type-b", name: "gin" }, // distinct row, DB unique constraint is case-sensitive
    ]
    const result = resolveEssentialsList(["Gin"], collidingTypes)
    expect(result).toEqual([
      {
        status: "ambiguous",
        name: "Gin",
        candidates: collidingTypes,
      },
    ])
  })

  it("does not consult aliases - only matches the canonical name field", () => {
    // No aliases param exists at all - a name that only matches via an
    // alias (not tested further here, aliases aren't part of this
    // function's input) must resolve as missing, not silently succeed.
    const result = resolveEssentialsList(["Sec"], types)
    expect(result).toEqual([{ status: "missing", name: "Sec" }])
  })

  it("real curated lists: every name in the initial six and the expanded groups resolves against a catalog fixture mirroring the live data verified 2026-09-06", () => {
    const realFixtureTypes = [
      "Gin",
      "Vodka",
      "Bourbon",
      "Dark Rum",
      "Irish Whiskey",
      "Rye Whiskey",
      "Scotch Whiskey",
      "Soda Water",
      "Tonic Water",
      "Lemon Juice",
      "Lime Juice",
      "Ice",
      "Simple Syrup",
      "Angostura Bitters",
    ].map((name, i) => ({ id: `type-${i}`, name }))

    const sixResults = resolveEssentialsList(
      BUILD_YOUR_BAR_INITIAL_SIX,
      realFixtureTypes,
    )
    expect(sixResults.every((r) => r.status === "resolved")).toBe(true)

    Object.values(BUILD_YOUR_BAR_GROUPS).forEach((groupNames) => {
      const groupResults = resolveEssentialsList(groupNames, realFixtureTypes)
      expect(groupResults.every((r) => r.status === "resolved")).toBe(true)
    })

    // Every name across all three groups combined, deduped, is exactly the
    // 14-item real essentials set - confirms the expanded view really does
    // include the six (not eight "extra" items only).
    const allGroupNames = new Set(Object.values(BUILD_YOUR_BAR_GROUPS).flat())
    expect(allGroupNames.size).toBe(14)
    BUILD_YOUR_BAR_INITIAL_SIX.forEach((name) => {
      expect(allGroupNames.has(name)).toBe(true)
    })
  })
})
