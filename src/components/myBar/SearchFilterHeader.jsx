import { IconPlus, IconSearch } from "@/components/icons"
import { FilterChip } from "@/components/primitives"

export function SearchFilterHeader({
  query,
  onQueryChange,
  onAddClick,
  ownedOnly,
  onToggleOwnedOnly,
  cats,
  cat,
  onCatChange,
}) {
  return (
    <div
      style={{
        padding: "16px 16px 0",
        background: "var(--bg2)",
        borderBottom: "1px solid var(--border-s)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <IconSearch
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)",
            }}
          />
          <input
            placeholder="Search ingredients..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              padding: "9px 12px 9px 36px",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              width: "100%",
            }}
          />
        </div>
        <button
          onClick={onAddClick}
          style={{
            background: "var(--cyan)",
            border: "none",
            borderRadius: "var(--r-sm)",
            width: 40,
            height: 40,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#07091a",
            flexShrink: 0,
          }}
          className="glow-cyan"
        >
          <IconPlus size={18} />
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <FilterChip
          label="Owned only"
          active={ownedOnly}
          onClick={onToggleOwnedOnly}
        />
        <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
          {cats.map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={cat === c}
              onClick={() => onCatChange(c)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
