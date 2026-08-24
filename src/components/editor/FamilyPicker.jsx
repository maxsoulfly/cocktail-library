import { FamilyIcon } from "@/components/FamilyIcon"

export function FamilyPicker({ families, value, onChange }) {
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
        Family (optional)
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => onChange("")}
          style={{
            padding: "8px 14px 6px",
            borderRadius: 8,
            border: `1px solid ${!value ? "var(--cyan)" : "var(--border-s)"}`,
            background: !value ? "rgba(34,211,238,0.1)" : "var(--surface)",
            color: !value ? "var(--cyan)" : "var(--text2)",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 500,
          }}
        >
          None
        </button>
        {families.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            style={{
              padding: "8px 14px 6px",
              borderRadius: 8,
              border: `1px solid ${
                value === f.id ? "var(--cyan)" : "var(--border-s)"
              }`,
              background:
                value === f.id ? "rgba(34,211,238,0.1)" : "var(--surface)",
              color: value === f.id ? "var(--cyan)" : "var(--text2)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <FamilyIcon shape={f.shape} size={24} />
            {f.name}
          </button>
        ))}
      </div>
    </div>
  )
}
