// Flat outline pictograms for cocktail families (Beer, Highball, Shot, Sours,
// Spritz, Stirred) - same visual language as GlassSvg (currentColor stroke,
// 56x56 viewBox) but outline-only, no liquid fill, since a family isn't tied
// to one recipe's availability state the way a serving glass is.

export function FamilyIcon({ family, size = 24 }) {
  const stk = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  }
  const key = (family ?? "").toLowerCase()

  if (key === "beer")
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path d="M14 18 L14 46 L38 46 L38 18 Z" {...stk} />
        <path d="M38 22 Q48 22 48 30 Q48 38 38 38" {...stk} />
        <path d="M14 18 Q14 12 20 12 L32 12 Q38 12 38 18" {...stk} />
      </svg>
    )
  if (key === "shot")
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path d="M18 20 L21 42 L35 42 L38 20 Z" {...stk} />
        <line x1="17" y1="20" x2="39" y2="20" {...stk} />
      </svg>
    )
  if (key === "sours")
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path d="M12 12 Q12 30 28 34 Q44 30 44 12 Z" {...stk} />
        <line x1="10" y1="12" x2="46" y2="12" {...stk} />
        <line x1="28" y1="34" x2="28" y2="44" {...stk} />
        <line x1="20" y1="44" x2="36" y2="44" {...stk} />
      </svg>
    )
  if (key === "spritz")
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path
          d="M16 8 Q13 22 18 30 Q22 36 28 38 Q34 36 38 30 Q43 22 40 8 Z"
          {...stk}
        />
        <line x1="28" y1="38" x2="28" y2="48" {...stk} />
        <line x1="20" y1="48" x2="36" y2="48" {...stk} />
        <circle cx="24" cy="20" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="31" cy="16" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="27" cy="27" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    )
  if (key === "stirred")
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <path d="M12 20 L11 44 L45 44 L44 20 Z" {...stk} />
        <line x1="18" y1="10" x2="34" y2="40" {...stk} />
      </svg>
    )
  // "highball" and any other/unmapped family fall back to a plain tall glass
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <path d="M17 6 L15 48 L41 48 L39 6 Z" {...stk} />
    </svg>
  )
}
