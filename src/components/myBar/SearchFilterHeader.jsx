import { useRef, useState } from "react"
import { IconChevD, IconPlus, IconSearch } from "@/components/icons"
import { IngredientIcon } from "@/components/IngredientIcon"
import { BottomSheet, FilterChip } from "@/components/primitives"

// The category row used to be a single horizontally-scrolling line of
// FilterChips - fine for a handful of categories, but with 10+ (Spirit,
// Wine, Liqueur, Vermouth, Beer, Mixer, Sweetener, Dairy & Eggs, Other,
// Sauce, Bitters, Herb, Juice, Garnish) it became too cramped to scan or
// scroll through comfortably on a phone. Replaced with the same compact
// trigger + BottomSheet pattern the shape/color pickers use - `cat` is a
// single active-category value already (not multi-select), so it's the
// same shape of problem. "Owned only" stays a standalone toggle chip since
// it's a separate boolean filter, not a category choice.
export function SearchFilterHeader({
  query,
  onQueryChange,
  onAddClick,
  ownedOnly,
  onToggleOwnedOnly,
  cats,
  cat,
  onCatChange,
  categoryShapeByName,
}) {
  const [catPickerOpen, setCatPickerOpen] = useState(false)
  const catTriggerRef = useRef(null)
  const currentShape = categoryShapeByName.get(cat)
  return (
    <div className="pt-4 px-4 pb-0 bg-bg2 border-b border-bdr sticky top-0 z-10 backdrop-blur-md">
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-tx3"
          />
          <input
            placeholder="Search ingredients..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="bg-surface border border-bdr rounded-sm py-[9px] pl-9 pr-3 text-tx text-sm font-body w-full"
          />
        </div>
        <button
          onClick={onAddClick}
          className="glow-cyan bg-cyan border-none rounded-sm w-10 h-10 cursor-pointer flex items-center justify-center text-[#07091a] shrink-0"
        >
          <IconPlus size={18} />
        </button>
      </div>
      <div className="flex gap-2 items-center mb-3">
        <FilterChip
          label="Owned only"
          active={ownedOnly}
          onClick={onToggleOwnedOnly}
        />
        <button
          ref={catTriggerRef}
          type="button"
          onClick={() => setCatPickerOpen(true)}
          className="flex-1 flex items-center gap-2 py-2 px-3 bg-surface border border-bdr rounded-full cursor-pointer min-w-0"
        >
          {currentShape && (
            <IngredientIcon
              shape={currentShape}
              size={15}
              color="var(--cyan)"
            />
          )}
          <span className="flex-1 text-left text-[13px] text-cyan truncate">
            {cat}
          </span>
          <IconChevD size={14} className="text-tx3 shrink-0" />
        </button>
      </div>
      <BottomSheet
        open={catPickerOpen}
        onClose={() => setCatPickerOpen(false)}
        title="Filter by category"
        anchorRef={catTriggerRef}
      >
        <div className="flex gap-2 flex-wrap">
          {cats.map((c) => {
            const shape = categoryShapeByName.get(c)
            return (
              <FilterChip
                key={c}
                label={c}
                icon={
                  shape && (
                    <IngredientIcon
                      shape={shape}
                      size={15}
                      color={cat === c ? "var(--cyan)" : "var(--text3)"}
                    />
                  )
                }
                active={cat === c}
                onClick={() => {
                  onCatChange(c)
                  setCatPickerOpen(false)
                }}
              />
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
