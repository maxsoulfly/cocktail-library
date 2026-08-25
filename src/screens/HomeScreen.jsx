import { useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  IconBookmark,
  IconBottle,
  IconCheck,
  IconChevR,
  IconHeart,
  IconSearch,
} from "@/components/icons"
import { GlassSvg } from "@/components/GlassSvg"
import { SmallCard } from "@/components/CocktailCard"
import { Card, SectionTitle } from "@/components/primitives"
import { rankPurchaseRecommendations } from "@/domain/recommendations"

export default function HomeScreen() {
  const navigate = useNavigate()
  const {
    computed,
    favorites,
    wantToMake,
    profile,
    email,
    ingredientTypesById,
    inventory,
  } = useOutletContext()
  const firstName = (profile?.display_name || email || "there").split(
    /[\s@]/,
  )[0]

  const perfect = computed.filter((c) => c.avail === "perfect")
  const good = computed.filter((c) => c.avail === "good")
  const almost = computed.filter((c) => c.avail === "almost")

  const buyNext = useMemo(
    () =>
      rankPurchaseRecommendations({
        computed,
        ingredientTypesById,
        favoriteIds: favorites,
        wantToMakeIds: wantToMake,
        limit: 2,
      }),
    [computed, ingredientTypesById, favorites, wantToMake],
  )

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
      <div className="pt-5 px-5 pb-0 bg-bg2 border-b border-bdr">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-tx2 font-display font-semibold uppercase tracking-[0.06em]">
              {greeting}
            </p>
            <h1 className="mt-0.5 text-2xl font-display font-extrabold text-tx tracking-[-0.02em]">
              {firstName}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/lists")}
              className="bg-surface border border-bdr rounded-sm py-1.5 px-3 cursor-pointer flex items-center gap-1.5 text-coral text-xs font-display font-semibold"
            >
              <IconHeart size={14} /> {favorites.size}
            </button>
            <button
              onClick={() => navigate("/lists")}
              className="bg-surface border border-bdr rounded-sm py-1.5 px-3 cursor-pointer flex items-center gap-1.5 text-violet text-xs font-display font-semibold"
            >
              <IconBookmark size={14} /> {wantToMake.size}
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-2.5 bg-surface border border-bdr rounded py-2.5 px-3.5 w-full cursor-text mb-4"
        >
          <IconSearch size={16} className="text-tx3" />
          <span className="text-tx3 text-sm font-body">
            Search cocktails...
          </span>
        </button>
      </div>

      <div className="pt-5 px-5 pb-0">
        {perfect.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Ready to Pour</SectionTitle>
              <span className="text-xs font-mono text-perfect">
                ✦ {perfect.length}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {perfect.map((c) => (
                <SmallCard
                  key={c.id}
                  c={c}
                  onClick={() => navigate(`/library/${c.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {good.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Good Enough</SectionTitle>
              <span className="text-xs font-mono text-good">
                ◎ {good.length}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {good.map((c) => (
                <SmallCard
                  key={c.id}
                  c={c}
                  onClick={() => navigate(`/library/${c.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {almost.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Almost There</SectionTitle>
              <span className="text-xs font-mono text-almost">
                ◐ {almost.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {almost.map((c) => (
                <Card
                  key={c.id}
                  className="py-3 px-4 cursor-pointer flex items-center gap-3"
                  onClick={() => navigate(`/library/${c.id}`)}
                >
                  <GlassSvg
                    type={c.glassShape}
                    liquidColor={c.liquidColor}
                    liquidColor2={c.liquidColor2}
                    size={40}
                    avail="almost"
                  />
                  <div className="flex-1">
                    <div className="text-[15px] font-display font-bold text-tx mb-0.5">
                      {c.name}
                    </div>
                    <div className="text-xs text-tx2">
                      Missing:{" "}
                      <span className="text-almost font-semibold">
                        {c.missingRequired[0]}
                      </span>
                    </div>
                  </div>
                  <IconChevR size={16} className="text-tx3" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {buyNext.length > 0 && (
          <div className="mb-6">
            <SectionTitle>Buy Next</SectionTitle>
            <div className="flex flex-col gap-2">
              {buyNext.map((candidate) => {
                const ing = ingredientTypesById.get(candidate.ingredientTypeId)
                return (
                  <Card
                    key={candidate.ingredientTypeId}
                    className="py-3.5 px-4"
                    style={{
                      border: "1px solid rgba(251,191,36,0.25)",
                      background: "rgba(251,191,36,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{
                          background: ing
                            ? `${ing.color}30`
                            : "var(--surface3)",
                          border: ing
                            ? `1px solid ${ing.color}50`
                            : "1px solid var(--border-s)",
                        }}
                      >
                        <IconBottle
                          size={18}
                          style={{ color: ing?.color ?? "var(--text2)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-display font-bold text-tx mb-0.5">
                          {candidate.name}
                        </div>
                        <div className="text-xs text-tx2">
                          {candidate.reason}
                        </div>
                        <div className="text-[11px] text-almost font-mono mt-1">
                          +{candidate.unlockCount}{" "}
                          {candidate.unlockCount === 1
                            ? "cocktail"
                            : "cocktails"}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          inventory.toggleType(candidate.ingredientTypeId)
                        }
                        title="Mark as owned in My Bar"
                        className="bg-surface3 border border-bdr rounded-sm w-9 h-9 shrink-0 flex items-center justify-center cursor-pointer text-green"
                      >
                        <IconCheck size={16} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
