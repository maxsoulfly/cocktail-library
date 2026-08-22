// Flat glass silhouette with a liquid-color fill — the spec's stand-in for
// recipe photography. Fill opacity drops when the cocktail is unavailable.

export function GlassSvg({
  type,
  liquidColor,
  size = 64,
  avail = "unavail",
  color = "var(--text2)",
}) {
  const liqOp = avail === "unavail" ? 0.2 : 0.72
  const stk = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  }

  if (type === "rocks")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        style={{ color }}
      >
        <rect
          x="11"
          y="20"
          width="34"
          height="24"
          rx="2"
          fill={liquidColor}
          fillOpacity={liqOp}
        />
        <path d="M12 16 L11 44 L45 44 L44 16 Z" {...stk} />
        <rect
          x="16"
          y="20"
          width="8"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeOpacity={0.35}
          fill="none"
        />
        <rect
          x="28"
          y="18"
          width="8"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeOpacity={0.35}
          fill="none"
        />
      </svg>
    )
  if (type === "highball" || type === "collins")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        style={{ color }}
      >
        <rect
          x="15"
          y="22"
          width="26"
          height="26"
          rx="2"
          fill={liquidColor}
          fillOpacity={liqOp}
        />
        <path d="M17 6 L15 48 L41 48 L39 6 Z" {...stk} />
        <rect
          x="20"
          y="11"
          width="7"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeOpacity={0.3}
          fill="none"
        />
        <rect
          x="31"
          y="9"
          width="7"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeOpacity={0.3}
          fill="none"
        />
      </svg>
    )
  if (type === "coupe")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        style={{ color }}
      >
        <path
          d="M10 10 Q10 30 28 34 Q46 30 46 10 Z"
          fill={liquidColor}
          fillOpacity={liqOp}
        />
        <path d="M10 10 Q10 32 28 36 Q46 32 46 10" {...stk} />
        <line x1="8" y1="10" x2="48" y2="10" {...stk} />
        <line x1="28" y1="36" x2="28" y2="46" {...stk} />
        <line x1="19" y1="46" x2="37" y2="46" {...stk} />
      </svg>
    )
  if (type === "wine")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        style={{ color }}
      >
        <path
          d="M16 6 Q13 22 18 30 Q22 36 28 38 Q34 36 38 30 Q43 22 40 6 Z"
          fill={liquidColor}
          fillOpacity={liqOp}
        />
        <path
          d="M16 6 Q13 22 18 30 Q22 36 28 38 Q34 36 38 30 Q43 22 40 6 Z"
          {...stk}
        />
        <line x1="28" y1="38" x2="28" y2="48" {...stk} />
        <line x1="20" y1="48" x2="36" y2="48" {...stk} />
      </svg>
    )
  // martini
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      style={{ color }}
    >
      <polygon
        points="10,10 46,10 28,34"
        fill={liquidColor}
        fillOpacity={liqOp}
      />
      <path d="M10 10 L28 34 L46 10" {...stk} />
      <line x1="8" y1="10" x2="48" y2="10" {...stk} />
      <line x1="28" y1="34" x2="28" y2="44" {...stk} />
      <line x1="19" y1="44" x2="37" y2="44" {...stk} />
    </svg>
  )
}
