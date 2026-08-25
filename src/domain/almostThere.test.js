import { describe, expect, it } from "vitest"
import { rankAlmostThere } from "./almostThere"

describe("rankAlmostThere", () => {
  it("filters to only avail === 'almost' recipes", () => {
    const computed = [
      { id: "1", name: "Perfect One", avail: "perfect" },
      { id: "2", name: "Almost One", avail: "almost" },
      { id: "3", name: "Unavailable One", avail: "unavail" },
    ]
    const ranked = rankAlmostThere(computed)
    expect(ranked.map((r) => r.id)).toEqual(["2"])
  })

  it("ranks by total popularity (favoriteCount + wantToMakeCount) descending", () => {
    const computed = [
      {
        id: "1",
        name: "A",
        avail: "almost",
        favoriteCount: 1,
        wantToMakeCount: 0,
      },
      {
        id: "2",
        name: "B",
        avail: "almost",
        favoriteCount: 5,
        wantToMakeCount: 2,
      },
      {
        id: "3",
        name: "C",
        avail: "almost",
        favoriteCount: 0,
        wantToMakeCount: 0,
      },
    ]
    const ranked = rankAlmostThere(computed)
    expect(ranked.map((r) => r.id)).toEqual(["2", "1", "3"])
  })

  it("breaks a popularity tie by name, alphabetically", () => {
    const computed = [
      { id: "1", name: "Zombie", avail: "almost", favoriteCount: 2 },
      { id: "2", name: "Aviation", avail: "almost", favoriteCount: 2 },
    ]
    const ranked = rankAlmostThere(computed)
    expect(ranked.map((r) => r.id)).toEqual(["2", "1"])
  })

  it("treats a missing favoriteCount/wantToMakeCount as zero, not a crash", () => {
    const computed = [{ id: "1", name: "A", avail: "almost" }]
    expect(() => rankAlmostThere(computed)).not.toThrow()
  })

  it("does not mutate the input array", () => {
    const computed = [
      { id: "1", name: "B", avail: "almost", favoriteCount: 0 },
      { id: "2", name: "A", avail: "almost", favoriteCount: 5 },
    ]
    const original = [...computed]
    rankAlmostThere(computed)
    expect(computed).toEqual(original)
  })
})
