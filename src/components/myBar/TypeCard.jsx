import clsx from "clsx"
import { IconCheck, IconChevD, IconChevR, IconEdit } from "@/components/icons"
import { IngredientIcon } from "@/components/IngredientIcon"
import { Card } from "@/components/primitives"

// The per-ingredient-type card: color swatch, name, owned-products
// subtitle, and (for a parent not directly owned) a "via <child>" note -
// see coveringChildren below.
//
// `onCardClick` and `onToggleOwned` are deliberately separate props, not
// one dual-purpose handler - exploring an ingredient must never risk
// silently changing what's owned (found as a real inconsistency during the
// Cocktail Library + My Bar UX audit: ExpandedProducts.jsx already got
// this right via its own OwnedToggle, this card didn't). Each consumer
// decides what tapping the card body does: Build Your Bar passes the same
// function to both (preserving its existing tap-to-select-and-own
// behavior exactly), My Bar passes a navigate-to-view handler to
// `onCardClick` and keeps `onToggleOwned` as the only thing the dedicated
// checkmark button below ever does.
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
  onCardClick,
  onToggleOwned,
}) {
  return (
    <Card
      onClick={onCardClick}
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
      {/* Always rendered now - the ownership checkmark must always be
          reachable, not just "when there's something to show" (the old
          reasoning for hiding this row entirely on a plain unowned
          no-products card no longer applies once ownership has its own
          always-present control). flex-wrap is a deliberate defensive
          choice, not decorative: the checkmark button alone is 44x44px
          (a stricter minimum than the 32px chevron/edit already use,
          per the explicit touch-target requirement) on cards as narrow as
          104px in My Bar's own singles grid - wrapping to a second line
          rather than overflowing/clipping if a family-cluster child card
          (with all three controls at once) can't fit them on one row. */}
      <div className="w-full flex flex-wrap items-center justify-between gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleOwned()
          }}
          aria-label={
            owned
              ? `Remove ${type.name} from My Bar`
              : `Mark ${type.name} as owned`
          }
          aria-pressed={owned}
          className={clsx(
            "w-11 h-11 rounded-full border flex items-center justify-center shrink-0 cursor-pointer",
            owned
              ? "bg-cyan border-cyan text-[#07091a]"
              : "bg-transparent border-bdr text-tx3",
          )}
        >
          {owned && <IconCheck size={14} />}
        </button>
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
