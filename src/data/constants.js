// Fixed vocabularies shared across screens. Taste tags and glasses are
// administrator-managed per the spec; these lists stand in for that catalog
// until it's backed by Supabase.

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

export const TASTE_FILTERS = ["Bitter", "Citrus", "Sweet", "Herbal", "Spicy", "Fruity", "Tropical", "Refreshing", "Whiskey", "Tequila"]

export const GLASSES = ["martini", "rocks", "highball", "coupe", "wine", "collins"]
