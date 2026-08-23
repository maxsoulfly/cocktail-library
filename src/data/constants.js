// Pure UI vocabulary (not admin-managed catalog data, unlike taste tags and
// glasses - those are real Supabase tables now, fetched via useCatalog()).

export const AVAIL_FILTERS = [
  { key: "all", label: "All" },
  { key: "perfect", label: "Perfect" },
  { key: "good", label: "Good Enough" },
  { key: "almost", label: "Almost" },
  { key: "unavail", label: "Unavailable" },
]

export const SOURCE_FILTERS = [
  { key: "classic", label: "Classic" },
  { key: "community", label: "Community" },
  { key: "private", label: "Private" },
]

// "part" isn't in the spec's explicit semantic-unit list (§9: dash,
// barspoon, piece, slice, wedge, top-up) but is a very common real cocktail
// unit for ratio-based recipes ("1 part gin, 1 part vermouth") - added per
// user request. "g" (grams) was added the same way - muddled/solid
// ingredients (fresh fruit, sugar) are genuinely measured by weight, not a
// count or a volume, and there was no way to represent that at all. Shared
// between the manual recipe editor and the recipe batch-import
// validator/prompt so both accept exactly the same unit vocabulary - if they
// drifted, an AI-imported recipe could use a unit the manual editor doesn't
// support, or vice versa.
export const NON_VOLUME_UNITS = [
  "part",
  "dash",
  "barspoon",
  "piece",
  "slice",
  "wedge",
  "top-up",
  "g",
]

// The fixed set of pictograms GlassSvg.jsx actually knows how to draw - a
// glass row's `shape` column must be one of these (DB check constraint
// mirrors it). Admin picks a shape when creating/renaming a glass instead of
// the icon being tied 1:1 to the glass's name, so a new glass can still
// render a sensible pictogram without a code change - only a genuinely
// novel silhouette none of these resemble still needs one.
export const GLASS_SHAPES = [
  "rocks",
  "highball",
  "collins",
  "coupe",
  "nick_and_nora",
  "martini",
  "copper_mug",
  "hurricane",
  "tiki_mug",
  "margarita",
  "red_wine",
  "white_wine",
  "champagne_flute",
  "champagne_tulip",
  "pint",
  "pilsner",
  "beer_stein",
  "glencairn",
  "shot",
]

// See FamilyIcon.jsx - same decoupled-icon pattern as GLASS_SHAPES above.
export const FAMILY_SHAPES = [
  "beer",
  "highball",
  "shot",
  "sours",
  "spritz",
  "stirred",
  "fizz",
  "flip",
  "julep",
  "martini",
  "old_fashioned",
  "punch",
  "smash",
  "tiki",
  "toddy",
  "frozen",
]

// Preset swatches for a recipe's liquid_color (see GlassSvg.jsx) - a plain
// hex field would need color-theory knowledge nobody creating a recipe
// should have to have; picking "looks about right" from a small curated
// palette is good enough for a decorative fill, not a precision value.
export const LIQUID_COLORS = [
  { label: "Clear", value: "#dbeafe" },
  { label: "Pale Gold", value: "#fef3c7" },
  { label: "Amber", value: "#d97706" },
  { label: "Brown", value: "#78350f" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#f472b6" },
  { label: "Green", value: "#65a30d" },
  { label: "Purple", value: "#a78bfa" },
  { label: "Cyan", value: "#22d3ee" },
]
