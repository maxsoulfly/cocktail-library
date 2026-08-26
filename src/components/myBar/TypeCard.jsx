import clsx from "clsx"
import { IconCheck, IconChevD, IconChevR, IconEdit } from "@/components/icons"
import { IngredientIcon } from "@/components/IngredientIcon"
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
  isStaff,
  onEditType,
  onToggleOwned,
}) {
  return (
    <Card
      onClick={onToggleOwned}
      className="pt-2.5 px-2 pb-2 cursor-pointer flex flex-col items-center text-center gap-1 overflow-hidden"
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
      {/* In normal flow (reserving its own row) rather than absolutely
          positioned over the icon tile below - w-8 h-8 (32px) buttons
          (up from the old p-0.5-around-a-12px-icon, ~16px tappable area,
          a real WCAG/mobile-ergonomics gap flagged during the Phase 6
          accessibility audit - "place for big fingers") are tall enough to
          visually collide with the icon tile on a child card if
          absolutely-positioned over it instead (found from a live
          screenshot - the chevron sat "on top of the picture"). Flow
          layout means the buttons simply push the icon down instead,
          with no overlap regardless of button size. Only rendered when
          there's something to show (a checkmark, or a button), so a
          plain member viewing an unowned no-products type doesn't get an
          empty reserved row. */}
      {(owned || allProducts.length > 0 || isStaff) && (
        <div className="w-full flex items-center justify-between">
          {/* Fixed-size slot (matching the button size) so the buttons on
              the right stay put whether or not the checkmark renders -
              owned/unowned was previously signaled by border/background
              color alone (WCAG 1.4.1 - color-only status), same "big
              fingers" audit pass. */}
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            {owned && (
              <span className="w-4.5 h-4.5 rounded-full bg-cyan flex items-center justify-center text-[#07091a]">
                <IconCheck size={10} />
              </span>
            )}
          </div>
          <div className="flex gap-0.5">
            {allProducts.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand()
                }}
                title={`${allProducts.length} product(s)`}
                className="bg-transparent border-none cursor-pointer w-8 h-8 text-tx3 flex items-center justify-center"
              >
                {expanded ? <IconChevD size={12} /> : <IconChevR size={12} />}
              </button>
            )}
            {isStaff && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditType()
                }}
                title="Edit ingredient type"
                className="bg-transparent border-none cursor-pointer w-8 h-8 text-tx3 flex items-center justify-center"
              >
                <IconEdit size={12} />
              </button>
            )}
          </div>
        </div>
      )}
      {/* No tinted background tile - the icon's own fillColor already
          carries the ingredient's real color (same as a "Clear" swatch,
          which never had a visible tile either since its color is near-
          transparent). Removing the tile for every color, not just pale
          ones, meant the icon itself could grow instead of sharing space
          with a box around it. */}
      <IngredientIcon
        shape={type.shape}
        size={isChild ? 38 : 46}
        color={owned ? "var(--text2)" : "var(--text3)"}
        fillColor={type.color ?? "#4e6680"}
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
