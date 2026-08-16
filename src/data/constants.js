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
