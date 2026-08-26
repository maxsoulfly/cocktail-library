import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { GlassSvg } from "@/components/GlassSvg"
import { TasteTag } from "@/components/primitives"
import { formatAmount } from "@/domain/availability"
import { fetchSharedRecipe } from "@/services/sharedRecipe"

const ROLE_HEADING = { optional: "Optional", garnish: "Garnish" }

// Plain, read-only, no-login recipe view - reachable at /share/:id (see
// App.jsx, this route sits entirely outside the authenticated app shell, no
// session/membership check at all). No favorite/want-to-make/availability -
// none of that means anything without a signed-in member's own My Bar, so
// this is deliberately just "here's the recipe," nothing interactive beyond
// the ml/oz toggle. No download affordance either, per the user's own
// framing - a page to look at, not to save.
export default function SharedRecipeScreen() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unit, setUnit] = useState("ml")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchSharedRecipe(id)
      .then((data) => {
        if (!cancelled) setRecipe(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="min-h-dvh bg-bg flex justify-center">
      <div className="w-full max-w-[520px] p-5 flex flex-col gap-6">
        <div className="text-center pt-2">
          <span className="font-display font-extrabold text-cyan tracking-[-0.02em]">
            Rusty Pipes
          </span>
        </div>

        {loading ? (
          <p className="text-center text-tx3 text-sm">Loading...</p>
        ) : error || !recipe ? (
          <div className="text-center text-tx3 text-sm py-10">
            <p className="font-display font-semibold text-tx text-base mb-2">
              Recipe not available
            </p>
            <p>
              This link may be wrong, or the recipe it points to isn't publicly
              shared.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 p-5 bg-surface rounded-xl border border-bdr">
              <GlassSvg
                type={recipe.glassShape}
                liquidColor={recipe.liquidColor}
                liquidColor2={recipe.liquidColor2}
                size={96}
                avail="perfect"
              />
              <div className="text-center">
                <h1 className="font-display font-extrabold text-xl text-tx mb-1">
                  {recipe.name}
                </h1>
                {recipe.author && (
                  <span className="text-xs text-tx3">by {recipe.author}</span>
                )}
              </div>
              {recipe.taste.length > 0 && (
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {recipe.taste.map((t) => (
                    <TasteTag key={t} label={t} />
                  ))}
                </div>
              )}
              {recipe.family && (
                <span className="text-xs text-tx3 font-mono">
                  Family: {recipe.family}
                </span>
              )}
            </div>

            {recipe.description && (
              <p className="text-sm text-tx2 leading-[1.6]">
                {recipe.description}
              </p>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-tx3 uppercase tracking-[0.06em] font-display">
                  Ingredients
                </span>
                <div className="flex bg-surface border border-bdr rounded-sm overflow-hidden">
                  {["ml", "oz"].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={
                        "py-1 px-3 border-none cursor-pointer text-xs font-mono font-semibold transition-all duration-150 " +
                        (unit === u ? "bg-cyan text-[#07091a]" : "text-tx2")
                      }
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {["required", "optional", "garnish"].map((role) => {
                const roleIngs = recipe.ings.filter((i) => i.role === role)
                if (roleIngs.length === 0) return null
                return (
                  <div key={role} className="mb-3">
                    {ROLE_HEADING[role] && (
                      <div className="text-[11px] font-bold text-tx3 uppercase tracking-[0.06em] mb-1.5 font-display">
                        {ROLE_HEADING[role]}
                      </div>
                    )}
                    {roleIngs.map((ri, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-bdr"
                      >
                        <span className="text-sm text-tx font-body">
                          {ri.name}
                        </span>
                        <span className="text-[13px] font-mono text-tx2 whitespace-nowrap">
                          {formatAmount(
                            {
                              amount: Number(ri.amount),
                              unitLabel: ri.unitLabel,
                            },
                            unit,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            <div>
              <span className="text-[11px] font-bold text-tx3 uppercase tracking-[0.06em] font-display mb-3 block">
                Preparation
              </span>
              <div className="flex flex-col gap-2.5">
                {recipe.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-5.5 h-5.5 rounded-full bg-surface3 border border-bdr shrink-0 flex items-center justify-center text-[11px] font-mono text-cyan font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-tx leading-[1.55]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {recipe.glass && (
              <p className="text-center text-xs text-tx3 font-mono">
                Serve in: {recipe.glass}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
