import clsx from "clsx"
import { SectionTitle } from "@/components/primitives"
import { formatAmount } from "@/domain/availability"
import { scaleIngredientAmount } from "@/domain/servings"

export function IngredientsSection({
  ings,
  substitutions,
  missingOptional,
  owned,
  unit,
  setUnit,
  servings,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Ingredients</SectionTitle>
        <div className="flex bg-surface border border-bdr rounded-sm overflow-hidden">
          {["ml", "oz"].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={clsx(
                "py-1 px-3 border-none cursor-pointer text-xs font-mono font-semibold transition-all duration-150",
                unit === u ? "bg-cyan text-[#07091a]" : "text-tx2",
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {["required", "optional", "garnish"].map((role) => {
        const roleIngs = ings.filter((i) => i.role === role)
        if (!roleIngs.length) return null
        return (
          <div key={role} className="mb-3">
            {role !== "required" && (
              <div className="text-[11px] font-bold text-tx3 uppercase tracking-[0.06em] mb-1.5 font-display">
                {role}
              </div>
            )}
            {roleIngs.map((ri) => {
              const substitution = substitutions[ri.ingId]
              const isOwned = owned.has(ri.ingId) || Boolean(substitution)
              return (
                <div
                  key={ri.ingId}
                  className="flex items-center gap-3 py-2.5 border-b border-bdr"
                >
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full shrink-0",
                      isOwned
                        ? "bg-green shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                        : ri.role === "required"
                          ? "bg-coral"
                          : "bg-tx3",
                    )}
                  />
                  <span className="flex-1">
                    <span className="text-sm text-tx font-body">
                      {ri.name ?? ri.ingId}
                    </span>
                    {substitution && (
                      <span className="block text-[11px] text-tx3">
                        Substituting: {substitution.matchedName}
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] font-mono text-tx2 whitespace-nowrap">
                    {formatAmount(scaleIngredientAmount(ri, servings), unit)}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
      {missingOptional.length > 0 && (
        <p className="mt-2 text-xs text-tx3">
          Optional/garnish: {missingOptional.join(", ")} not in your bar — still
          makeable.
        </p>
      )}
    </div>
  )
}
