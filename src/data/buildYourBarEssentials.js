// The homepage "Build your bar" essentials selection (empty-My-Bar home
// experience) - deliberately separate from ingredient_types.bar_priority,
// which drives ONLY Buy Next's purchase-recommendation ranking
// (src/domain/recommendations.js, spec §11's original purpose). Curating
// what appears here must never touch that ranking, so this is a plain
// ordered list of canonical ingredient_type names, resolved against the
// live catalog at render time via resolveEssentialsList()
// (src/domain/buildYourBar.js) - not a database column, not a bar_priority
// value.
//
// The six are deliberately every one a standalone type with no
// parent_type_id (verified live, 2026-09-06: Gin, Vodka, Soda Water, Lemon
// Juice, Lime Juice, Ice all have parent_type_id = null) - so a first-visit
// tap can never be misread as picking a specific bottle or subtype.
export const BUILD_YOUR_BAR_INITIAL_SIX = [
  "Gin",
  "Vodka",
  "Soda Water",
  "Lemon Juice",
  "Lime Juice",
  "Ice",
]

// The full expanded view (Stage 2+) shows all 14 grouped under these three
// headings, INCLUDING the six above in their proper group - not the eight
// "extra" ones appended underneath. Kept as three separate arrays (rather
// than one 14-item list with a group field) so BUILD_YOUR_BAR_INITIAL_SIX
// stays the single source of truth for which six show first, with no risk
// of the two lists drifting out of sync on which items count as "the six".
// The remaining 8 are the rest of the app's already-curated
// bar_priority='essential' catalog, including every whiskey/rum subtype
// deliberately kept out of the initial six for the same subtype-neutrality
// reason - each shown as its own real, distinct type here, never collapsed
// into a generic stand-in (tapping "Bourbon" only ever marks Bourbon
// owned).
export const BUILD_YOUR_BAR_GROUPS = {
  Spirits: [
    "Gin",
    "Vodka",
    "Bourbon",
    "Dark Rum",
    "Irish Whiskey",
    "Rye Whiskey",
    "Scotch Whiskey",
  ],
  Mixers: ["Soda Water", "Tonic Water"],
  "Kitchen basics": [
    "Lemon Juice",
    "Lime Juice",
    "Ice",
    "Simple Syrup",
    "Angostura Bitters",
  ],
}
