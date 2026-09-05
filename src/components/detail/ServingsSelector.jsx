import { IconMinus, IconPlus } from "@/components/icons"

// A dedicated row rather than crowding the Ingredients header (which already
// carries the ml/oz toggle) - this app has a documented history of exactly
// that kind of row getting cramped on mobile. 44x44px buttons per the user's
// explicit requirement, stricter than this app's earlier 32px touch-target
// precedent elsewhere.
export function ServingsSelector({ servings, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-tx3 uppercase tracking-[0.06em] font-display">
        Servings
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, servings - 1))}
          disabled={servings <= 1}
          aria-label="Decrease servings"
          className="w-11 h-11 rounded-sm border border-bdr bg-surface flex items-center justify-center text-tx2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconMinus size={18} />
        </button>
        <span
          className="w-6 text-center text-base font-mono font-semibold text-tx"
          aria-live="polite"
        >
          {servings}
        </span>
        <button
          onClick={() => onChange(servings + 1)}
          aria-label="Increase servings"
          className="w-11 h-11 rounded-sm border border-bdr bg-surface flex items-center justify-center text-tx2 cursor-pointer"
        >
          <IconPlus size={18} />
        </button>
      </div>
    </div>
  )
}
