// Flat outline pictograms for cocktail families - same visual language as
// GlassSvg (currentColor stroke, 56x56 viewBox) but outline-only, no liquid
// fill, since a family isn't tied to one recipe's availability state the
// way a serving glass is.
//
// Keyed by `shape` (cocktail_families.shape), not the family's name - same
// decoupling GlassSvg got from glasses.shape, so a new family an admin adds
// later just picks an existing pictogram instead of always falling back to
// the generic glass silhouette until a developer adds a matching case.

export function FamilyIcon({ shape, size = 24, color = "var(--text2)" }) {
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
    style: { color },
  }

  if (shape === "beer")
    return (
      <svg {...props}>
        <path d="M14 18 L14 46 L38 46 L38 18 Z" {...stk} />
        <path d="M38 22 Q48 22 48 30 Q48 38 38 38" {...stk} />
        <path d="M14 18 Q14 12 20 12 L32 12 Q38 12 38 18" {...stk} />
      </svg>
    )
  if (shape === "shot")
    return (
      <svg {...props}>
        <path d="M18 20 L21 42 L35 42 L38 20 Z" {...stk} />
        <line x1="17" y1="20" x2="39" y2="20" {...stk} />
      </svg>
    )
  if (shape === "sours")
    return (
      <svg {...props}>
        <path d="M12 12 Q12 30 28 34 Q44 30 44 12 Z" {...stk} />
        <line x1="10" y1="12" x2="46" y2="12" {...stk} />
        <line x1="28" y1="34" x2="28" y2="44" {...stk} />
        <line x1="20" y1="44" x2="36" y2="44" {...stk} />
      </svg>
    )
  if (shape === "spritz")
    return (
      <svg {...props}>
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
  if (shape === "stirred")
    return (
      <svg {...props}>
        <path d="M12 20 L11 44 L45 44 L44 20 Z" {...stk} />
        <line x1="18" y1="10" x2="34" y2="40" {...stk} />
      </svg>
    )
  if (shape === "fizz")
    return (
      <svg {...props}>
        <path d="M20 10 L18 46 L38 46 L36 10 Z" {...stk} />
        <circle cx="25" cy="22" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="30" cy="30" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="26" cy="36" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    )
  if (shape === "flip")
    return (
      <svg {...props}>
        <path d="M14 14 Q14 24 28 26 Q42 24 42 14 Z" {...stk} />
        <line x1="12" y1="14" x2="44" y2="14" {...stk} />
        <line x1="28" y1="26" x2="28" y2="44" {...stk} />
        <line x1="20" y1="44" x2="36" y2="44" {...stk} />
      </svg>
    )
  if (shape === "julep")
    return (
      <svg {...props}>
        <path d="M16 16 L19 44 L37 44 L40 16 Z" {...stk} />
        <line x1="14" y1="16" x2="42" y2="16" {...stk} />
        <path d="M28 16 Q24 8 26 4" {...stk} />
        <path d="M28 16 Q32 8 30 4" {...stk} />
      </svg>
    )
  if (shape === "martini")
    return (
      <svg {...props}>
        <path d="M12 10 L28 30 L44 10 Z" {...stk} />
        <line x1="28" y1="30" x2="28" y2="46" {...stk} />
        <line x1="18" y1="46" x2="38" y2="46" {...stk} />
      </svg>
    )
  if (shape === "old_fashioned")
    return (
      <svg {...props}>
        <path d="M16 20 L16 46 L40 46 L40 20 Z" {...stk} />
        <rect x="22" y="28" width="12" height="12" {...stk} />
      </svg>
    )
  if (shape === "punch")
    return (
      <svg {...props}>
        <path d="M10 22 Q10 40 28 40 Q46 40 46 22 Z" {...stk} />
        <line x1="8" y1="22" x2="48" y2="22" {...stk} />
        <path d="M44 14 L50 8" {...stk} />
        <circle cx="52" cy="6" r="2" {...stk} />
      </svg>
    )
  if (shape === "smash")
    return (
      <svg {...props}>
        <path d="M16 18 L16 46 L40 46 L40 18 Z" {...stk} />
        <circle cx="22" cy="40" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="28" cy="42" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="34" cy="39" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="25" cy="36" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    )
  if (shape === "tiki")
    return (
      <svg {...props}>
        <path d="M18 14 Q16 30 20 46 L36 46 Q40 30 38 14 Z" {...stk} />
        <line x1="17" y1="14" x2="39" y2="14" {...stk} />
        <path d="M28 14 L28 6" {...stk} />
        <path d="M28 8 Q34 6 36 10 Q30 14 28 8 Z" {...stk} />
      </svg>
    )
  if (shape === "toddy")
    return (
      <svg {...props}>
        <path d="M16 18 L16 44 L36 44 L36 18 Z" {...stk} />
        <line x1="14" y1="18" x2="38" y2="18" {...stk} />
        <path d="M36 22 Q46 22 46 30 Q46 38 36 38" {...stk} />
        <path d="M22 12 Q20 8 22 4" {...stk} />
        <path d="M30 12 Q28 8 30 4" {...stk} />
      </svg>
    )
  if (shape === "frozen")
    return (
      <svg {...props}>
        <path d="M14 12 L28 34 L42 12 Z" {...stk} />
        <line x1="28" y1="34" x2="28" y2="46" {...stk} />
        <line x1="20" y1="46" x2="36" y2="46" {...stk} />
        <path d="M20 18 Q28 22 36 18" {...stk} />
        <path d="M22 24 Q28 27 34 24" {...stk} />
      </svg>
    )
  // "highball" and any other/unmapped shape fall back to a plain tall glass.
  return (
    <svg {...props}>
      <path d="M17 6 L15 48 L41 48 L39 6 Z" {...stk} />
    </svg>
  )
}
