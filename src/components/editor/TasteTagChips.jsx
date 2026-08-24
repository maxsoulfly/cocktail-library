import { FilterChip } from "@/components/primitives"

export function TasteTagChips({ tasteTags, selectedIds, onToggle }) {
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
        Taste Tags
      </label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tasteTags.map((t) => (
          <FilterChip
            key={t.id}
            label={t.name}
            active={selectedIds.includes(t.id)}
            onClick={() => onToggle(t.id)}
          />
        ))}
      </div>
    </div>
  )
}
