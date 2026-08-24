import clsx from "clsx"
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
      className="relative pt-2.5 px-2 pb-2 cursor-pointer flex flex-col items-center text-center gap-1 overflow-hidden"
      style={{
        // Border/background stay inline rather than className: Card's own
        // base classes already set both, so a conditional className here
        // would compete with Card's for the same properties at equal
        // specificity (see primitives.jsx's ConfirmPanel for the same
        // pattern). Without this, a card with a long owned-products list
        // (e.g. several bottles of one whiskey type) could visually grow
        // wider than its fixed-width slot (w-26/w-24 in a family cluster's
        // flex-wrap row) instead of the product-name text truncating
        // within it - the ellipsis styling below only works if the box
        // it's ellipsizing inside actually stays put (see overflow-hidden
        // above).
        border: `1px solid ${owned ? "var(--cyan)" : "var(--border-s)"}`,
        background: owned ? "rgba(34,211,238,0.08)" : "var(--surface)",
      }}
    >
      <div className="absolute top-1 right-1 flex gap-0.5">
        {allProducts.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            title={`${allProducts.length} product(s)`}
            className="bg-transparent border-none cursor-pointer p-0.5 text-tx3 flex items-center"
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
            className="bg-transparent border-none cursor-pointer p-0.5 text-tx3 flex items-center"
          >
            <IconEdit size={12} />
          </button>
        )}
      </div>
      <div
        className={clsx(
          "rounded-[10px] shrink-0",
          isChild ? "w-7.5 h-7.5" : "w-9.5 h-9.5",
        )}
        style={{
          background: `${type.color ?? "#4e6680"}25`,
          border: `1px solid ${type.color ?? "#4e6680"}40`,
        }}
      />
      <div
        className={clsx(
          "font-body w-full overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-150",
          isChild ? "text-xs font-normal" : "text-[13px] font-medium",
          owned ? "text-tx" : "text-tx3",
        )}
      >
        {type.name}
      </div>
      {ownedProducts.length > 0 && (
        <div className="text-[10px] text-tx3 w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {ownedProducts.map((p) => p.name).join(", ")}
        </div>
      )}
      {coveringChildren.length > 0 && (
        <div className="text-[10px] text-cyan w-full overflow-hidden text-ellipsis whitespace-nowrap">
          via {coveringChildren.map((c) => c.name).join(", ")}
        </div>
      )}
    </Card>
  )
}
