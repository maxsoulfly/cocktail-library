import { FilterChip } from "@/components/primitives"

export function TasteTagChips({ tasteTags, selectedIds, onToggle }) {
  return (
    <div>
      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-2">
        Taste Tags
      </label>
      <div className="flex gap-1.5 flex-wrap">
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
