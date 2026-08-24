import { GlassSvg } from "@/components/GlassSvg"

export function GlassPicker({ glasses, value, onChange }) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text2)",
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          display: "block",
          marginBottom: 8,
        }}
      >
        Glass
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {glasses.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.name)}
            style={{
              padding: "8px 14px 6px",
              borderRadius: 8,
              border: `1px solid ${
                value === g.name ? "var(--cyan)" : "var(--border-s)"
              }`,
              background:
                value === g.name ? "rgba(34,211,238,0.1)" : "var(--surface)",
              color: value === g.name ? "var(--cyan)" : "var(--text2)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              textTransform: "capitalize",
              transition: "all 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <GlassSvg
              type={g.shape ?? g.name.toLowerCase()}
              size={28}
              color={value === g.name ? "var(--cyan)" : "var(--text2)"}
            />
            {g.name}
          </button>
        ))}
      </div>
    </div>
  )
}
