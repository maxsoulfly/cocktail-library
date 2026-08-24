import { FamilyIcon } from "@/components/FamilyIcon"
import { GlassSvg } from "@/components/GlassSvg"
import { FAMILY_SHAPES, GLASS_SHAPES } from "@/data/constants"

// Which built-in pictogram a row uses - see GLASS_SHAPES/FAMILY_SHAPES'
// comments for why this exists instead of the icon being tied to the name.
// `kind` picks the shape list and icon component; "glass" -> GlassSvg,
// "family" -> FamilyIcon.
export function ShapePicker({ kind, value, onChange }) {
  const shapes = kind === "family" ? FAMILY_SHAPES : GLASS_SHAPES
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {shapes.map((shape) => {
        const active = value === shape
        const iconColor = active ? "var(--cyan)" : "var(--text2)"
        return (
          <button
            key={shape}
            type="button"
            onClick={() => onChange(shape)}
            title={shape}
            style={{
              padding: "6px 10px 4px",
              borderRadius: "var(--r-sm)",
              border: `1px solid ${active ? "var(--cyan)" : "var(--border-s)"}`,
              background: active ? "rgba(34,211,238,0.12)" : "var(--surface)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {kind === "family" ? (
              <FamilyIcon shape={shape} size={24} color={iconColor} />
            ) : (
              <GlassSvg type={shape} size={24} color={iconColor} />
            )}
            <span
              style={{
                fontSize: 10,
                color: iconColor,
                textTransform: "capitalize",
              }}
            >
              {shape.replace(/_/g, " ")}
            </span>
          </button>
        )
      })}
    </div>
  )
}
