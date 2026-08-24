import { IconChevD, IconChevR, IconEdit } from "@/components/icons"
import { Card } from "@/components/primitives"

// The per-ingredient-type card: color swatch, name, owned-products
// subtitle, and (for a parent not directly owned) a "via <child>" note -
// see coveringChildren below. Tapping the card toggles generic ownership;
// the chevron/edit buttons stop propagation so they don't also toggle it.
export function TypeCard({
  type,
  isChild,
  owned,
  ownedProducts,
  allProducts,
  expanded,
  onToggleExpand,
  coveringChildren,
  isAdmin,
  onEditType,
  onToggleOwned,
}) {
  return (
    <Card
      onClick={onToggleOwned}
      style={{
        position: "relative",
        padding: "10px 8px 8px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 4,
        // Without this, a card with a long owned-products list (e.g.
        // several bottles of one whiskey type) could visually grow wider
        // than its fixed-width slot (104px/96px in a family cluster's
        // flex-wrap row) instead of the product-name text truncating
        // within it - the ellipsis styling below only works if the box
        // it's ellipsizing inside actually stays put.
        overflow: "hidden",
        border: `1px solid ${owned ? "var(--cyan)" : "var(--border-s)"}`,
        background: owned ? "rgba(34,211,238,0.08)" : "var(--surface)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          display: "flex",
          gap: 2,
        }}
      >
        {allProducts.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            title={`${allProducts.length} product(s)`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color: "var(--text3)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {expanded ? <IconChevD size={12} /> : <IconChevR size={12} />}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditType()
            }}
            title="Edit ingredient type"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color: "var(--text3)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconEdit size={12} />
          </button>
        )}
      </div>
      <div
        style={{
          width: isChild ? 30 : 38,
          height: isChild ? 30 : 38,
          borderRadius: 10,
          background: `${type.color ?? "#4e6680"}25`,
          border: `1px solid ${type.color ?? "#4e6680"}40`,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontSize: isChild ? 12 : 13,
          fontFamily: "var(--font-body)",
          fontWeight: isChild ? 400 : 500,
          color: owned ? "var(--text)" : "var(--text3)",
          transition: "color 0.15s",
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {type.name}
      </div>
      {ownedProducts.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text3)",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ownedProducts.map((p) => p.name).join(", ")}
        </div>
      )}
      {coveringChildren.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: "var(--cyan)",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          via {coveringChildren.map((c) => c.name).join(", ")}
        </div>
      )}
    </Card>
  )
}
