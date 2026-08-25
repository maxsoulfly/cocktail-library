import { describe, expect, it } from "vitest"
import { resolveGlass } from "./glassResolution"

const glasses = [
  { id: "glass-lowball", name: "Lowball Glass" },
  { id: "glass-coupe", name: "Coupe" },
]
const aliases = [
  { alias: "Rocks Glass", glass_id: "glass-lowball" },
  { alias: "Old Fashioned Glass", glass_id: "glass-lowball" },
]

describe("resolveGlass", () => {
  it("resolves an exact canonical name, case-insensitive", () => {
    expect(resolveGlass("coupe", { glasses, aliases })).toEqual(glasses[1])
  })

  it("resolves via an alias, case-insensitive", () => {
    expect(resolveGlass("rocks glass", { glasses, aliases })).toEqual(
      glasses[0],
    )
  })

  it("prefers a canonical name match over an alias with the same text", () => {
    const shadowed = [{ alias: "Coupe", glass_id: "glass-lowball" }]
    expect(resolveGlass("Coupe", { glasses, aliases: shadowed })).toEqual(
      glasses[1],
    )
  })

  it("returns null for no match", () => {
    expect(resolveGlass("Highball Glass", { glasses, aliases })).toBeNull()
  })

  it("returns null for blank input without throwing", () => {
    expect(resolveGlass("  ", { glasses, aliases })).toBeNull()
  })

  it("works with no aliases provided at all", () => {
    expect(resolveGlass("Coupe", { glasses })).toEqual(glasses[1])
  })

  it("doesn't throw if an alias points at a since-deleted glass", () => {
    const dangling = [{ alias: "Ghost Glass", glass_id: "nope" }]
    expect(
      resolveGlass("Ghost Glass", { glasses, aliases: dangling }),
    ).toBeNull()
  })
})
