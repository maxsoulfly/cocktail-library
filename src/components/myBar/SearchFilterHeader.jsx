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
        <div className="flex-1 flex gap-1.5 overflow-x-auto">
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
