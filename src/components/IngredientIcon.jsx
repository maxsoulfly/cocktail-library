// Flat pictograms for ingredient types - same visual language as GlassSvg/
// FamilyIcon (currentColor stroke, 56x56 viewBox). `color` is the outline,
// same convention GlassSvg/FamilyIcon already use (ShapePicker relies on
// this to flip a swatch cyan when selected) - `fillColor` is a separate
// "content" tint (defaults to `color` if not given), for the ingredient
// type's own `color` field: liquid in a bottle, the body of a fruit, same
// idea as GlassSvg's liquidColor.
//
// Keyed by `shape` (ingredient_types.shape), not the type's name or
// category - see INGREDIENT_SHAPES (src/data/constants.js) for why this is
// per-type rather than derived from category: a handful of items (Salt,
// sugars, seasonings) don't share their category's obvious pictogram.

export function IngredientIcon({
  shape,
  size = 24,
  color = "var(--text2)",
  fillColor,
}) {
  const fill = fillColor ?? color
  const stk = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  }
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 56 56",
    fill: "none",
    style: { color },
  }
  const fillProps = { fill, fillOpacity: 0.5, stroke: "none" }

  if (shape === "wine_bottle")
    return (
      <svg {...props}>
        <path
          d="M25 4 L31 4 L31 20 L36 26 L36 48 L20 48 L20 26 L25 20 Z"
          {...stk}
        />
        <path d="M21 28 L35 28 L35 47 L21 47 Z" {...fillProps} />
      </svg>
    )
  if (shape === "beer")
    return (
      <svg {...props}>
        <path
          d="M25 5 L31 5 L31 12 L34 16 L34 46 L22 46 L22 16 L25 12 Z"
          {...stk}
        />
        <rect x="24" y="3" width="8" height="4" rx="1" {...stk} />
        <path d="M23 20 L33 20 L33 45 L23 45 Z" {...fillProps} />
      </svg>
    )
  if (shape === "soda_can")
    return (
      <svg {...props}>
        <rect x="18" y="10" width="20" height="34" rx="3" {...stk} />
        <ellipse cx="28" cy="10" rx="10" ry="2.5" {...stk} />
        <rect x="26" y="6" width="4" height="3" rx="1" {...stk} />
        <rect x="19.5" y="14" width="17" height="28" rx="2" {...fillProps} />
      </svg>
    )
  if (shape === "fruit")
    return (
      <svg {...props}>
        <circle cx="28" cy="30" r="16" {...stk} />
        <circle cx="28" cy="30" r="16" {...fillProps} />
        <path d="M28 14 Q32 8 38 10 Q34 16 28 14 Z" {...stk} />
      </svg>
    )
  if (shape === "herb")
    return (
      <svg {...props}>
        <path d="M28 46 L28 16" {...stk} />
        <path
          d="M28 30 Q16 26 14 14 Q26 17 28 30 Z"
          {...stk}
          fill={fill}
          fillOpacity={0.45}
        />
        <path
          d="M28 22 Q40 18 42 8 Q30 11 28 22 Z"
          {...stk}
          fill={fill}
          fillOpacity={0.45}
        />
      </svg>
    )
  if (shape === "dropper")
    return (
      <svg {...props}>
        <rect x="26" y="2" width="4" height="8" rx="2" {...stk} />
        <path d="M24 10 L32 10 L32 44 L24 44 Z" {...stk} />
        <path d="M25 16 L31 16 L31 43 L25 43 Z" {...fillProps} />
      </svg>
    )
  if (shape === "jar")
    return (
      <svg {...props}>
        <rect x="16" y="18" width="24" height="26" rx="2" {...stk} />
        <rect x="14" y="12" width="28" height="8" rx="2" {...stk} />
        <rect x="17" y="21" width="22" height="20" rx="1" {...fillProps} />
      </svg>
    )
  if (shape === "sauce_bottle")
    return (
      <svg {...props}>
        <path
          d="M25 6 L31 6 L31 10 L33 13 L33 46 L23 46 L23 13 L25 10 Z"
          {...stk}
        />
        <rect x="25" y="3" width="6" height="4" {...stk} />
        <path d="M24 16 L32 16 L32 45 L24 45 Z" {...fillProps} />
      </svg>
    )
  if (shape === "dairy")
    return (
      <svg {...props}>
        <path d="M16 20 L16 44 L36 44 L36 20 L26 8 Z" {...stk} />
        <line x1="16" y1="20" x2="36" y2="20" {...stk} />
        <path d="M17.5 22 L34.5 22 L34.5 43 L17.5 43 Z" {...fillProps} />
      </svg>
    )
  if (shape === "ice")
    return (
      <svg {...props}>
        <path d="M14 18 L28 10 L42 18 L42 38 L28 46 L14 38 Z" {...stk} />
        <path d="M14 18 L28 26 L42 18" {...stk} />
        <line x1="28" y1="26" x2="28" y2="46" {...stk} />
        <path
          d="M14 18 L28 26 L28 46 L14 38 Z"
          fill={fill}
          fillOpacity={0.35}
          stroke="none"
        />
      </svg>
    )
  // "spirit_bottle" and any other/unmapped shape fall back to the standard
  // bottle silhouette - the single most common case, same fallback pattern
  // GlassSvg/FamilyIcon use for their own default shape.
  return (
    <svg {...props}>
      <path
        d="M23 6 L33 6 L33 14 L38 20 L38 46 L18 46 L18 20 L23 14 Z"
        {...stk}
      />
      <path d="M19 22 L37 22 L37 45 L19 45 Z" {...fillProps} />
    </svg>
  )
}
